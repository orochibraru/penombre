import { toast } from "svelte-sonner";

import { m } from "#lib/paraglide/messages.js";
import { getLocale } from "#lib/paraglide/runtime.js";
import { blockAt, fillWith, withRows } from "#lib/sheet/book.js";
import { addMerges, mergeRects, removeMerges } from "#lib/sheet/merges.js";
import {
	currencyFormat,
	localeCurrency,
	localeDate,
	shiftDecimals,
} from "#lib/sheet/number-formats.js";
import type { Rect } from "#lib/sheet/selection.js";
import {
	type BorderEdge,
	type CellStyle,
	mapStyles,
	normalizeStyle,
	patchSheet,
	type Side,
	SIDES,
	styleBlock,
	type StyleGrid,
	styleKey,
	tileStyles,
	writeStyles,
} from "#lib/sheet/styles.js";

import type { SheetState } from "./state.svelte.js";

/**
 * The Format commands: each restyles the selection in one undoable step.
 * Styles are interned into the workbook's table, so a thousand cells made
 * bold share one new entry.
 */

/** Only a workbook holds formatting; a CSV says why it cannot. */
export function canFormat(sheet: SheetState): boolean {
	if (sheet.readOnly) {
		return false;
	}
	if (!sheet.workbook) {
		toast.info(m.sheet_format_csv());
		return false;
	}
	return true;
}

/** The selection, kept to the grid. */
function target(sheet: SheetState): Rect {
	const { rect, bounds } = sheet;
	return {
		...rect,
		bottom: Math.min(rect.bottom, bounds.rows - 1),
		right: Math.min(rect.right, bounds.cols - 1),
	};
}

/** `style` with `patch` laid over it; an undefined value removes the key. */
export function patched(
	style: CellStyle,
	patch: Partial<CellStyle>,
): CellStyle {
	const next: Record<string, unknown> = { ...style, ...patch };
	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) {
			delete next[key];
		}
	}
	return normalizeStyle(next);
}

function interner(sheet: SheetState) {
	const keys = new Map<string, number>();
	sheet.styles.forEach((style, index) => {
		const key = styleKey(style);
		if (!keys.has(key)) {
			keys.set(key, index);
		}
	});
	const added: CellStyle[] = [];
	return {
		intern(style: CellStyle): number {
			const key = styleKey(style);
			const found = keys.get(key);
			if (found !== undefined) {
				return found;
			}
			const index = sheet.styles.length + added.length;
			added.push(style);
			keys.set(key, index);
			return index;
		},
		commit() {
			if (added.length > 0) {
				sheet.styles = [...sheet.styles, ...added];
			}
		},
	};
}

/**
 * Every cell of the selection given `change(style, row, col)`. Unless
 * `perCell`, the change depends on the style alone and is worked out once
 * per distinct style.
 */
export function restyle(
	sheet: SheetState,
	change: (style: CellStyle, row: number, col: number) => CellStyle,
	perCell = false,
): void {
	if (!canFormat(sheet)) {
		return;
	}
	sheet.commit();
	const table = interner(sheet);
	const memo = new Map<number, number>();
	let changed = false;
	const grid = mapStyles(sheet.styleIds, target(sheet), (id, row, col) => {
		const known = perCell ? undefined : memo.get(id);
		if (known !== undefined) {
			changed ||= known !== id;
			return known;
		}
		const old = sheet.styles[id] ?? {};
		const next = change(old, row, col);
		const index =
			styleKey(next) === styleKey(old)
				? id
				: table.intern({ ...next, base: old.base ?? id });
		memo.set(id, index);
		changed ||= index !== id;
		return index;
	});
	if (changed) {
		table.commit();
		sheet.apply(patchSheet(sheet.book, sheet.active, { styleIds: grid }));
	}
}

type Flag = "bold" | "italic" | "underline" | "strike" | "wrap";

/** On for the whole selection unless the active cell already has it. */
export function toggle(sheet: SheetState, flag: Flag): void {
	const { row, col } = sheet.selection.anchor;
	const on = !sheet.styleAt(row, col)[flag];
	restyle(sheet, (style) => patched(style, { [flag]: on || undefined }));
}

export function setStyle(sheet: SheetState, patch: Partial<CellStyle>): void {
	restyle(sheet, (style) => patched(style, patch));
}

export const setFormat = (sheet: SheetState, format: string | undefined) =>
	setStyle(sheet, { format });

export const currency = (sheet: SheetState, code?: string) =>
	setFormat(sheet, currencyFormat(code ?? localeCurrency(getLocale())));

export function decimals(sheet: SheetState, delta: number): void {
	restyle(
		sheet,
		(style, row, col) =>
			patched(style, {
				format: shiftDecimals(
					style.format,
					delta,
					sheet.engine.value(sheet.active, row, col),
				),
			}),
		true,
	);
}

export function clearFormatting(sheet: SheetState): void {
	if (!canFormat(sheet)) {
		return;
	}
	sheet.commit();
	const grid = mapStyles(sheet.styleIds, target(sheet), () => 0);
	sheet.apply(patchSheet(sheet.book, sheet.active, { styleIds: grid }));
}

// =========================================================================
// Borders
// =========================================================================

export type BorderKind =
	| "all"
	| "outer"
	| "inner"
	| "horizontal"
	| "vertical"
	| "top"
	| "bottom"
	| "left"
	| "right"
	| "none";

/** The sides of cell `row`, `col` that `kind` draws over `rect`. */
export function bordersFor(
	kind: BorderKind,
	rect: Rect,
	row: number,
	col: number,
): Side[] {
	const edge = {
		top: row === rect.top,
		bottom: row === rect.bottom,
		left: col === rect.left,
		right: col === rect.right,
	};
	switch (kind) {
		case "all":
		case "none":
			return [...SIDES];
		case "outer":
			return SIDES.filter((side) => edge[side]);
		case "inner":
			return SIDES.filter((side) => !edge[side]);
		case "horizontal":
			return (["top", "bottom"] as const).filter((side) => !edge[side]);
		case "vertical":
			return (["left", "right"] as const).filter((side) => !edge[side]);
		default:
			return edge[kind] ? [kind] : [];
	}
}

export function setBorders(
	sheet: SheetState,
	kind: BorderKind,
	line: BorderEdge,
): void {
	const rect = target(sheet);
	restyle(
		sheet,
		(style, row, col) => {
			const sides = bordersFor(kind, rect, row, col);
			if (sides.length === 0) {
				return style;
			}
			const borders = { ...style.borders };
			for (const side of sides) {
				if (kind === "none") {
					delete borders[side];
				} else {
					borders[side] = line;
				}
			}
			return patched(style, {
				borders: Object.keys(borders).length > 0 ? borders : undefined,
			});
		},
		true,
	);
}

// =========================================================================
// Merging
// =========================================================================

export type MergeMode = "all" | "across" | "none";

export function merge(sheet: SheetState, mode: MergeMode): void {
	if (!canFormat(sheet)) {
		return;
	}
	sheet.commit();
	const rect = target(sheet);
	const current = sheet.sheet?.merges;
	if (mode === "none") {
		const merges = removeMerges(current, rect);
		if (merges.length !== (current ?? []).length) {
			sheet.apply(patchSheet(sheet.book, sheet.active, { merges }));
		}
		return;
	}
	const merges = addMerges(current, rect, mode === "across");
	// Excel keeps the top-left value of each merge and drops the rest.
	let rows = sheet.rows;
	let dropped = false;
	for (const area of mergeRects(merges)) {
		for (const part of [
			{ ...area, left: area.left + 1, bottom: area.top },
			{ ...area, top: area.top + 1 },
		]) {
			const within = {
				...part,
				bottom: Math.min(part.bottom, rows.length - 1),
				right: Math.min(part.right, sheet.width - 1),
			};
			if (
				within.top <= within.bottom &&
				within.left <= within.right &&
				blockAt(rows, within).some((line) => line.some((cell) => cell !== ""))
			) {
				rows = fillWith(rows, within, "");
				dropped = true;
			}
		}
	}
	if (dropped) {
		toast.info(m.sheet_merge_kept());
	}
	sheet.apply(
		patchSheet(withRows(sheet.book, sheet.active, rows), sheet.active, {
			merges,
		}),
	);
}

// =========================================================================
// Paint format
// =========================================================================

/** Copies the selection's formats for the next selection, or cancels. */
export function paintFormat(sheet: SheetState): void {
	if (sheet.painter) {
		sheet.painter = null;
		return;
	}
	if (canFormat(sheet)) {
		sheet.painter = styleBlock(sheet.styleIds, target(sheet));
	}
}

/** The copied formats laid over the selection just made. */
export function finishPaint(sheet: SheetState): void {
	const painter = sheet.painter;
	if (!painter) {
		return;
	}
	sheet.painter = null;
	const rect = target(sheet);
	const grid: StyleGrid = writeStyles(
		sheet.styleIds,
		rect.top,
		rect.left,
		tileStyles(painter, rect),
	);
	sheet.apply(patchSheet(sheet.book, sheet.active, { styleIds: grid }));
}

// =========================================================================
// Keyboard
// =========================================================================

const SHIFTED: Record<string, (sheet: SheetState) => void> = {
	Digit1: (sheet) => setFormat(sheet, "#,##0.00"),
	Digit2: (sheet) => setFormat(sheet, "h:mm:ss"),
	Digit3: (sheet) => setFormat(sheet, localeDate(getLocale())),
	Digit4: (sheet) => currency(sheet),
	Digit5: (sheet) => setFormat(sheet, "0.00%"),
	Digit6: (sheet) => setFormat(sheet, "0.00E+00"),
	l: (sheet) => setStyle(sheet, { align: "left" }),
	e: (sheet) => setStyle(sheet, { align: "center" }),
	r: (sheet) => setStyle(sheet, { align: "right" }),
	Digit7: (sheet) => setBorders(sheet, "outer", { style: "thin" }),
};

const PLAIN: Record<string, (sheet: SheetState) => void> = {
	b: (sheet) => toggle(sheet, "bold"),
	i: (sheet) => toggle(sheet, "italic"),
	u: (sheet) => toggle(sheet, "underline"),
	Digit5: (sheet) => toggle(sheet, "strike"),
	"\\": clearFormatting,
};

/**
 * Sheets' and Excel's formatting keys on the grid: ⌘B, ⌘I, ⌘U, ⌘5,
 * ⌘⇧1 to ⌘⇧6 for number formats, ⌘⇧L/E/R to align, ⌘\ to clear, and
 * Alt+⇧5 for strikethrough. Digits match on `code`, since Shift turns 4
 * into `$`; letters on `key`, so a Dvorak ⌘X still cuts.
 */
export function formatKey(sheet: SheetState, event: KeyboardEvent): boolean {
	const mod = (event.metaKey || event.ctrlKey) && !event.altKey;
	let action: ((sheet: SheetState) => void) | undefined;
	const name = /^Digit\d$/.test(event.code)
		? event.code
		: event.key.toLowerCase();
	if (mod) {
		action = (event.shiftKey ? SHIFTED : PLAIN)[name];
	} else if (event.altKey && event.shiftKey && event.code === "Digit5") {
		action = (s) => toggle(s, "strike");
	}
	if (!action) {
		return false;
	}
	action(sheet);
	return true;
}
