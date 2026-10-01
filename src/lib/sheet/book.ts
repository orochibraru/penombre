import { parseCsv, toCsv } from "../documents";
import {
	adjustFormula,
	isFormula,
	type LineChange,
	renameSheetRefs,
	shiftFormula,
} from "../formula";
import type { Rect } from "./selection";

/**
 * The workbook the sheet editor edits, and every change it can make to one.
 *
 * Rows are never mutated in place: a change copies the list of rows and the
 * rows it touches, and returns a new workbook. That is what lets undo keep
 * whole states cheaply, and Svelte track them as plain values.
 *
 * A CSV is one sheet. An `.xlsx` travels as JSON (`{ sheets: [...] }`), each
 * sheet carrying its `sheetId` from the workbook so a save can find it again
 * after a rename, and new sheets a fresh one.
 */

export interface SheetData {
	/** The workbook's `sheetId`; a sheet added here takes the next free one. */
	id: number;
	name: string;
	rows: string[][];
	/** Values the file recorded for its formulas; see `SheetSource.cached`. */
	cached?: Record<string, [string, string]>;
}

export interface BookData {
	sheets: SheetData[];
}

export function parseBook(content: string, workbook: boolean): BookData {
	if (workbook) {
		const parsed = JSON.parse(content) as BookData;
		if (Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
			return parsed;
		}
	}
	return { sheets: [{ id: 1, name: "Sheet1", rows: parseCsv(content) }] };
}

/** Trailing blank rows and cells a cleared edit leaves behind. */
function trimmed(rows: string[][]): string[][] {
	let height = rows.length;
	while (height > 1 && (rows[height - 1] ?? []).every((cell) => cell === "")) {
		height--;
	}
	const kept = rows.slice(0, height);
	const width = Math.max(
		1,
		kept.reduce((widest, row) => {
			let end = row.length;
			while (end > 0 && row[end - 1] === "") {
				end--;
			}
			return Math.max(widest, end);
		}, 0),
	);
	return kept.map((row) =>
		Array.from({ length: width }, (_, col) => row[col] ?? ""),
	);
}

export function serializeBook(book: BookData, workbook: boolean): string {
	if (workbook) {
		return JSON.stringify({
			sheets: book.sheets.map(({ id, name, rows }) => ({ id, name, rows })),
		});
	}
	return toCsv(trimmed(book.sheets[0]?.rows ?? [[""]]));
}

/** Columns is the widest row. Reduced, never spread: 20k rows is a RangeError. */
export const widthOf = (rows: string[][]): number =>
	rows.reduce((widest, row) => Math.max(widest, row.length), 1);

/** The raw text of the cells in `rect`. */
export function blockAt(rows: string[][], rect: Rect): string[][] {
	const block: string[][] = [];
	for (let r = rect.top; r <= rect.bottom; r++) {
		const line: string[] = [];
		for (let c = rect.left; c <= rect.right; c++) {
			line.push(rows[r]?.[c] ?? "");
		}
		block.push(line);
	}
	return block;
}

/**
 * `block` written with its top-left at `top`, `left`, growing the grid when
 * it reaches past the end. Only the rows it touches are copied.
 */
export function writeBlock(
	rows: string[][],
	top: number,
	left: number,
	block: string[][],
): string[][] {
	const next = rows.slice();
	while (next.length < top + block.length) {
		next.push([]);
	}
	block.forEach((values, offset) => {
		const row = (next[top + offset] ?? []).slice();
		while (row.length < left + values.length) {
			row.push("");
		}
		row.splice(left, values.length, ...values);
		next[top + offset] = row;
	});
	return next;
}

/** Every cell of `rect` set to `value`. */
export function fillWith(
	rows: string[][],
	rect: Rect,
	value: string,
): string[][] {
	const width = rect.right - rect.left + 1;
	const block = Array.from({ length: rect.bottom - rect.top + 1 }, () =>
		Array.from({ length: width }, () => value),
	);
	return writeBlock(rows, rect.top, rect.left, block);
}

/** A block copied `rows` down and `cols` across: its formulas' references follow. */
export const shiftBlock = (
	block: string[][],
	rows: number,
	cols: number,
): string[][] =>
	block.map((line) => line.map((cell) => shiftFormula(cell, rows, cols)));

/**
 * `block` repeated over `rect` when the rectangle is a whole multiple of it,
 * as pasting one cell over a selection fills every cell of it. `shift` gives
 * each copy's formulas their own references.
 */
export function tile(
	block: string[][],
	rect: Rect,
	shift: boolean,
): string[][] {
	const height = block.length;
	const width = block[0]?.length ?? 1;
	const rectHeight = rect.bottom - rect.top + 1;
	const rectWidth = rect.right - rect.left + 1;
	if (rectHeight % height !== 0 || rectWidth % width !== 0) {
		return block;
	}
	const out: string[][] = [];
	for (let r = 0; r < rectHeight; r++) {
		const line: string[] = [];
		for (let c = 0; c < rectWidth; c++) {
			const cell = block[r % height]?.[c % width] ?? "";
			const rows = r - (r % height);
			const cols = c - (c % width);
			line.push(shift ? shiftFormula(cell, rows, cols) : cell);
		}
		out.push(line);
	}
	return out;
}

/**
 * Fill down (Ctrl+D) or right (Ctrl+R): the first row (column) of `rect`
 * copied over the rest, formulas shifted. A single cell copies the one above
 * (left of) it.
 */
export function fill(
	rows: string[][],
	rect: Rect,
	direction: "down" | "right",
): string[][] {
	const down = direction === "down";
	let source = { ...rect };
	if (down && rect.top === rect.bottom) {
		source = { ...rect, top: rect.top - 1 };
	} else if (!down && rect.left === rect.right) {
		source = { ...rect, left: rect.left - 1 };
	}
	if (source.top < 0 || source.left < 0) {
		return rows;
	}
	const block: string[][] = [];
	for (let r = source.top; r <= rect.bottom; r++) {
		const line: string[] = [];
		for (let c = source.left; c <= rect.right; c++) {
			const from = down ? { r: source.top, c } : { r, c: source.left };
			const text = rows[from.r]?.[from.c] ?? "";
			line.push(shiftFormula(text, r - from.r, c - from.c));
		}
		block.push(line);
	}
	return writeBlock(rows, source.top, source.left, block);
}

/** Lines moved for an insert or delete; formulas are rewritten separately. */
function moveLines(rows: string[][], change: LineChange): string[][] {
	const { axis, at, count } = change;
	if (axis === "row") {
		if (at >= rows.length) {
			return rows;
		}
		const next = rows.slice();
		if (count > 0) {
			next.splice(at, 0, ...Array.from({ length: count }, () => []));
		} else {
			next.splice(at, -count);
		}
		return next.length > 0 ? next : [[""]];
	}
	return rows.map((row) => {
		if (row.length <= at) {
			return row;
		}
		const next = row.slice();
		if (count > 0) {
			next.splice(at, 0, ...Array.from({ length: count }, () => ""));
		} else {
			next.splice(at, -count);
		}
		return next;
	});
}

/** Every formula of every sheet passed through `rewrite`; untouched rows kept. */
function rewriteFormulas(
	book: BookData,
	rewrite: (text: string, sheet: SheetData) => string,
): BookData {
	return {
		sheets: book.sheets.map((sheet) => {
			let changed = false;
			const rows = sheet.rows.map((row) => {
				if (!row.some(isFormula)) {
					return row;
				}
				const next = row.map((cell) =>
					isFormula(cell) ? rewrite(cell, sheet) : cell,
				);
				if (next.some((cell, i) => cell !== row[i])) {
					changed = true;
					return next;
				}
				return row;
			});
			return changed ? { ...sheet, rows } : sheet;
		}),
	};
}

/**
 * Rows or columns inserted or deleted on sheet `index`, with every formula in
 * the workbook that points at that sheet rewritten as Excel would.
 */
export function restructure(
	book: BookData,
	index: number,
	change: LineChange,
): BookData {
	const target = book.sheets[index];
	if (!target) {
		return book;
	}
	const rewritten = rewriteFormulas(book, (text, sheet) =>
		adjustFormula(text, change, target.name, sheet.name),
	);
	return {
		sheets: rewritten.sheets.map((sheet, i) =>
			i === index
				? // The file's recorded values are by position, which just moved.
					{
						id: sheet.id,
						name: sheet.name,
						rows: moveLines(sheet.rows, change),
					}
				: sheet,
		),
	};
}

/** Replaces sheet `index`'s rows. */
export function withRows(
	book: BookData,
	index: number,
	rows: string[][],
): BookData {
	return {
		sheets: book.sheets.map((sheet, i) =>
			i === index ? { ...sheet, rows } : sheet,
		),
	};
}

/**
 * Rows `from`… ordered by a column's values: numbers first in order, then
 * text, blanks always last. Formulas move as typed, like Excel's sort.
 */
export function sortRows(
	rows: string[][],
	from: number,
	descending: boolean,
	key: (row: number) => number | string,
): string[][] {
	const collator = new Intl.Collator(undefined, { numeric: true });
	const keyed = rows.slice(from).map((row, offset) => {
		const value = key(from + offset);
		return { row, value, blank: value === "" };
	});
	keyed.sort((a, b) => {
		if (a.blank !== b.blank) {
			return a.blank ? 1 : -1;
		}
		let order: number;
		if (typeof a.value === "number" && typeof b.value === "number") {
			order = a.value - b.value;
		} else if (typeof a.value === "number" || typeof b.value === "number") {
			order = typeof a.value === "number" ? -1 : 1;
		} else {
			order = collator.compare(a.value, b.value);
		}
		return descending ? -order : order;
	});
	return [...rows.slice(0, from), ...keyed.map((entry) => entry.row)];
}

// =========================================================================
// Sheets
// =========================================================================

/** Why a sheet name will not do, or null. Excel's rules. */
export function sheetNameProblem(
	book: BookData,
	name: string,
	except?: number,
): "empty" | "invalid" | "taken" | null {
	const trimmedName = name.trim();
	if (trimmedName === "") {
		return "empty";
	}
	if (
		trimmedName.length > 31 ||
		/[[\]:*?/\\]/.test(trimmedName) ||
		trimmedName.startsWith("'") ||
		trimmedName.endsWith("'")
	) {
		return "invalid";
	}
	const lower = trimmedName.toLowerCase();
	const taken = book.sheets.some(
		(sheet, i) => i !== except && sheet.name.toLowerCase() === lower,
	);
	return taken ? "taken" : null;
}

/** `Sheet4`, the first such name not taken. */
export function freeSheetName(book: BookData): string {
	for (let n = book.sheets.length + 1; ; n++) {
		const name = `Sheet${n}`;
		if (sheetNameProblem(book, name) === null) {
			return name;
		}
	}
}

export function addSheet(book: BookData, id: number, name: string): BookData {
	return { sheets: [...book.sheets, { id, name, rows: [[""]] }] };
}

/** Renames a sheet and every formula that names it. */
export function renameSheet(
	book: BookData,
	index: number,
	name: string,
): BookData {
	const old = book.sheets[index]?.name;
	if (old === undefined) {
		return book;
	}
	const rewritten = rewriteFormulas(book, (text) =>
		renameSheetRefs(text, old, name),
	);
	return {
		sheets: rewritten.sheets.map((sheet, i) =>
			i === index ? { ...sheet, name } : sheet,
		),
	};
}

/** Deletes a sheet; formulas that named it now read `#REF!`. */
export function removeSheet(book: BookData, index: number): BookData {
	const old = book.sheets[index]?.name;
	if (old === undefined || book.sheets.length <= 1) {
		return book;
	}
	const kept = { sheets: book.sheets.filter((_, i) => i !== index) };
	return rewriteFormulas(kept, (text) => renameSheetRefs(text, old, null));
}
