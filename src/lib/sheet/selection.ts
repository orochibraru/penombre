import { columnName, parseRef } from "../formula";

/**
 * A spreadsheet selection: the active cell (`anchor`, where typing goes) and
 * the opposite corner (`focus`, what Shift+arrows move). The rectangle
 * between them is the range every command applies to.
 */

export interface Cell {
	row: number;
	col: number;
}

export interface Selection {
	anchor: Cell;
	focus: Cell;
}

export interface Rect {
	top: number;
	left: number;
	bottom: number;
	right: number;
}

/** How far the grid goes: rows and columns, counts. */
export interface Bounds {
	rows: number;
	cols: number;
}

export const single = (row: number, col: number): Selection => ({
	anchor: { row, col },
	focus: { row, col },
});

export function rectOf({ anchor, focus }: Selection): Rect {
	return {
		top: Math.min(anchor.row, focus.row),
		left: Math.min(anchor.col, focus.col),
		bottom: Math.max(anchor.row, focus.row),
		right: Math.max(anchor.col, focus.col),
	};
}

export const inRect = (rect: Rect, row: number, col: number): boolean =>
	row >= rect.top &&
	row <= rect.bottom &&
	col >= rect.left &&
	col <= rect.right;

export const isSingle = ({ anchor, focus }: Selection): boolean =>
	anchor.row === focus.row && anchor.col === focus.col;

export function clamp(cell: Cell, bounds: Bounds): Cell {
	return {
		row: Math.min(Math.max(0, cell.row), Math.max(0, bounds.rows - 1)),
		col: Math.min(Math.max(0, cell.col), Math.max(0, bounds.cols - 1)),
	};
}

/** Click or Shift+click. */
export function moveTo(
	selection: Selection,
	cell: Cell,
	extend: boolean,
): Selection {
	return extend
		? { anchor: selection.anchor, focus: cell }
		: single(cell.row, cell.col);
}

/** Arrow keys: from the active cell, or the far corner with Shift. */
export function step(
	selection: Selection,
	delta: Cell,
	bounds: Bounds,
	extend: boolean,
): Selection {
	const from = extend ? selection.focus : selection.anchor;
	const cell = clamp(
		{ row: from.row + delta.row, col: from.col + delta.col },
		bounds,
	);
	return moveTo(selection, cell, extend);
}

/**
 * Ctrl+arrow, from `from`: to the end of the block of filled cells, or
 * across blanks to the next filled one, or to the edge.
 */
export function leap(
	from: Cell,
	delta: Cell,
	bounds: Bounds,
	filled: (row: number, col: number) => boolean,
): Cell {
	const inside = (row: number, col: number) =>
		row >= 0 && col >= 0 && row < bounds.rows && col < bounds.cols;
	let { row, col } = from;
	if (!inside(row + delta.row, col + delta.col)) {
		return from;
	}
	const running = filled(row, col) && filled(row + delta.row, col + delta.col);
	while (inside(row + delta.row, col + delta.col)) {
		const next = filled(row + delta.row, col + delta.col);
		if (running && !next) {
			break;
		}
		row += delta.row;
		col += delta.col;
		if (!running && next) {
			break;
		}
	}
	return { row, col };
}

export const cellName = ({ row, col }: Cell): string =>
	`${columnName(col)}${row + 1}`;

/** `B3`, or `A1:C4` for a range. */
export function rangeName(selection: Selection): string {
	if (isSingle(selection)) {
		return cellName(selection.anchor);
	}
	const rect = rectOf(selection);
	return `${cellName({ row: rect.top, col: rect.left })}:${cellName({
		row: rect.bottom,
		col: rect.right,
	})}`;
}

/** What the name box accepts: `B3` or `A1:C4`, any case, `$` allowed. */
export function parseName(text: string): Selection | null {
	const [from = "", to = from, extra] = text.trim().split(":");
	if (extra !== undefined) {
		return null;
	}
	try {
		const [row, col] = parseRef(from);
		const [toRow, toCol] = parseRef(to);
		return { anchor: { row, col }, focus: { row: toRow, col: toCol } };
	} catch {
		return null;
	}
}

export const selectAll = (bounds: Bounds): Selection => ({
	anchor: { row: 0, col: 0 },
	focus: {
		row: Math.max(0, bounds.rows - 1),
		col: Math.max(0, bounds.cols - 1),
	},
});

/** Whole rows `from`..`to`, as clicking row numbers does. */
export const rowsOf = (
	from: number,
	to: number,
	bounds: Bounds,
): Selection => ({
	anchor: { row: from, col: 0 },
	focus: { row: to, col: Math.max(0, bounds.cols - 1) },
});

/** Whole columns `from`..`to`, as clicking column letters does. */
export const colsOf = (
	from: number,
	to: number,
	bounds: Bounds,
): Selection => ({
	anchor: { row: 0, col: from },
	focus: { row: Math.max(0, bounds.rows - 1), col: to },
});
