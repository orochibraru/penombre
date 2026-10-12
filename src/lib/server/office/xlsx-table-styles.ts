import { BORDER_STYLES, type BorderStyle } from "#lib/sheet/styles.js";
import {
	TABLE_ELEMENTS,
	type TableEdge,
	type TableElement,
	type TableLayer,
} from "#lib/sheet/tables.js";
import { colourOf, type Palette, tint } from "./xlsx-colours";
import type { Stylesheet } from "./xlsx-styles";
import { childNamed, childrenNamed, type XmlElement } from "./xml";

/**
 * A table style's look per element: a custom one from `styles.xml`
 * (`tableStyles` pointing at `dxfs`), or one of Excel's built-in sixty
 * approximated from the theme. The built-ins are not in the file; their real
 * definitions are Excel's, and these reproduce each family's shape (header
 * fill, banding tint, borders) in its accent colour, not every pixel.
 */

export type TableStyle = Partial<Record<TableElement, TableLayer>>;

const isOn = (node: XmlElement | undefined) =>
	node !== undefined && !["0", "false"].includes(node.attrs.val ?? "1");

const EDGES: TableEdge[] = [
	"top",
	"right",
	"bottom",
	"left",
	"horizontal",
	"vertical",
];

/** A differential format as a table layer. */
function dxfLayer(dxf: XmlElement, palette: Palette): TableLayer {
	const layer: TableLayer = {};
	const font = childNamed(dxf, "font");
	if (font) {
		for (const [tag, flag] of [
			["b", "bold"],
			["i", "italic"],
			["u", "underline"],
			["strike", "strike"],
		] as const) {
			if (isOn(childNamed(font, tag))) {
				layer[flag] = true;
			}
		}
		const color = colourOf(childNamed(font, "color"), palette);
		if (color) {
			layer.color = color;
		}
	}
	const pattern = childNamed(childNamed(dxf, "fill") ?? dxf, "patternFill");
	if (pattern && pattern.attrs.patternType !== "none") {
		// A differential fill's colour is its background, unlike a cell's.
		const fill =
			colourOf(childNamed(pattern, "bgColor"), palette) ??
			colourOf(childNamed(pattern, "fgColor"), palette);
		if (fill) {
			layer.fill = fill;
		}
	}
	const border = childNamed(dxf, "border");
	for (const edge of EDGES) {
		const node = border ? childNamed(border, edge) : undefined;
		const style = node?.attrs.style as BorderStyle | undefined;
		if (node && style && BORDER_STYLES.includes(style)) {
			layer.borders ??= {};
			const color = colourOf(childNamed(node, "color"), palette);
			layer.borders[edge] = { style, ...(color ? { color } : {}) };
		}
	}
	return layer;
}

/** A `tableStyle` from the file, by name. */
function customStyle(stylesheet: Stylesheet, name: string): TableStyle | null {
	const definition = stylesheet
		.list("tableStyles", "tableStyle")
		.find((style) => style.attrs.name === name);
	if (!definition) {
		return null;
	}
	const dxfs = stylesheet.list("dxfs", "dxf");
	const style: TableStyle = {};
	for (const item of childrenNamed(definition, "tableStyleElement")) {
		const type = item.attrs.type as TableElement;
		const dxf = dxfs[Number(item.attrs.dxfId)];
		if (!TABLE_ELEMENTS.includes(type)) {
			continue;
		}
		const layer = dxf ? dxfLayer(dxf, stylesheet.palette) : {};
		const size = Number(item.attrs.size);
		style[type] = size > 1 ? { ...layer, size } : layer;
	}
	return style;
}

// =========================================================================
// Excel's built-in styles, approximated
// =========================================================================

/** Office's theme, for a workbook that carries none. */
const OFFICE = [
	"FFFFFF",
	"000000",
	"E7E6E6",
	"44546A",
	"4472C4",
	"ED7D31",
	"A5A5A5",
	"FFC000",
	"5B9BD5",
	"70AD47",
];

const WHITE = "#FFFFFF";
const BLACK = "#000000";

const line = (color: string, style: BorderStyle = "thin") => ({
	style,
	color,
});

/** Builders by family; `c` is the style's colour, `t` tints it. */
type Family = (c: string, t: (amount: number) => string) => TableStyle;

const outer = (color: string) => ({
	top: line(color),
	bottom: line(color),
	left: line(color),
	right: line(color),
});

const grid = (color: string) => ({
	...outer(color),
	horizontal: line(color),
	vertical: line(color),
});

const bold = { bold: true } as const;
const totals = (c: string): TableLayer => ({
	...bold,
	borders: { top: line(c, "double") },
});

const FAMILIES: Record<string, Family> = {
	// Light 1-7: coloured rules, a tinted band.
	light1: (c, t) => ({
		wholeTable: { borders: { top: line(c), bottom: line(c) } },
		headerRow: { ...bold, borders: { bottom: line(c) } },
		totalRow: totals(c),
		firstColumn: bold,
		lastColumn: bold,
		firstRowStripe: { fill: t(0.8) },
		firstColumnStripe: { fill: t(0.8) },
	}),
	// Light 8-14: a solid header, an outline.
	light8: (c) => ({
		wholeTable: { borders: outer(c) },
		headerRow: { ...bold, fill: c, color: WHITE },
		totalRow: totals(c),
		firstColumn: bold,
		lastColumn: bold,
		firstRowStripe: { borders: { top: line(c), bottom: line(c) } },
	}),
	// Light 15-21: a full grid, a tinted band.
	light15: (c, t) => ({
		wholeTable: { borders: grid(c) },
		headerRow: { ...bold, borders: { bottom: line(c) } },
		totalRow: totals(c),
		firstColumn: bold,
		lastColumn: bold,
		firstRowStripe: { fill: t(0.8) },
		firstColumnStripe: { fill: t(0.8) },
	}),
	// Medium 1-7, Excel's default family: a solid header, light bands, rules.
	medium1: (c, t) => ({
		wholeTable: {
			borders: { ...outer(t(0.4)), horizontal: line(t(0.4)) },
		},
		headerRow: { ...bold, fill: c, color: WHITE },
		totalRow: totals(c),
		firstColumn: bold,
		lastColumn: bold,
		firstRowStripe: { fill: t(0.8) },
		firstColumnStripe: { fill: t(0.8) },
	}),
	// Medium 8-14: tinted body, white rules, solid header and edges.
	medium8: (c, t) => ({
		wholeTable: {
			fill: t(0.8),
			borders: { horizontal: line(WHITE), vertical: line(WHITE) },
		},
		headerRow: { ...bold, fill: c, color: WHITE },
		totalRow: { ...bold, fill: c, color: WHITE },
		firstColumn: { ...bold, fill: c, color: WHITE },
		lastColumn: { ...bold, fill: c, color: WHITE },
		firstRowStripe: { fill: t(0.6) },
		firstColumnStripe: { fill: t(0.6) },
	}),
	// Medium 15-21: black rules, solid header.
	medium15: (c, t) => ({
		wholeTable: { borders: { ...outer(BLACK), horizontal: line(BLACK) } },
		headerRow: { ...bold, fill: c, color: WHITE },
		totalRow: totals(BLACK),
		firstColumn: bold,
		lastColumn: bold,
		firstRowStripe: { fill: t(0.8) },
		firstColumnStripe: { fill: t(0.8) },
	}),
	// Medium 22-28: tinted body, tinted grid, stronger bands.
	medium22: (c, t) => ({
		wholeTable: { fill: t(0.8), borders: grid(t(0.4)) },
		headerRow: { ...bold },
		totalRow: totals(c),
		firstColumn: bold,
		lastColumn: bold,
		firstRowStripe: { fill: t(0.6) },
		firstColumnStripe: { fill: t(0.6) },
	}),
	// Dark 1-7: shaded body, white text, black header.
	dark1: (_c, t) => ({
		wholeTable: { fill: t(-0.25), color: WHITE },
		headerRow: {
			...bold,
			fill: BLACK,
			color: WHITE,
			borders: { bottom: line(WHITE, "medium") },
		},
		totalRow: { ...bold, borders: { top: line(WHITE, "double") } },
		firstColumn: { ...bold, fill: t(-0.5) },
		lastColumn: { ...bold, fill: t(-0.5) },
		firstRowStripe: { fill: t(-0.5) },
		firstColumnStripe: { fill: t(-0.5) },
	}),
	// Dark 8-11: tinted body, black header.
	dark8: (_c, t) => ({
		wholeTable: { fill: t(0.8) },
		headerRow: { ...bold, fill: BLACK, color: WHITE },
		totalRow: totals(BLACK),
		firstColumn: bold,
		lastColumn: bold,
		firstRowStripe: { fill: t(0.6) },
		firstColumnStripe: { fill: t(0.6) },
	}),
};

/** Which family and which theme slot a built-in name means. */
function familyOf(kind: string, n: number): [string, number] | null {
	const groups: Record<string, [number, string][]> = {
		Light: [
			[1, "light1"],
			[8, "light8"],
			[15, "light15"],
		],
		Medium: [
			[1, "medium1"],
			[8, "medium8"],
			[15, "medium15"],
			[22, "medium22"],
		],
		Dark: [[1, "dark1"]],
	};
	if (kind === "Dark" && n >= 8 && n <= 11) {
		// Dark 9-11 pair accents 1, 3 and 5 with the next.
		return ["dark8", [1, 4, 6, 8][n - 8] as number];
	}
	const limit = { Light: 21, Medium: 28, Dark: 7 }[kind] ?? 0;
	if (n < 1 || n > limit) {
		return null;
	}
	const [start, family] = (groups[kind] ?? []).findLast(
		([from]) => n >= from,
	) ?? [1, ""];
	const offset = n - start;
	// The first of each seven is neutral (dark 1), then accents 1 to 6.
	return [family, offset === 0 ? 1 : offset + 3];
}

function builtinStyle(name: string, palette: Palette): TableStyle | null {
	const match = /^TableStyle(Light|Medium|Dark)(\d+)$/.exec(name);
	if (!match) {
		return null;
	}
	const found = familyOf(match[1] as string, Number(match[2]));
	const family = found ? FAMILIES[found[0]] : undefined;
	if (!(found && family)) {
		return null;
	}
	const slot = found[1];
	const hex = palette.theme[slot] || (OFFICE[slot] as string);
	return family(`#${hex}`, (amount) => `#${tint(hex, amount)}`);
}

/** The style a table names, or null for none or one we do not know. */
export function tableStyle(
	stylesheet: Stylesheet,
	name: string | undefined,
): TableStyle | null {
	if (!name) {
		return null;
	}
	return (
		customStyle(stylesheet, name) ?? builtinStyle(name, stylesheet.palette)
	);
}
