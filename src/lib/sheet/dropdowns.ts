import {
	adjustFormula,
	columnName,
	type LineChange,
	MAX_COL,
	MAX_ROW,
	parseParts,
	renameSheetRefs,
} from "./references";
import type { Rect } from "./selection";
import { literal } from "./values";

/**
 * Dropdown lists, as Excel's `<dataValidation type="list">` holds them and
 * Google Sheets draws them: a chip per cell, coloured by its value. The
 * colours live in the file as conditional formatting on the same range
 * (`xlsx-rules.ts`), so Excel and LibreOffice colour the cells too.
 */

export interface ChipColor {
	value: string;
	/** `#RRGGBB`. */
	fill: string;
	/** `#RRGGBB`; absent is the default text colour. */
	text?: string;
}

export interface Dropdown {
	/** Excel's `sqref`: ranges separated by spaces, `F2:F22 H2`. */
	range: string;
	/** The allowed values, when the file lists them inline. */
	values?: string[];
	/** A range the values are read from, as a formula without `=`. */
	source?: string;
	colors?: ChipColor[];
	/** A typed value outside the list is refused, not just marked. */
	strict?: true;
	/** Excel's `showDropDown="1"`, which, despite its name, hides the arrow. */
	hideArrow?: true;
}

/** Google's chip colours: a light fill, and the dark text that goes on it. */
export const CHIP_PALETTE: readonly { fill: string; text: string }[] = [
	{ fill: "#BFE1F6", text: "#0A53A8" },
	{ fill: "#D4EDBC", text: "#11734B" },
	{ fill: "#FFE5A0", text: "#473822" },
	{ fill: "#FFCFC9", text: "#B10202" },
	{ fill: "#E6CFF2", text: "#5A3286" },
	{ fill: "#C6DBE1", text: "#215A6C" },
	{ fill: "#FFC8AA", text: "#753800" },
	{ fill: "#E8EAED", text: "#3D3D3D" },
];

// =========================================================================
// Ranges
// =========================================================================

const REF = /^\$?[A-Z]{0,3}\$?\d{0,7}(?::\$?[A-Z]{0,3}\$?\d{0,7})?$/i;

function rectOfRef(text: string): Rect | null {
	if (!(text && REF.test(text))) {
		return null;
	}
	const { start, end } = parseParts(text);
	const last = end ?? start;
	if (
		(start.row === null && start.col === null) ||
		(last.row === null && last.col === null) ||
		(start.row === null) !== (last.row === null) ||
		(start.col === null) !== (last.col === null)
	) {
		return null;
	}
	const top = start.row ?? 0;
	const bottom = last.row ?? MAX_ROW;
	const left = start.col ?? 0;
	const right = last.col ?? MAX_COL;
	if (bottom > MAX_ROW || right > MAX_COL) {
		return null;
	}
	return {
		top: Math.min(top, bottom),
		bottom: Math.max(top, bottom),
		left: Math.min(left, right),
		right: Math.max(left, right),
	};
}

/** The rectangles of a `sqref`; parts that are not ranges are dropped. */
export function parseSqref(sqref: string): Rect[] {
	return sqref
		.trim()
		.split(/\s+/)
		.flatMap((part) => {
			const rect = rectOfRef(part);
			return rect ? [rect] : [];
		});
}

export function isSqref(sqref: string): boolean {
	const parts = sqref.trim().split(/\s+/);
	return (
		sqref.length <= 8192 &&
		parts.length > 0 &&
		parts.every((part) => rectOfRef(part) !== null)
	);
}

const cellText = (row: number, col: number) => `${columnName(col)}${row + 1}`;

export function rectName(rect: Rect): string {
	const start = cellText(rect.top, rect.left);
	return rect.top === rect.bottom && rect.left === rect.right
		? start
		: `${start}:${cellText(rect.bottom, rect.right)}`;
}

export const sqrefOf = (rects: Rect[]): string => rects.map(rectName).join(" ");

/** `F2:F22` and `$F$2:$F$22 ` are one range. */
export const sameSqref = (a: string, b: string): boolean =>
	sqrefOf(parseSqref(a)) === sqrefOf(parseSqref(b));

export const inRects = (rects: Rect[], row: number, col: number): boolean =>
	rects.some(
		(r) => r.top <= row && row <= r.bottom && r.left <= col && col <= r.right,
	);

const overlaps = (a: Rect, b: Rect) =>
	a.left <= b.right &&
	b.left <= a.right &&
	a.top <= b.bottom &&
	b.top <= a.bottom;

// =========================================================================
// The list
// =========================================================================

/** `"a,b,""c"""` (formula text) as its items, or null when not inline. */
export function parseList(formula: string): string[] | null {
	const text = formula.trim();
	if (!(text.length >= 2 && text.startsWith('"') && text.endsWith('"'))) {
		return null;
	}
	const body = text.slice(1, -1);
	if (body.replace(/""/g, "").includes('"')) {
		return null;
	}
	return body.replace(/""/g, '"').split(",");
}

/** Items back as Excel's inline formula. */
export const listFormula = (values: string[]): string =>
	`"${values.join(",").replace(/"/g, '""')}"`;

/** A reference a list may be read from: `Sheet2!$A$1:$A$9`, `A1:A9`. */
export function isSourceRef(text: string): boolean {
	if (!text || text.length > 300) {
		return false;
	}
	const bang = text.lastIndexOf("!");
	return rectOfRef(text.slice(bang + 1)) !== null;
}

/** Why a list cannot be written as Excel's inline list, or null. */
export function listProblem(
	values: string[],
): "empty" | "comma" | "long" | null {
	if (values.every((v) => v.trim() === "")) {
		return "empty";
	}
	if (values.some((v) => v.includes(","))) {
		return "comma";
	}
	// Excel refuses an inline list over 255 characters.
	return values.join(",").length > 255 ? "long" : null;
}

/** As many of `values` as an inline list holds: no commas, 255 characters. */
export function fitList(values: string[]): string[] {
	const kept: string[] = [];
	let length = -1;
	for (const value of values) {
		if (!value.includes(",") && length + value.length + 1 <= 255) {
			kept.push(value);
			length += value.length + 1;
		}
	}
	return kept;
}

const fold = (text: string) => text.trim().toLowerCase();

/** The item `text` stands for, compared as Excel does: case and spaces aside. */
export function matchItem(items: string[], text: string): string | null {
	const wanted = fold(text);
	return items.find((item) => fold(item) === wanted) ?? null;
}

export const isAllowed = (items: string[], text: string): boolean =>
	text === "" || matchItem(items, text) !== null;

export function colorOf(
	dropdown: Dropdown,
	value: string,
): ChipColor | undefined {
	const wanted = fold(value);
	return dropdown.colors?.find((color) => fold(color.value) === wanted);
}

/**
 * The distinct values of a column, trimmed, the same text in another case
 * counted once (under its first spelling), the most frequent first.
 */
export function distinctValues(cells: string[]): string[] {
	const seen = new Map<string, { value: string; count: number; at: number }>();
	cells.forEach((cell, at) => {
		const value = cell.trim();
		if (value === "") {
			return;
		}
		const key = value.toLowerCase();
		const entry = seen.get(key);
		if (entry) {
			entry.count++;
		} else {
			seen.set(key, { value, count: 1, at });
		}
	});
	return [...seen.values()]
		.sort((a, b) => b.count - a.count || a.at - b.at)
		.map((entry) => entry.value);
}

/** Palette colours for the values that have none, in palette order. */
export function autoColors(
	values: string[],
	kept: ChipColor[] = [],
): ChipColor[] {
	return values.map((value, i) => {
		const found = kept.find((color) => fold(color.value) === fold(value));
		const swatch = CHIP_PALETTE[i % CHIP_PALETTE.length] ?? { fill: "#E8EAED" };
		return found ? { ...found, value } : { value, ...swatch };
	});
}

/**
 * A value renamed in the list, its colour and every cell of the range that
 * held it. Returns the new rows, or the same ones when no cell changed.
 */
export function renameInCells(
	rows: string[][],
	rects: Rect[],
	from: string,
	to: string,
): string[][] {
	const wanted = fold(from);
	const held = (cell: string, r: number, c: number) =>
		cell !== "" && fold(cell) === wanted && inRects(rects, r, c);
	let next: string[][] | null = null;
	rows.forEach((row, r) => {
		if (row.some((cell, c) => held(cell, r, c))) {
			next ??= rows.slice();
			next[r] = row.map((cell, c) => (held(cell, r, c) ? to : cell));
		}
	});
	return next ?? rows;
}

// =========================================================================
// Which dropdown, where
// =========================================================================

export interface PlacedDropdown {
	dropdown: Dropdown;
	index: number;
	rects: Rect[];
}

/** Every dropdown with its rectangles; a later one wins where two overlap. */
export function placeDropdowns(
	dropdowns: readonly Dropdown[] | undefined,
): PlacedDropdown[] {
	return (dropdowns ?? [])
		.map((dropdown, index) => ({
			dropdown,
			index,
			rects: parseSqref(dropdown.range),
		}))
		.reverse();
}

export const dropdownAt = (
	placed: PlacedDropdown[],
	row: number,
	col: number,
): PlacedDropdown | undefined =>
	placed.find((entry) => inRects(entry.rects, row, col));

/** A new dropdown over `rect`: those it covers entirely give way. */
export function withDropdown(
	dropdowns: readonly Dropdown[] | undefined,
	dropdown: Dropdown,
): Dropdown[] {
	const rects = parseSqref(dropdown.range);
	const kept = (dropdowns ?? []).filter((other) =>
		parseSqref(other.range).some(
			(r) =>
				!rects.some(
					(own) =>
						own.top <= r.top &&
						r.bottom <= own.bottom &&
						own.left <= r.left &&
						r.right <= own.right,
				),
		),
	);
	return [...kept, dropdown];
}

/**
 * Where to offer turning a selection into a dropdown: one column, two cells
 * or more below the header, some text in it that is not all numbers or
 * formulas, and no dropdown there yet. A whole column reaches row 1000.
 */
export function suggestionRange(
	rect: Rect,
	rows: string[][],
	options: { bodyStart: number; dropdowns: readonly Dropdown[] | undefined },
): Rect | null {
	if (rect.left !== rect.right) {
		return null;
	}
	const top = Math.max(rect.top, options.bodyStart);
	const whole = rect.top === 0 && rect.bottom >= rows.length - 1;
	const bottom = whole ? Math.max(rows.length - 1, 999) : rect.bottom;
	if (bottom - top < 1) {
		return null;
	}
	const area = { top, bottom, left: rect.left, right: rect.left };
	const cells = rows
		.slice(top, Math.min(bottom, rows.length - 1) + 1)
		.map((row) => row[rect.left] ?? "")
		.filter((cell) => cell.trim() !== "");
	const words = cells.filter(
		(cell) => !cell.startsWith("=") && typeof literal(cell) !== "number",
	);
	if (words.length === 0 || distinctValues(cells).length > 50) {
		return null;
	}
	const taken = (options.dropdowns ?? []).some((d) =>
		parseSqref(d.range).some((r) => overlaps(r, area)),
	);
	return taken ? null : area;
}

// =========================================================================
// Moving with the sheet
// =========================================================================

/** A range after rows or columns moved; empty when every cell went. */
export function moveSqref(sqref: string, change: LineChange): string {
	return sqref
		.trim()
		.split(/\s+/)
		.flatMap((part) => {
			const moved = adjustFormula(`=${part}`, change, null, null);
			return moved.includes("#REF!") ? [] : [moved.slice(1)];
		})
		.join(" ");
}

/**
 * A sheet's dropdowns after lines moved on sheet `target`: their ranges
 * when it is their own sheet, their sources wherever those point.
 */
export function moveDropdowns(
	dropdowns: Dropdown[] | undefined,
	change: LineChange,
	sheets: { target: string; own: string },
): Dropdown[] | undefined {
	if (!dropdowns) {
		return dropdowns;
	}
	const own = sheets.target.toLowerCase() === sheets.own.toLowerCase();
	let changed = false;
	const next = dropdowns.flatMap((dropdown) => {
		const range = own ? moveSqref(dropdown.range, change) : dropdown.range;
		if (range === "") {
			changed = true;
			return [];
		}
		const source = dropdown.source
			? adjustFormula(
					`=${dropdown.source}`,
					change,
					sheets.target,
					sheets.own,
				).slice(1)
			: undefined;
		if (range === dropdown.range && source === dropdown.source) {
			return [dropdown];
		}
		changed = true;
		return [{ ...dropdown, range, ...(source ? { source } : {}) }];
	});
	return changed ? next : dropdowns;
}

/** Sources naming a renamed (or, with null, deleted) sheet. */
export function renameDropdownSources<
	B extends { sheets: { dropdowns?: Dropdown[] }[] },
>(book: B, from: string, to: string | null): B {
	let changed = false;
	const sheets = book.sheets.map((sheet) => {
		if (!sheet.dropdowns?.some((d) => d.source)) {
			return sheet;
		}
		const dropdowns = sheet.dropdowns.map((dropdown) => {
			if (!dropdown.source) {
				return dropdown;
			}
			const source = renameSheetRefs(`=${dropdown.source}`, from, to).slice(1);
			return source === dropdown.source ? dropdown : { ...dropdown, source };
		});
		changed ||= dropdowns.some((d, i) => d !== sheet.dropdowns?.[i]);
		return { ...sheet, dropdowns };
	});
	return changed ? { ...book, sheets } : book;
}

// =========================================================================
// Crossing the network
// =========================================================================

const HEX = /^#[0-9A-F]{6}$/;

function checkColor(input: unknown): ChipColor | null {
	const raw = input as Partial<ChipColor> | null;
	if (
		!raw ||
		typeof raw.value !== "string" ||
		raw.value.length > 255 ||
		typeof raw.fill !== "string" ||
		!HEX.test(raw.fill.toUpperCase())
	) {
		return null;
	}
	const text =
		typeof raw.text === "string" && HEX.test(raw.text.toUpperCase())
			? raw.text.toUpperCase()
			: undefined;
	return {
		value: raw.value,
		fill: raw.fill.toUpperCase(),
		...(text ? { text } : {}),
	};
}

/** A dropdown as it may be trusted, fields in a fixed order; null if not one. */
export function checkDropdown(input: unknown): Dropdown | null {
	const raw = input as Partial<Dropdown> | null;
	if (!raw || typeof raw.range !== "string" || !isSqref(raw.range)) {
		return null;
	}
	const values = Array.isArray(raw.values)
		? raw.values.filter((v): v is string => typeof v === "string")
		: undefined;
	const source =
		typeof raw.source === "string" && isSourceRef(raw.source)
			? raw.source
			: undefined;
	if (
		(values === undefined) === (source === undefined) ||
		(values && (values.length > 1000 || values.some((v) => v.length > 255)))
	) {
		return null;
	}
	const colors = Array.isArray(raw.colors)
		? raw.colors.slice(0, 1000).flatMap((c) => {
				const color = checkColor(c);
				return color ? [color] : [];
			})
		: [];
	return {
		range: raw.range.trim(),
		...(values ? { values } : {}),
		...(source ? { source } : {}),
		...(colors.length > 0 ? { colors } : {}),
		...(raw.strict === true ? { strict: true as const } : {}),
		...(raw.hideArrow === true ? { hideArrow: true as const } : {}),
	};
}

/** A sheet's dropdowns from the network, or undefined when malformed. */
export function checkDropdowns(input: unknown): Dropdown[] | undefined {
	if (!Array.isArray(input) || input.length > 10_000) {
		return undefined;
	}
	const checked = input.map(checkDropdown);
	return checked.every((d) => d !== null) ? (checked as Dropdown[]) : undefined;
}

/** One string per dropdown: equal keys save the same. */
export function dropdownKey(dropdown: Dropdown): string {
	const checked = checkDropdown(dropdown) ?? dropdown;
	return JSON.stringify({
		...checked,
		range: sqrefOf(parseSqref(checked.range)),
	});
}
