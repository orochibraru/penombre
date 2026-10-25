import { mergeRects, rangeOf } from "#lib/sheet/merges.js";
import { BUILTIN_FORMATS } from "#lib/sheet/number-formats.js";
import {
	type BorderEdge,
	type CellStyle,
	normalizeStyle,
	type Side,
	SIDES,
	type StyleDefaults,
} from "#lib/sheet/styles.js";
import {
	colourOf,
	type Palette,
	readPalette,
	relatedPart,
} from "./xlsx-colours";
import {
	childNamed,
	childrenNamed,
	element,
	findElement,
	findElements,
	isElement,
	parseXml,
	type XmlDocument,
	type XmlElement,
	type XmlNode,
} from "./xml";
import { partText, type ZipEntry } from "./zip";

/**
 * `styles.xml` read into the editor's `CellStyle`s, one per `cellXfs` entry,
 * plus the worksheet's own formatting: column and row styles, merges.
 * Appending new styles is `xlsx-style-writer.ts`.
 */

const stylesPath = (entries: ZipEntry[]) =>
	relatedPart(entries, "styles") ?? "xl/styles.xml";

// =========================================================================
// Reading
// =========================================================================

const isOn = (node: XmlElement | undefined) =>
	node !== undefined &&
	node.attrs.val !== "0" &&
	node.attrs.val !== "false" &&
	node.attrs.val !== "none";

export const SIDE_NAMES: Record<Side, string[]> = {
	top: ["top"],
	right: ["right", "end"],
	bottom: ["bottom"],
	left: ["left", "start"],
};

function sideOf(border: XmlElement | undefined, side: Side) {
	if (!border) {
		return undefined;
	}
	for (const name of SIDE_NAMES[side]) {
		const found = childNamed(border, name);
		if (found) {
			return found;
		}
	}
	return undefined;
}

const HORIZONTAL: Record<string, CellStyle["align"]> = {
	left: "left",
	center: "center",
	centerContinuous: "center",
	right: "right",
	justify: "justify",
	distributed: "justify",
};

const VERTICAL: Record<string, CellStyle["valign"]> = {
	top: "top",
	center: "middle",
	bottom: "bottom",
	justify: "middle",
	distributed: "middle",
};

export class Stylesheet {
	readonly path: string;
	readonly document: XmlDocument | null;
	readonly palette: Palette;
	readonly formats = new Map<number, string>();
	readonly defaults: StyleDefaults;

	constructor(entries: ZipEntry[]) {
		this.path = stylesPath(entries);
		const source = partText(entries, this.path);
		this.document = source ? parseXml(source) : null;
		this.palette = readPalette(entries, this.document?.root ?? null);
		for (const format of this.list("numFmts", "numFmt")) {
			const id = Number(format.attrs.numFmtId);
			if (Number.isFinite(id)) {
				this.formats.set(id, format.attrs.formatCode ?? "");
			}
		}
		const font = this.list("fonts", "font")[0];
		const size = Number(font ? childNamed(font, "sz")?.attrs.val : NaN);
		this.defaults = {
			font: font ? childNamed(font, "name")?.attrs.val : undefined,
			size: Number.isFinite(size) ? size : undefined,
		};
	}

	list(holder: string, item: string): XmlElement[] {
		const parent = this.document
			? childNamed(this.document.root, holder)
			: undefined;
		return parent ? childrenNamed(parent, item) : [];
	}

	formatCode(id: number): string | undefined {
		return id === 0 ? undefined : (this.formats.get(id) ?? BUILTIN_FORMATS[id]);
	}

	private fontOf(xf: XmlElement): Record<string, unknown> {
		const font = this.list("fonts", "font")[Number(xf.attrs.fontId ?? 0)];
		if (!font) {
			return {};
		}
		return {
			bold: isOn(childNamed(font, "b")),
			italic: isOn(childNamed(font, "i")),
			strike: isOn(childNamed(font, "strike")),
			underline: isOn(childNamed(font, "u")),
			size: childNamed(font, "sz")?.attrs.val,
			font: childNamed(font, "name")?.attrs.val,
			color: colourOf(childNamed(font, "color"), this.palette),
		};
	}

	/** A solid fill's colour; a pattern's foreground stands in for it. */
	private fillOf(xf: XmlElement): string | undefined {
		const fill = this.list("fills", "fill")[Number(xf.attrs.fillId ?? 0)];
		const pattern = fill ? childNamed(fill, "patternFill") : undefined;
		const type = pattern?.attrs.patternType;
		if (!(pattern && type && type !== "none")) {
			return undefined;
		}
		return (
			colourOf(childNamed(pattern, "fgColor"), this.palette) ??
			(type === "solid"
				? undefined
				: colourOf(childNamed(pattern, "bgColor"), this.palette))
		);
	}

	private bordersOf(xf: XmlElement): Partial<Record<Side, BorderEdge>> {
		const border = this.list("borders", "border")[
			Number(xf.attrs.borderId ?? 0)
		];
		const borders: Partial<Record<Side, BorderEdge>> = {};
		for (const side of SIDES) {
			const node = sideOf(border, side);
			if (node?.attrs.style && node.attrs.style !== "none") {
				borders[side] = {
					style: node.attrs.style as BorderEdge["style"],
					color: colourOf(childNamed(node, "color"), this.palette),
				};
			}
		}
		return borders;
	}

	/** One `cellXfs` entry as the editor's style. */
	resolve(xf: XmlElement): CellStyle {
		const alignment = childNamed(xf, "alignment");
		const wrap = alignment?.attrs.wrapText;
		return normalizeStyle(
			{
				...this.fontOf(xf),
				fill: this.fillOf(xf),
				borders: this.bordersOf(xf),
				align: HORIZONTAL[alignment?.attrs.horizontal ?? ""],
				valign: VERTICAL[alignment?.attrs.vertical ?? ""],
				wrap: wrap === "1" || wrap === "true",
				format: this.formatCode(Number(xf.attrs.numFmtId ?? 0)),
			},
			this.defaults,
		);
	}

	styles(): CellStyle[] {
		const xfs = this.list("cellXfs", "xf").map((xf) => this.resolve(xf));
		return xfs.length > 0 ? xfs : [{}];
	}
}

/** Every `cellXfs` entry as the editor's style; index 0 always exists. */
export function readStyles(entries: ZipEntry[]): CellStyle[] {
	return new Stylesheet(entries).styles();
}

/** A worksheet's column styles (`<col style>`), by column index. */
export function columnStyles(document: XmlDocument): number[] {
	const styles: number[] = [];
	for (const col of findElements(document.root, "col")) {
		const style = Number(col.attrs.style ?? 0);
		if (!style) {
			continue;
		}
		const min = Number(col.attrs.min ?? 0);
		// A style on every column to the sheet's edge stops at the data.
		const max = Math.min(Number(col.attrs.max ?? min), min + 1024);
		for (let c = min; c <= max; c++) {
			styles[c - 1] = style;
		}
	}
	return styles;
}

/** The style a cell with no `<c>` of its own takes from its row or column. */
export function inheritedStyle(
	row: XmlElement | undefined,
	columns: number[],
	col: number,
): number {
	if (
		row &&
		(row.attrs.customFormat === "1" || row.attrs.customFormat === "true")
	) {
		return Number(row.attrs.s ?? 0);
	}
	return columns[col] ?? 0;
}

// =========================================================================
// Merges
// =========================================================================

export function readMerges(document: XmlDocument): string[] {
	const holder = findElement(document.root, "mergeCells");
	if (!holder) {
		return [];
	}
	return mergeRects(
		childrenNamed(holder, "mergeCell").map((cell) => cell.attrs.ref ?? ""),
	).map(rangeOf);
}

/** CT_Worksheet's children that come before `mergeCells`. */
const BEFORE_MERGES = [
	"sheetPr",
	"dimension",
	"sheetViews",
	"sheetFormatPr",
	"cols",
	"sheetData",
	"sheetCalcPr",
	"sheetProtection",
	"protectedRanges",
	"scenarios",
	"autoFilter",
	"sortState",
	"dataConsolidate",
	"customSheetViews",
];

/** The sheet's `<mergeCells>` replaced by `merges`, or removed. */
export function writeMerges(document: XmlDocument, merges: string[]): void {
	const root = document.root;
	const existing = childNamed(root, "mergeCells");
	if (merges.length === 0) {
		root.children = root.children.filter((child) => child !== existing);
		return;
	}
	const holder = existing ?? element("mergeCells");
	holder.attrs.count = String(merges.length);
	holder.children = merges.map((ref) => element("mergeCell", { ref }));
	if (!existing) {
		insertAfter(root, holder, BEFORE_MERGES);
	}
}

/** `node` placed after the last child named in `before`. */
export function insertAfter(
	parent: XmlElement,
	node: XmlNode,
	before: string[],
): void {
	let at = 0;
	parent.children.forEach((child, index) => {
		if (isElement(child) && before.includes(child.name)) {
			at = index + 1;
		}
	});
	parent.children.splice(at, 0, node);
}
