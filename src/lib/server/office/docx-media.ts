import {
	childNamed,
	isElement,
	parseXml,
	serializeXml,
	type XmlDocument,
	type XmlElement,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * Pictures the editor added, written into a `.docx` as Word writes its own:
 * a media part, a relationship, a content type and an inline drawing sized
 * from the image's own header.
 */

export const IMAGE_TYPE =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";

/** Formats every Word since 2007 draws; the editor converts anything else. */
const PICTURE_EXTENSIONS: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpeg",
	"image/gif": "gif",
};

/** Our own media parts, the only ones a save ever deletes. */
const OWN_MEDIA = "media/penombre-";

export class UnsupportedPictureError extends Error {}

export interface Picture {
	data: Uint8Array;
	extension: string;
	contentType: string;
	width: number;
	height: number;
}

interface Size {
	width: number;
	height: number;
}

function jpegSize(view: DataView): Size | null {
	let at = 2;
	while (at + 9 <= view.byteLength && view.getUint8(at) === 0xff) {
		const marker = view.getUint8(at + 1);
		if (marker === 0xff) {
			at++;
			continue;
		}
		// SOF0–SOF15, minus DHT, JPG and DAC, which share the range.
		if (
			marker >= 0xc0 &&
			marker <= 0xcf &&
			![0xc4, 0xc8, 0xcc].includes(marker)
		) {
			return { height: view.getUint16(at + 5), width: view.getUint16(at + 7) };
		}
		at += 2 + view.getUint16(at + 2);
	}
	return null;
}

/** Pixel size from a PNG, GIF or JPEG header, or null when it is none. */
export function pixelSize(data: Uint8Array): Size | null {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	let size: Size | null = null;
	if (data.length >= 24 && view.getUint32(0) === 0x89_50_4e_47) {
		size = { width: view.getUint32(16), height: view.getUint32(20) };
	} else if (data.length >= 10 && view.getUint32(0) === 0x47_49_46_38) {
		size = { width: view.getUint16(6, true), height: view.getUint16(8, true) };
	} else if (data.length >= 4 && view.getUint16(0) === 0xff_d8) {
		size = jpegSize(view);
	}
	return size && size.width > 0 && size.height > 0 ? size : null;
}

/**
 * The picture a `src` carries, or null when it carries none (a link to
 * somewhere else, which nothing on the server should fetch). A picture in a
 * format Word cannot draw is refused rather than written as a broken part.
 */
export function pictureFromSource(src: string): Picture | null {
	const match = /^data:([^;,]+);base64,(.*)$/s.exec(src);
	if (!match) {
		return null;
	}
	const contentType = (match[1] ?? "").toLowerCase();
	const extension = PICTURE_EXTENSIONS[contentType];
	if (!extension) {
		throw new UnsupportedPictureError(
			`A ${contentType} picture cannot go into a Word file`,
		);
	}
	const data = new Uint8Array(Buffer.from(match[2] ?? "", "base64"));
	const size = pixelSize(data);
	if (!size) {
		throw new UnsupportedPictureError("A picture's data is not an image");
	}
	return { data, extension, contentType, ...size };
}

const EMU_PER_PIXEL = 9525;
const EMU_PER_TWIP = 635;
/** A4 less two one-inch margins, for a body with no section properties. */
const DEFAULT_TEXT_WIDTH = 9026;

/** How wide the text column is, in EMU: a picture never outgrows it. */
export function textWidth(body: XmlElement): number {
	const section = childNamed(body, "w:sectPr");
	const size = section && childNamed(section, "w:pgSz");
	const margins = section && childNamed(section, "w:pgMar");
	const twips = (node: XmlElement | undefined, name: string) =>
		Number(node?.attrs[name] ?? 0) || 0;
	const width =
		twips(size, "w:w") - twips(margins, "w:left") - twips(margins, "w:right");
	return (width > 0 ? width : DEFAULT_TEXT_WIDTH) * EMU_PER_TWIP;
}

/** The highest drawing id in use, so a new one never repeats it. */
export function highestDrawingId(body: XmlElement): number {
	let highest = 0;
	const visit = (node: XmlElement) => {
		if (node.name === "wp:docPr") {
			highest = Math.max(highest, Number(node.attrs.id) || 0);
		}
		node.children.filter(isElement).forEach(visit);
	};
	visit(body);
	return highest;
}

/** The run that draws a picture inline, at its own size or the column's. */
export function drawingRun(
	picture: Picture,
	relationship: string,
	id: number,
	maxWidth: number,
): XmlElement {
	const scale = Math.min(1, maxWidth / (picture.width * EMU_PER_PIXEL));
	const cx = Math.round(picture.width * EMU_PER_PIXEL * scale);
	const cy = Math.round(picture.height * EMU_PER_PIXEL * scale);
	const name = `Picture ${id}`;
	const source = `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${name}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationship}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
	return parseXml(source).root;
}

/** Store a picture as a new media part; returns its target, `media/…`. */
export function addMediaPart(entries: ZipEntry[], picture: Picture): string {
	let index = 1;
	const target = () => `${OWN_MEDIA}${index}.${picture.extension}`;
	while (entries.some((entry) => entry.name === `word/${target()}`)) {
		index++;
	}
	// Already compressed: deflating a PNG again buys nothing.
	entries.push({ name: `word/${target()}`, data: picture.data, stored: true });
	return target();
}

/** Declare each extension's content type, unless the package already does. */
export function declareMediaTypes(
	entries: ZipEntry[],
	types: Map<string, string>,
): void {
	const source = partText(entries, "[Content_Types].xml");
	if (!source || types.size === 0) {
		return;
	}
	const document = parseXml(source);
	const declared = new Set(
		document.root.children
			.filter(isElement)
			.map((node) => node.attrs.Extension?.toLowerCase()),
	);
	const missing = [...types].filter(([extension]) => !declared.has(extension));
	if (missing.length === 0) {
		return;
	}
	document.root.children.unshift(
		...missing.map(
			([extension, contentType]): XmlElement => ({
				type: "element",
				name: "Default",
				attrs: { Extension: extension, ContentType: contentType },
				children: [],
			}),
		),
	);
	setPartText(entries, "[Content_Types].xml", serializeXml(document));
}

/**
 * Drop the pictures we added that the body no longer draws, part and all.
 * Only ours: a part Word wrote may be drawn from somewhere we never read.
 */
export function pruneOwnMedia(
	entries: ZipEntry[],
	rels: XmlDocument,
	body: XmlElement,
): boolean {
	const used = new Set<string>();
	const visit = (node: XmlElement) => {
		const id = node.name === "a:blip" ? node.attrs["r:embed"] : undefined;
		if (id) {
			used.add(id);
		}
		node.children.filter(isElement).forEach(visit);
	};
	visit(body);
	const before = rels.root.children.length;
	rels.root.children = rels.root.children.filter((node) => {
		const target = isElement(node) ? (node.attrs.Target ?? "") : "";
		if (!(isElement(node) && target.startsWith(OWN_MEDIA))) {
			return true;
		}
		if (used.has(node.attrs.Id ?? "")) {
			return true;
		}
		const at = entries.findIndex((entry) => entry.name === `word/${target}`);
		if (at !== -1) {
			entries.splice(at, 1);
		}
		return false;
	});
	return rels.root.children.length !== before;
}
