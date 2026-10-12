import { type Chart, checkChart } from "#lib/chart/model.js";
import { DEFAULT_COLOR_MAP, type Palette } from "#lib/slides/color.js";
import { readTheme, resolveTarget } from "../slides/parts";
import {
	element,
	parseXml,
	textContent,
	type XmlDocument,
	type XmlElement,
} from "../xml";
import { partText, type ZipEntry } from "../zip";
import { readChartXml } from "./chart-read";
import {
	all,
	EMU,
	first,
	kid,
	kids,
	local,
	openRels,
	REL,
	type Rels,
	relList,
	relTarget,
} from "./package";

/**
 * A worksheet's drawing read: which anchors hold charts, where they sit and
 * what each chart is. Anchors in cells are converted to pixels with Excel's
 * own column widths and row heights, read from the worksheet.
 */

/** The `r:id` of an element, whatever prefix the producer gave it. */
export const idOf = (node: XmlElement) =>
	Object.entries(node.attrs).find(([key]) => key.endsWith(":id"))?.[1];

/** The part a relationships document belongs to. */
const drawingOf = (rels: Rels) =>
	rels.path.replace(/_rels\/([^/]+)\.rels$/, "$1");

// =========================================================================
// Sheet geometry: Excel's sizes, for anchors given in cells
// =========================================================================

export interface Geometry {
	colWidth(col: number): number;
	rowHeight(row: number): number;
}

/** Column widths are characters of the default font; Calibri 11 is 7px. */
const charsToPx = (chars: number) => Math.round(chars * 7 + 5);

export function geometry(sheet: XmlElement | undefined): Geometry {
	const format = first(sheet, "sheetFormatPr");
	const baseCols = Number(format?.attrs.baseColWidth ?? 8);
	const defaultCol = format?.attrs.defaultColWidth
		? charsToPx(Number(format.attrs.defaultColWidth) - 5 / 7)
		: charsToPx(baseCols + 0.43);
	const defaultRow = (Number(format?.attrs.defaultRowHeight ?? 15) * 4) / 3;
	const cols = all(first(sheet, "cols"), "col").map((col) => ({
		min: Number(col.attrs.min) - 1,
		max: Number(col.attrs.max) - 1,
		px:
			col.attrs.hidden === "1"
				? 0
				: col.attrs.width
					? charsToPx(Number(col.attrs.width) - 5 / 7)
					: defaultCol,
	}));
	const rows = new Map<number, number>();
	for (const row of all(first(sheet, "sheetData"), "row")) {
		const ht = row.attrs.ht;
		if (ht || row.attrs.hidden === "1") {
			rows.set(
				Number(row.attrs.r) - 1,
				row.attrs.hidden === "1" ? 0 : (Number(ht) * 4) / 3,
			);
		}
	}
	return {
		colWidth: (col) =>
			cols.find((c) => col >= c.min && col <= c.max)?.px ?? defaultCol,
		rowHeight: (row) => rows.get(row) ?? defaultRow,
	};
}

const px = (emu: string | undefined) =>
	Math.round((Number(emu ?? 0) / EMU) * 100) / 100 || 0;

function marker(node: XmlElement | undefined) {
	return {
		col: Math.max(
			0,
			Number(textContent(kid(node, "col") ?? element("x"))) || 0,
		),
		row: Math.max(
			0,
			Number(textContent(kid(node, "row") ?? element("x"))) || 0,
		),
		x: px(textContent(kid(node, "colOff") ?? element("x"))),
		y: px(textContent(kid(node, "rowOff") ?? element("x"))),
	};
}

export function readAnchor(anchor: XmlElement, sizes: Geometry) {
	const kind = local(anchor);
	const ext = kid(anchor, "ext");
	if (kind === "oneCellAnchor") {
		return {
			...marker(kid(anchor, "from")),
			width: px(ext?.attrs.cx),
			height: px(ext?.attrs.cy),
		};
	}
	if (kind === "absoluteAnchor") {
		const pos = kid(anchor, "pos");
		return {
			row: 0,
			col: 0,
			x: px(pos?.attrs.x),
			y: px(pos?.attrs.y),
			width: px(ext?.attrs.cx),
			height: px(ext?.attrs.cy),
		};
	}
	const from = marker(kid(anchor, "from"));
	const to = marker(kid(anchor, "to"));
	let width = to.x - from.x;
	for (let c = from.col; c < to.col && c < from.col + 1000; c++) {
		width += sizes.colWidth(c);
	}
	let height = to.y - from.y;
	for (let r = from.row; r < to.row && r < from.row + 10_000; r++) {
		height += sizes.rowHeight(r);
	}
	return {
		...from,
		width: Math.round(Math.max(1, width) * 100) / 100,
		height: Math.round(Math.max(1, height) * 100) / 100,
	};
}

// =========================================================================
// A sheet's drawing
// =========================================================================

export interface Placed {
	/** The anchor element: `twoCellAnchor`, `oneCellAnchor`, `absoluteAnchor`. */
	anchor: XmlElement;
	/** What holds it: the drawing root, or an `mc:Choice`. */
	holder: XmlElement;
	relId: string;
	part: string;
	chart: Chart;
}

export interface Drawing {
	part: string;
	doc: XmlDocument;
	rels: Rels;
	charts: Placed[];
}

export interface Context {
	entries: ZipEntry[];
	palette: Palette;
}

export const ANCHORS = new Set([
	"twoCellAnchor",
	"oneCellAnchor",
	"absoluteAnchor",
]);

/** The theme's colours, through the workbook's relationship to it. */
export function workbookPalette(entries: ZipEntry[]): Palette {
	const rels = openRels(entries, "xl/workbook.xml");
	const rel = relList(rels).find((r) => r.attrs.Type === REL.theme);
	const part = rel
		? resolveTarget("xl/workbook.xml", rel.attrs.Target ?? "")
		: undefined;
	return {
		colors: readTheme(entries, part).theme.colors,
		colorMap: DEFAULT_COLOR_MAP,
	};
}

export function sheetDrawingPart(
	entries: ZipEntry[],
	sheetPath: string,
): {
	part: string;
	rels: Rels;
	element: XmlElement;
	sheet: XmlDocument;
} | null {
	const source = partText(entries, sheetPath);
	if (!source) {
		return null;
	}
	const sheet = parseXml(source);
	const node = kid(sheet.root, "drawing");
	if (!node) {
		return null;
	}
	const rels = openRels(entries, sheetPath);
	const part = relTarget(rels, sheetPath, idOf(node));
	return part && partText(entries, part) !== null
		? { part, rels, element: node, sheet }
		: null;
}

/** A chart nothing here can draw: shown as a placeholder, saved untouched. */
const opaque = (note: string): Omit<Chart, "id" | "anchor"> => ({
	type: "column",
	legend: "none",
	x: {},
	y: {},
	series: [],
	unsupported: [note],
});

/** The chart an anchor holds, if it holds one we can find. */
function placedChart(
	{ entries, palette }: Context,
	where: {
		anchor: XmlElement;
		holder: XmlElement;
		rels: Rels;
		sizes: Geometry;
	},
): Placed | null {
	const { anchor, holder, rels, sizes } = where;
	const ref = kids(first(anchor, "graphicData")).find(
		(n) => local(n) === "chart",
	);
	const relId = ref ? idOf(ref) : undefined;
	const part = relTarget(rels, drawingOf(rels), relId);
	const source = part ? partText(entries, part) : null;
	if (!(relId && part && source)) {
		return null;
	}
	let body: Omit<Chart, "id" | "anchor">;
	try {
		// Excel 2016's waterfall, treemap, funnel and friends.
		body = source.includes("office/drawing/2014/chartex")
			? opaque("chartex")
			: readChartXml(source, palette);
	} catch {
		body = opaque("unknown");
	}
	const chart = checkChart({
		...body,
		id: part,
		origin: part,
		anchor: readAnchor(anchor, sizes),
	});
	return chart ? { anchor, holder, relId, part, chart } : null;
}

export function readDrawing(
	context: Context,
	sheetPath: string,
): Drawing | null {
	const { entries } = context;
	const found = sheetDrawingPart(entries, sheetPath);
	if (!found) {
		return null;
	}
	const doc = parseXml(partText(entries, found.part) ?? "");
	const rels = openRels(entries, found.part);
	const sizes = geometry(
		parseXml(partText(entries, sheetPath) ?? "<worksheet/>").root,
	);
	const charts: Placed[] = [];
	const visit = (holder: XmlElement) => {
		for (const child of kids(holder)) {
			if (local(child) === "AlternateContent") {
				// The first choice is what a modern reader shows.
				const choice = kid(child, "Choice");
				if (choice) {
					visit(choice);
				}
			} else if (ANCHORS.has(local(child))) {
				const placed = placedChart(context, {
					anchor: child,
					holder,
					rels,
					sizes,
				});
				if (placed) {
					charts.push(placed);
				}
			}
		}
	};
	visit(doc.root);
	return { part: found.part, doc, rels, charts };
}

/** Each worksheet's charts, by the worksheet's part path. */
export function readSheetCharts(
	entries: ZipEntry[],
	sheetPath: string,
	palette: Palette = workbookPalette(entries),
): Chart[] {
	try {
		return (
			readDrawing({ entries, palette }, sheetPath)?.charts.map(
				(placed) => placed.chart,
			) ?? []
		);
	} catch {
		// A drawing we cannot read must not keep the cells from opening.
		return [];
	}
}
