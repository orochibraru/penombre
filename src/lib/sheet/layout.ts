import type { ChartAnchor } from "../chart/model";
import { cellName, parseName } from "./selection";
import { moveTables, type SheetTable } from "./tables";

/**
 * How a sheet is laid out beside its cells: column widths, frozen panes,
 * hyperlinked cells, pictures. Widths and panes are saved back to the
 * `.xlsx`; links and pictures are shown only, and the file keeps its own.
 */

/** Excel's standard column, 8.43 characters of Calibri 11. */
export const EXCEL_WIDTH = 64;

/** Rows and columns frozen at the top and left, from the sheet's pane. */
export interface Freeze {
	rows: number;
	cols: number;
}

/** A picture floating over the sheet; `src` is a data URI made at load. */
export interface SheetPicture {
	id: string;
	name?: string;
	anchor: ChartAnchor;
	src: string;
}

export interface SheetLayout {
	/** Pixels by column; 0 or absent is `defaultWidth`. */
	widths?: number[];
	defaultWidth?: number;
	freeze?: Freeze;
	tables?: SheetTable[];
	/** Cells holding a hyperlink, `H2`. */
	links?: string[];
	pictures?: SheetPicture[];
}

/** Widths after columns are inserted (`count` > 0) or deleted. */
export function moveWidths(
	widths: number[],
	at: number,
	count: number,
): number[] {
	if (at >= widths.length) {
		return widths;
	}
	const next = widths.slice();
	if (count > 0) {
		next.splice(at, 0, ...Array.from({ length: count }, () => 0));
	} else {
		next.splice(at, -count);
	}
	return next;
}

/** Linked cells after rows or columns move; a deleted cell's link goes. */
export function moveLinks(
	links: string[],
	axis: "row" | "col",
	at: number,
	count: number,
): string[] {
	return links.flatMap((ref) => {
		const found = parseName(ref)?.anchor;
		if (!found) {
			return [];
		}
		const cell = { ...found };
		const n = cell[axis];
		if (n >= at) {
			if (count < 0 && n < at - count) {
				return [];
			}
			cell[axis] = n + count;
		}
		return [cellName(cell)];
	});
}

/**
 * A sheet's layout after rows or columns are inserted or deleted. Pictures
 * stay put: the file's anchors are not rewritten, so neither are these.
 */
export function moveLayout(
	sheet: SheetLayout,
	change: { axis: "row" | "col"; at: number; count: number },
): SheetLayout {
	const { axis, at, count } = change;
	const { widths, links, tables, defaultWidth, freeze, pictures } = sheet;
	return {
		...(defaultWidth ? { defaultWidth } : {}),
		...(freeze ? { freeze } : {}),
		...(pictures ? { pictures } : {}),
		...(widths
			? { widths: axis === "col" ? moveWidths(widths, at, count) : widths }
			: {}),
		...(links ? { links: moveLinks(links, axis, at, count) } : {}),
		...(tables ? { tables: moveTables(tables, axis, at, count) } : {}),
	};
}

/** What a save sends of the layout: never the pictures or table looks. */
export function savedLayout(sheet: SheetLayout) {
	return {
		...(sheet.widths ? { widths: sheet.widths } : {}),
		...(sheet.freeze ? { freeze: sheet.freeze } : {}),
		...(sheet.tables
			? { tables: sheet.tables.map(({ part, ref }) => ({ part, ref })) }
			: {}),
	};
}
