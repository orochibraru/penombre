import {
	EXCEL_WIDTH,
	type Freeze,
	type SheetLayout,
} from "#lib/sheet/layout.js";
import { patchSheet } from "#lib/sheet/styles.js";

import type { SheetState } from "./state.svelte.js";

/** Column widths and frozen panes: saved with an `.xlsx`, view only on a CSV. */

export const DEFAULT_WIDTH = 112;
/** The narrowest a column can be dragged. */
const MIN_WIDTH = 40;

export function columnWidth(sheet: SheetState, col: number): number {
	const live = sheet.resizing;
	if (live?.col === col) {
		return live.width;
	}
	const own = sheet.sheet;
	return (
		own?.widths?.[col] ||
		own?.defaultWidth ||
		(sheet.workbook ? EXCEL_WIDTH : DEFAULT_WIDTH)
	);
}

/** A layout change: one undo step and a save, or just the view when nothing saves. */
function setLayout(sheet: SheetState, patch: SheetLayout): void {
	const book = patchSheet(sheet.book, sheet.active, patch);
	if (sheet.readOnly || !sheet.workbook) {
		sheet.book = book;
	} else {
		sheet.apply(book);
	}
}

/** `done` false while dragging: drawn at once, saved on the drop. */
export function resizeColumn(
	sheet: SheetState,
	col: number,
	width: number,
	done: boolean,
): void {
	const next = Math.max(MIN_WIDTH, Math.round(width));
	if (!done) {
		sheet.resizing = { col, width: next };
		return;
	}
	sheet.resizing = null;
	const widths = (sheet.sheet?.widths ?? []).slice();
	while (widths.length <= col) {
		widths.push(0);
	}
	if (widths[col] !== next) {
		widths[col] = next;
		setLayout(sheet, { widths });
	}
}

/** A CSV opens with its first row as a header; a workbook as its file says. */
export function freezeOf(sheet: SheetState): Freeze {
	return (
		sheet.sheet?.freeze ??
		(sheet.workbook ? { rows: 0, cols: 0 } : { rows: 1, cols: 0 })
	);
}

/** Freezes the first row or column, or unfreezes them. */
export function setFreeze(
	sheet: SheetState,
	axis: keyof Freeze,
	on: boolean,
): void {
	const freeze = freezeOf(sheet);
	if (freeze[axis] > 0 !== on) {
		setLayout(sheet, { freeze: { ...freeze, [axis]: on ? 1 : 0 } });
	}
}

/**
 * Where a floating chart or picture starts. One anchored inside the frozen
 * rows starts below them, as Google draws it, or the header hides its top.
 */
export function anchorTop(
	sheet: SheetState,
	anchor: { row: number; y: number },
	rowHeight: number,
): number {
	return anchor.row < sheet.bodyStart
		? (1 + sheet.bodyStart) * rowHeight
		: (1 + anchor.row) * rowHeight + anchor.y;
}
