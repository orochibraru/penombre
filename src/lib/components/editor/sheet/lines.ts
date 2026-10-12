import { display, isFormula } from "#lib/formula.js";
import { restructure, sortRows } from "#lib/sheet/book.js";
import { mergeRects } from "#lib/sheet/merges.js";
import { single } from "#lib/sheet/selection.js";
import { literal } from "#lib/sheet/values.js";
import type { SheetState } from "./state.svelte.js";

/** Rows and columns inserted, deleted and sorted, and Find. */

function lines(
	sheet: SheetState,
	axis: "row" | "col",
	at: number,
	count: number,
): void {
	sheet.commit();
	sheet.apply(restructure(sheet.book, sheet.active, { axis, at, count }));
}

export function insertLines(
	sheet: SheetState,
	axis: "row" | "col",
	after: boolean,
): void {
	const { top, bottom, left, right } = sheet.rect;
	if (axis === "row") {
		lines(sheet, "row", after ? bottom + 1 : top, bottom - top + 1);
	} else {
		lines(sheet, "col", after ? right + 1 : left, right - left + 1);
	}
}

export function deleteLines(sheet: SheetState, axis: "row" | "col"): void {
	const { top, bottom, left, right } = sheet.rect;
	if (axis === "row") {
		if (top >= sheet.rows.length) {
			return;
		}
		lines(
			sheet,
			"row",
			top,
			-(Math.min(bottom, sheet.rows.length - 1) - top + 1),
		);
		sheet.select(single(top, sheet.selection.anchor.col));
		return;
	}
	if (left >= sheet.width) {
		return;
	}
	lines(sheet, "col", left, -(Math.min(right, sheet.width - 1) - left + 1));
	sheet.select(single(sheet.selection.anchor.row, left));
}

/**
 * Sorts the rows below the header by a column; formats follow their rows.
 * Refused, as in Sheets, when a merge lies in the rows that would move:
 * false then.
 */
export function sortSheet(
	sheet: SheetState,
	descending: boolean,
	col: number,
): boolean {
	sheet.commit();
	if (
		mergeRects(sheet.sheet?.merges).some((m) => m.bottom >= sheet.bodyStart)
	) {
		return false;
	}
	const key = (row: number) => {
		const value = isFormula(sheet.raw(row, col))
			? sheet.engine.value(sheet.active, row, col)
			: literal(sheet.raw(row, col));
		return typeof value === "number" ? value : display(value);
	};
	// Sorted as indices, so the formats can follow their rows.
	const order = sortRows(
		sheet.rows.map((_, i) => [String(i)]),
		sheet.bodyStart,
		descending,
		key,
	).map(([i]) => Number(i));
	const rows = order.map((i) => sheet.rows[i] ?? []);
	const styleIds = order.map((i) => sheet.styleIds[i] ?? []);
	const current = sheet.sheet;
	sheet.apply({
		...sheet.book,
		sheets: sheet.book.sheets.map((s) =>
			// The file's recorded values are by position, which just moved.
			s === current
				? {
						id: s.id,
						name: s.name,
						rows,
						charts: s.charts,
						styleIds,
						merges: s.merges,
					}
				: s,
		),
	});
	return true;
}

/** The next cell after the active one whose text or value holds `query`. */
export function findNext(sheet: SheetState, query: string): boolean {
	const needle = query.trim().toLowerCase();
	if (!needle) {
		return true;
	}
	const width = sheet.width;
	const total = sheet.rows.length * width;
	const { row, col } = sheet.selection.anchor;
	for (let step = 1; step <= total; step++) {
		const at = (row * width + col + step) % total;
		const r = Math.floor(at / width);
		const c = at % width;
		const raw = sheet.raw(r, c);
		if (
			raw.toLowerCase().includes(needle) ||
			(isFormula(raw) && sheet.shown(r, c).toLowerCase().includes(needle))
		) {
			sheet.select(single(r, c));
			return true;
		}
	}
	return false;
}
