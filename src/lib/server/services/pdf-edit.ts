/**
 * A PDF's pages and form fields as the mobile app overlays them, and its edits
 * written back with pdf-lib: annotations as real PDF annotations, form values
 * through the AcroForm, signatures drawn into the page.
 *
 * Every coordinate is in PDF user space (points, origin bottom left, before
 * the page's `/Rotate`); the client does the mapping to the screen.
 */

import {
	degrees,
	PDFArray,
	PDFCheckBox,
	PDFDict,
	PDFDocument,
	PDFDropdown,
	PDFName,
	PDFNumber,
	PDFOptionList,
	type PDFPage,
	PDFRadioGroup,
	PDFRef,
	PDFSignature,
	PDFString,
	PDFTextField,
} from "pdf-lib";

export type Rect = [x: number, y: number, width: number, height: number];
export type Colour = [red: number, green: number, blue: number];

export interface PdfPageBox {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: 0 | 90 | 180 | 270;
}

export type PdfFieldKind =
	"text" | "checkbox" | "radio" | "dropdown" | "list" | "button" | "signature";

export interface PdfField {
	name: string;
	kind: PdfFieldKind;
	/** Text, the chosen option, or `"true"`/`"false"` for a checkbox. */
	value: string | null;
	options: string[];
	readOnly: boolean;
	multiline: boolean;
	widgets: { page: number; rect: Rect; option: string | null }[];
}

export interface PdfLayout {
	pages: PdfPageBox[];
	fields: PdfField[];
}

export type PdfAnnotation =
	| { type: "highlight"; page: number; rects: Rect[]; color: Colour }
	| {
			type: "ink";
			page: number;
			/** Each stroke as flat x, y pairs. */
			strokes: number[][];
			color: Colour;
			width: number;
	  }
	| {
			type: "note";
			page: number;
			x: number;
			y: number;
			text: string;
			color: Colour;
	  };

export interface PdfSignaturePlacement {
	page: number;
	rect: Rect;
	/** `data:image/png;base64,…` */
	image: string;
}

export interface PdfEdits {
	annotations?: PdfAnnotation[];
	fields?: Record<string, string>;
	signatures?: PdfSignaturePlacement[];
	/** Who wrote the annotations, shown by viewers as their author. */
	author?: string;
}

/** A PDF this feature cannot open or write: encrypted, broken, or a bad edit. */
export class PdfEditError extends Error {}

const MAX_SIGNATURE_BYTES = 400_000;
const PNG_DATA_URL = "data:image/png;base64,";

async function open(bytes: Uint8Array): Promise<PDFDocument> {
	try {
		return await PDFDocument.load(bytes, { updateMetadata: false });
	} catch (cause) {
		throw new PdfEditError("This PDF is protected or damaged", { cause });
	}
}

function rotationOf(page: PDFPage): PdfPageBox["rotation"] {
	const angle = (((page.getRotation().angle % 360) + 360) % 360) as number;
	return angle === 90 || angle === 180 || angle === 270 ? angle : 0;
}

function pageBox(page: PDFPage): PdfPageBox {
	const box = page.getCropBox();
	return {
		x: box.x,
		y: box.y,
		width: box.width,
		height: box.height,
		rotation: rotationOf(page),
	};
}

function kindOf(field: unknown): PdfFieldKind {
	if (field instanceof PDFTextField) {
		return "text";
	}
	if (field instanceof PDFCheckBox) {
		return "checkbox";
	}
	if (field instanceof PDFRadioGroup) {
		return "radio";
	}
	if (field instanceof PDFDropdown) {
		return "dropdown";
	}
	if (field instanceof PDFOptionList) {
		return "list";
	}
	if (field instanceof PDFSignature) {
		return "signature";
	}
	return "button";
}

function valueOf(field: unknown): string | null {
	if (field instanceof PDFTextField) {
		return field.getText() ?? null;
	}
	if (field instanceof PDFCheckBox) {
		return field.isChecked() ? "true" : "false";
	}
	if (field instanceof PDFRadioGroup) {
		return field.getSelected() ?? null;
	}
	if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
		return field.getSelected()[0] ?? null;
	}
	return null;
}

function optionsOf(field: unknown): string[] {
	if (
		field instanceof PDFRadioGroup ||
		field instanceof PDFDropdown ||
		field instanceof PDFOptionList
	) {
		return field.getOptions();
	}
	return [];
}

/** The page a widget sits on: its `/P`, or the page whose `/Annots` hold it. */
function widgetPage(
	document: PDFDocument,
	widget: { P(): PDFRef | undefined; dict: PDFDict },
): number {
	const pages = document.getPages();
	const parent = widget.P();
	if (parent) {
		const index = pages.findIndex((page) => page.ref === parent);
		if (index >= 0) {
			return index;
		}
	}
	const ref = document.context.getObjectRef(widget.dict);
	return pages.findIndex((page) => {
		const annots = page.node.Annots();
		return (
			!!annots &&
			annots
				.asArray()
				.some((entry) => entry === ref || entry === (widget.dict as unknown))
		);
	});
}

export async function describePdf(bytes: Uint8Array): Promise<PdfLayout> {
	const document = await open(bytes);
	const pages = document.getPages().map(pageBox);
	const fields: PdfField[] = [];
	for (const field of document.getForm().getFields()) {
		const kind = kindOf(field);
		const options = optionsOf(field);
		const widgets = field.acroField.getWidgets().map((widget, index) => {
			const rect = widget.getRectangle();
			return {
				page: widgetPage(document, widget),
				rect: [rect.x, rect.y, rect.width, rect.height] as Rect,
				option: kind === "radio" ? (options[index] ?? null) : null,
			};
		});
		fields.push({
			name: field.getName(),
			kind,
			value: valueOf(field),
			options,
			readOnly: field.isReadOnly(),
			multiline: field instanceof PDFTextField && field.isMultiline(),
			widgets: widgets.filter((widget) => widget.page >= 0),
		});
	}
	return { pages, fields };
}

/** What `PDFContext.obj` takes: names, numbers, strings, nested dictionaries. */
type Entries = Parameters<PDFDocument["context"]["obj"]>[0] &
	Record<string, unknown>;

const number = (value: number) => Number(value.toFixed(3));

function bounds(points: [number, number][], pad: number): Rect {
	const xs = points.map(([x]) => x);
	const ys = points.map(([, y]) => y);
	const left = Math.min(...xs) - pad;
	const bottom = Math.min(...ys) - pad;
	return [
		left,
		bottom,
		Math.max(...xs) + pad - left,
		Math.max(...ys) + pad - bottom,
	];
}

const corners = ([x, y, w, h]: Rect) => [x, y, x + w, y + h].map(number);

const colourOps = (color: Colour, op: "rg" | "RG") =>
	`${color.map((part) => number(Math.min(1, Math.max(0, part)))).join(" ")} ${op}`;

function pdfDate(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, "0");
	return (
		`D:${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}` +
		`${pad(date.getUTCDate())}${pad(date.getUTCHours())}` +
		`${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
	);
}

/** A form XObject drawn with `content`, mapped onto `rect` one to one. */
function appearance(
	document: PDFDocument,
	rect: Rect,
	content: string,
	resources?: Entries,
): PDFRef {
	const stream = document.context.stream(content, {
		Type: "XObject",
		Subtype: "Form",
		BBox: corners(rect),
		...(resources ? { Resources: resources } : {}),
	});
	return document.context.register(stream);
}

function addAnnotation(
	document: PDFDocument,
	page: PDFPage,
	entries: Entries,
): void {
	const annotation = document.context.register(document.context.obj(entries));
	const existing = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
	if (existing) {
		existing.push(annotation);
	} else {
		page.node.set(PDFName.of("Annots"), document.context.obj([annotation]));
	}
}

/** Who wrote an annotation, and when. */
interface Signed {
	author?: string;
	now: Date;
}

function common(
	type: string,
	rect: Rect,
	color: Colour,
	{ author, now }: Signed,
) {
	return {
		Type: "Annot",
		Subtype: type,
		Rect: corners(rect),
		C: color.map(number),
		// Printable.
		F: 4,
		M: PDFString.of(pdfDate(now)),
		NM: PDFString.of(crypto.randomUUID()),
		...(author ? { T: PDFString.of(author) } : {}),
	};
}

function writeAnnotation(
	document: PDFDocument,
	page: PDFPage,
	annotation: PdfAnnotation,
	signed: Signed,
): void {
	if (annotation.type === "highlight") {
		const rects = annotation.rects.filter(([, , w, h]) => w > 0 && h > 0);
		if (rects.length === 0) {
			return;
		}
		const all = bounds(
			rects.flatMap(([x, y, w, h]): [number, number][] => [
				[x, y],
				[x + w, y + h],
			]),
			0,
		);
		const fill = rects
			.map(([x, y, w, h]) => `${[x, y, w, h].map(number).join(" ")} re`)
			.join(" ");
		addAnnotation(document, page, {
			...common("Highlight", all, annotation.color, signed),
			// Top left, top right, bottom left, bottom right: Acrobat's order.
			QuadPoints: rects.flatMap(([x, y, w, h]) =>
				[x, y + h, x + w, y + h, x, y, x + w, y].map(number),
			),
			CA: 0.45,
			AP: {
				N: appearance(
					document,
					all,
					`/GS gs ${colourOps(annotation.color, "rg")} ${fill} f`,
					{
						ExtGState: { GS: { Type: "ExtGState", BM: "Multiply", ca: 0.45 } },
					},
				),
			},
		});
		return;
	}

	if (annotation.type === "ink") {
		const strokes = annotation.strokes
			.map((flat) => {
				const points: [number, number][] = [];
				for (let index = 0; index + 1 < flat.length; index += 2) {
					points.push([flat[index] ?? 0, flat[index + 1] ?? 0]);
				}
				return points;
			})
			.filter((points) => points.length > 0);
		if (strokes.length === 0) {
			return;
		}
		const width = Math.min(Math.max(annotation.width, 0.25), 48);
		const rect = bounds(strokes.flat(), width);
		const path = strokes
			.map((points) => {
				const [first, ...rest] = points.map(
					([x, y]) => `${number(x)} ${number(y)}`,
				);
				// A tap is a dot: a zero-length line with round caps.
				const tail = rest.length > 0 ? rest : [first];
				return `${first} m ${tail.map((point) => `${point} l`).join(" ")}`;
			})
			.join(" ");
		addAnnotation(document, page, {
			...common("Ink", rect, annotation.color, signed),
			InkList: strokes.map((points) => points.flat().map(number)),
			BS: { W: number(width), S: "S" },
			AP: {
				N: appearance(
					document,
					rect,
					`${colourOps(annotation.color, "RG")} ${number(width)} w 1 J 1 j ${path} S`,
				),
			},
		});
		return;
	}

	const size = 20;
	const rect: Rect = [annotation.x, annotation.y - size, size, size];
	const [x, y] = rect;
	const lines = [0.7, 0.5, 0.3]
		.map(
			(at) =>
				`${number(x + 4)} ${number(y + size * at)} m ${number(x + size - 4)} ${number(y + size * at)} l`,
		)
		.join(" ");
	addAnnotation(document, page, {
		...common("Text", rect, annotation.color, signed),
		Contents: PDFString.of(annotation.text.slice(0, 5000)),
		Name: "Comment",
		Open: false,
		AP: {
			N: appearance(
				document,
				rect,
				`${colourOps(annotation.color, "rg")} 0.2 0.2 0.2 RG 0.6 w ` +
					`${number(x + 0.5)} ${number(y + 0.5)} ${size - 1} ${size - 1} re B ` +
					`0.25 0.25 0.25 RG 1 w ${lines} S`,
			),
		},
	});
}

/**
 * Where to draw an upright image so it fills `rect` (user space) on a page
 * shown turned by `rotation`: pdf-lib rotates counterclockwise about the
 * image's own bottom left corner.
 */
export function uprightPlacement(
	rect: Rect,
	rotation: PdfPageBox["rotation"],
): { x: number; y: number; width: number; height: number; rotate: number } {
	const [x, y, w, h] = rect;
	switch (rotation) {
		case 90:
			return { x: x + w, y, width: h, height: w, rotate: 90 };
		case 180:
			return { x: x + w, y: y + h, width: w, height: h, rotate: 180 };
		case 270:
			return { x, y: y + h, width: h, height: w, rotate: 270 };
		default:
			return { x, y, width: w, height: h, rotate: 0 };
	}
}

function pngBytes(dataUrl: string): Uint8Array {
	const encoded = dataUrl.startsWith(PNG_DATA_URL)
		? dataUrl.slice(PNG_DATA_URL.length)
		: "";
	if (!encoded || (encoded.length * 3) / 4 > MAX_SIGNATURE_BYTES) {
		throw new PdfEditError("A signature must be a small PNG");
	}
	return new Uint8Array(Buffer.from(encoded, "base64"));
}

function fill(document: PDFDocument, values: Record<string, string>): void {
	const form = document.getForm();
	for (const [name, value] of Object.entries(values)) {
		const field = form.getFieldMaybe(name);
		if (!field) {
			throw new PdfEditError(`No field named ${name}`);
		}
		if (field.isReadOnly()) {
			throw new PdfEditError(`${name} is read-only`);
		}
		try {
			if (field instanceof PDFTextField) {
				field.setText(value || undefined);
			} else if (field instanceof PDFCheckBox) {
				if (value === "true") {
					field.check();
				} else {
					field.uncheck();
				}
			} else if (field instanceof PDFRadioGroup) {
				if (value) {
					field.select(value);
				} else {
					field.clear();
				}
			} else if (
				field instanceof PDFDropdown ||
				field instanceof PDFOptionList
			) {
				if (value && !field.getOptions().includes(value)) {
					throw new PdfEditError(`${name} has no option ${value}`);
				}
				if (value) {
					field.select(value);
				} else {
					field.clear();
				}
			} else {
				throw new PdfEditError(`${name} cannot be filled in`);
			}
		} catch (cause) {
			if (cause instanceof PdfEditError) {
				throw cause;
			}
			throw new PdfEditError(`${name} does not take that value`, { cause });
		}
	}
}

export async function editPdf(
	bytes: Uint8Array,
	edits: PdfEdits,
	now = new Date(),
): Promise<Uint8Array> {
	const document = await open(bytes);
	const pages = document.getPages();
	const pageAt = (index: number) => {
		const page = pages[index];
		if (!page) {
			throw new PdfEditError(`This PDF has no page ${index + 1}`);
		}
		return page;
	};

	const values = edits.fields ?? {};
	if (Object.keys(values).length > 0) {
		fill(document, values);
	}
	for (const annotation of edits.annotations ?? []) {
		writeAnnotation(document, pageAt(annotation.page), annotation, {
			author: edits.author,
			now,
		});
	}
	for (const signature of edits.signatures ?? []) {
		const page = pageAt(signature.page);
		let image: Awaited<ReturnType<PDFDocument["embedPng"]>>;
		try {
			image = await document.embedPng(pngBytes(signature.image));
		} catch (cause) {
			if (cause instanceof PdfEditError) {
				throw cause;
			}
			throw new PdfEditError("The signature image is unreadable", { cause });
		}
		const place = uprightPlacement(signature.rect, rotationOf(page));
		page.drawImage(image, {
			x: place.x,
			y: place.y,
			width: place.width,
			height: place.height,
			rotate: degrees(place.rotate),
		});
	}
	return await document.save({ updateFieldAppearances: true });
}

/** How many annotations of each kind a page carries; for tests and checks. */
export async function annotationsOn(
	bytes: Uint8Array,
	pageIndex: number,
): Promise<{ subtype: string; contents: string | null; rect: number[] }[]> {
	const document = await PDFDocument.load(bytes);
	const page = document.getPage(pageIndex);
	const annots = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
	if (!annots) {
		return [];
	}
	return annots.asArray().map((entry) => {
		const dict = document.context.lookup(entry, PDFDict);
		const subtype = dict.get(PDFName.of("Subtype"));
		const contents = dict.lookupMaybe(PDFName.of("Contents"), PDFString);
		const rect = dict.lookupMaybe(PDFName.of("Rect"), PDFArray);
		return {
			subtype: subtype instanceof PDFName ? subtype.decodeText() : "",
			contents: contents?.decodeText() ?? null,
			rect:
				rect
					?.asArray()
					.map((part) => (part instanceof PDFNumber ? part.asNumber() : 0)) ??
				[],
		};
	});
}
