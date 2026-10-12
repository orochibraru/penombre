import {
	type BookData,
	blockAt,
	fillWith,
	shiftBlock,
	tile,
	withRows,
	writeBlock,
} from "#lib/sheet/book.js";
import { parseTsv, toTsv } from "#lib/sheet/clipboard.js";
import type { Cell, Rect } from "#lib/sheet/selection.js";
import {
	patchSheet,
	type StyleGrid,
	styleBlock,
	tileStyles,
	writeStyles,
} from "#lib/sheet/styles.js";
import type { SheetState } from "./state.svelte.js";

/** What was last copied here, so a paste back in keeps its formulas. */
export interface Clip {
	text: string;
	block: string[][];
	origin: Cell;
	/** Set for a cut: the cells a paste moves away from. */
	cut: { sheet: number; rect: Rect } | null;
	styles: StyleGrid;
}

/** The selection as text for the clipboard: values, as Excel copies. */
export function copyCells(sheet: SheetState, cut: boolean): string {
	const rect = sheet.rect;
	const values: string[][] = [];
	for (let r = rect.top; r <= rect.bottom; r++) {
		const line: string[] = [];
		for (let c = rect.left; c <= rect.right; c++) {
			line.push(sheet.shown(r, c));
		}
		values.push(line);
	}
	const text = toTsv(values);
	sheet.clip = {
		text,
		block: blockAt(sheet.rows, rect),
		styles: styleBlock(sheet.styleIds, rect),
		origin: { row: rect.top, col: rect.left },
		cut: cut ? { sheet: sheet.active, rect } : null,
	};
	sheet.copied = { sheet: sheet.active, rect };
	return text;
}

/** Our own copy brings its formats too; a cut leaves its cells plain. */
function pasteStyles(
	book: BookData,
	active: number,
	clip: Clip,
	rect: Rect,
): BookData {
	let next = book;
	if (clip.cut) {
		const { sheet, rect: from } = clip.cut;
		const blank = clip.styles.map((line) => line.map(() => 0));
		next = patchSheet(next, sheet, {
			styleIds: writeStyles(
				next.sheets[sheet]?.styleIds ?? [],
				from.top,
				from.left,
				blank,
			),
		});
	}
	return patchSheet(next, active, {
		styleIds: writeStyles(
			next.sheets[active]?.styleIds ?? [],
			rect.top,
			rect.left,
			tileStyles(clip.styles, rect),
		),
	});
}

/**
 * Pastes at the selection. Our own copy brings its formulas, references
 * shifted (a cut moves them as they are), and its formats; anything else is
 * values. One copied cell over a larger selection fills all of it.
 */
export function pasteCells(sheet: SheetState, text: string): void {
	sheet.commit();
	const clip = sheet.clip?.text === text ? sheet.clip : null;
	const rect = sheet.rect;
	let book = sheet.book;
	let block = clip ? clip.block : parseTsv(text);
	if (clip?.cut) {
		const source = book.sheets[clip.cut.sheet]?.rows ?? [];
		book = withRows(book, clip.cut.sheet, fillWith(source, clip.cut.rect, ""));
		sheet.clip = null;
	} else if (clip) {
		block = shiftBlock(
			block,
			rect.top - clip.origin.row,
			rect.left - clip.origin.col,
		);
	}
	block = tile(block, rect, clip !== null && !clip.cut);
	const rows = book.sheets[sheet.active]?.rows ?? [];
	const next = withRows(
		book,
		sheet.active,
		writeBlock(rows, rect.top, rect.left, block),
	);
	const pasted = {
		anchor: { row: rect.top, col: rect.left },
		focus: {
			row: rect.top + block.length - 1,
			col: rect.left + (block[0]?.length ?? 1) - 1,
		},
	};
	sheet.apply(
		clip ? pasteStyles(next, sheet.active, clip, rect) : next,
		pasted,
	);
}
