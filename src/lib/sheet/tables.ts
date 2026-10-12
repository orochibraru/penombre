import { moveMerges, parseRange } from "./merges";
import type { Rect } from "./selection";
import type { BorderEdge, CellStyle, Side } from "./styles";

/**
 * Excel tables (`xl/tables/tableN.xml`) as the grid draws them: a range,
 * which of its rows and columns are special, and the table style's look for
 * each kind of region. The look is a layer under the cells' own styles: a
 * cell's own fill, colour or border wins where it sets one, as in Excel.
 */

/** Table style elements, the lowest precedence first (ECMA-376 §18.8.40). */
export const TABLE_ELEMENTS = [
	"wholeTable",
	"firstColumnStripe",
	"secondColumnStripe",
	"firstRowStripe",
	"secondRowStripe",
	"lastColumn",
	"firstColumn",
	"headerRow",
	"totalRow",
	"firstHeaderCell",
	"lastHeaderCell",
	"firstTotalCell",
	"lastTotalCell",
] as const;
export type TableElement = (typeof TABLE_ELEMENTS)[number];

/** A region's outer sides, plus the lines between its rows and columns. */
export type TableEdge = Side | "horizontal" | "vertical";

export interface TableLayer {
	bold?: true;
	italic?: true;
	underline?: true;
	strike?: true;
	color?: string;
	fill?: string;
	borders?: Partial<Record<TableEdge, BorderEdge>>;
	/** Rows (columns) per stripe. */
	size?: number;
}

export interface SheetTable {
	/** The table part, so a save finds it again. */
	part: string;
	ref: string;
	headerRows: number;
	totalRows: number;
	firstColumn?: true;
	lastColumn?: true;
	rowStripes?: true;
	columnStripes?: true;
	style?: Partial<Record<TableElement, TableLayer>>;
}

interface Hit {
	element: TableElement;
	region: Rect;
}

/** Which stripe `at` falls in, counting from `start`: 1, 2, or 0 for none. */
function stripe(table: SheetTable, kind: "Row" | "Column", offset: number) {
	const first = table.style?.[`first${kind}Stripe`]?.size || 1;
	const second = table.style?.[`second${kind}Stripe`]?.size || 1;
	const within = offset % (first + second);
	return within < first
		? { n: 1, from: offset - within, size: first }
		: { n: 2, from: offset - within + first, size: second };
}

/** The column stripe, then the row stripe, a body cell falls in. */
function stripes(table: SheetTable, body: Rect, row: number, col: number) {
	const out: Hit[] = [];
	if (table.columnStripes) {
		const s = stripe(table, "Column", col - body.left);
		out.push({
			element: s.n === 1 ? "firstColumnStripe" : "secondColumnStripe",
			region: {
				...body,
				left: body.left + s.from,
				right: body.left + s.from + s.size - 1,
			},
		});
	}
	if (table.rowStripes) {
		const s = stripe(table, "Row", row - body.top);
		out.push({
			element: s.n === 1 ? "firstRowStripe" : "secondRowStripe",
			region: {
				...body,
				top: body.top + s.from,
				bottom: body.top + s.from + s.size - 1,
			},
		});
	}
	return out;
}

/** The style elements that reach a cell of the table, lowest first. */
function hits(table: SheetTable, rect: Rect, row: number, col: number): Hit[] {
	const bodyTop = rect.top + table.headerRows;
	const bodyBottom = rect.bottom - table.totalRows;
	const header = table.headerRows > 0 && row === rect.top;
	const total = table.totalRows > 0 && row === rect.bottom;
	const body = row >= bodyTop && row <= bodyBottom;
	const out: Hit[] = [
		{ element: "wholeTable", region: rect },
		...(body
			? stripes(table, { ...rect, top: bodyTop, bottom: bodyBottom }, row, col)
			: []),
	];
	const column = { ...rect, left: col, right: col };
	const line = { ...rect, top: row, bottom: row };
	const cell = { ...line, left: col, right: col };
	if (table.lastColumn && col === rect.right) {
		out.push({ element: "lastColumn", region: column });
	}
	if (table.firstColumn && col === rect.left) {
		out.push({ element: "firstColumn", region: column });
	}
	if (header) {
		out.push({ element: "headerRow", region: line });
	}
	if (total) {
		out.push({ element: "totalRow", region: line });
	}
	const ends = [
		[header && table.firstColumn && col === rect.left, "firstHeaderCell"],
		[header && table.lastColumn && col === rect.right, "lastHeaderCell"],
		[total && table.firstColumn && col === rect.left, "firstTotalCell"],
		[total && table.lastColumn && col === rect.right, "lastTotalCell"],
	] as const;
	for (const [applies, element] of ends) {
		if (applies) {
			out.push({ element, region: cell });
		}
	}
	return out.filter((hit) => table.style?.[hit.element]);
}

/** The edge of `region` a side of the cell lies on: outer, or between. */
function edgeOf(region: Rect, side: Side, row: number, col: number) {
	switch (side) {
		case "top":
			return row === region.top ? "top" : "horizontal";
		case "bottom":
			return row === region.bottom ? "bottom" : "horizontal";
		case "left":
			return col === region.left ? "left" : "vertical";
		default:
			return col === region.right ? "right" : "vertical";
	}
}

const SIDES: Side[] = ["top", "right", "bottom", "left"];

/**
 * A cell's look from the table it sits in, and a key naming it: equal keys
 * are equal looks, so a caller can draw each once.
 */
export function tableLayer(
	table: SheetTable,
	rect: Rect,
	row: number,
	col: number,
): { key: string; style: CellStyle } {
	const style: CellStyle = {};
	const borders: CellStyle["borders"] = {};
	const key: string[] = [];
	for (const { element, region } of hits(table, rect, row, col)) {
		const layer = table.style?.[element] ?? {};
		const edges = SIDES.map((side) => edgeOf(region, side, row, col));
		key.push(`${element}:${edges.join(",")}`);
		for (const flag of ["bold", "italic", "underline", "strike"] as const) {
			if (layer[flag]) {
				style[flag] = true;
			}
		}
		if (layer.color) {
			style.color = layer.color;
		}
		if (layer.fill) {
			style.fill = layer.fill;
		}
		SIDES.forEach((side, i) => {
			const edge = layer.borders?.[edges[i] as TableEdge];
			if (edge) {
				borders[side] = edge;
			}
		});
	}
	if (Object.keys(borders).length > 0) {
		style.borders = borders;
	}
	return { key: key.join("|"), style };
}

/** A cell's own style over the table's: what the cell sets wins. */
export function layered(table: CellStyle, own: CellStyle): CellStyle {
	const merged: CellStyle = { ...table, ...own };
	if (table.borders || own.borders) {
		merged.borders = { ...table.borders, ...own.borders };
	}
	return merged;
}

/** Each table's range as a rectangle, null for one that does not parse. */
export const tableRects = (tables: readonly SheetTable[] | undefined) =>
	(tables ?? []).map((table) => parseRange(table.ref));

/** Tables after rows or columns move; one whose cells all went is gone. */
export function moveTables(
	tables: SheetTable[] | undefined,
	axis: "row" | "col",
	at: number,
	count: number,
): SheetTable[] | undefined {
	if (!tables) {
		return tables;
	}
	return tables.flatMap((table) => {
		const [ref] = moveMerges([table.ref], axis, at, count);
		return ref ? [ref === table.ref ? table : { ...table, ref }] : [];
	});
}
