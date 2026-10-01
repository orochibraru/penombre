import { single } from "#lib/sheet/selection.js";
import type { SheetState } from "./state.svelte.js";

/**
 * The sheet's keyboard, as spreadsheets have it. Kept out of the components
 * so the whole map reads in one place.
 */

const ARROWS: Record<string, [number, number]> = {
	ArrowUp: [-1, 0],
	ArrowDown: [1, 0],
	ArrowLeft: [0, -1],
	ArrowRight: [0, 1],
};

/** What the grid asks of the page for keys that need the DOM. */
export interface GridKeyContext {
	/** Routes the browser's own copy, cut or paste through the clipboard helper. */
	clipboard: (kind: "copy" | "cut" | "paste") => void;
	/** Mounts and focuses the cell editor now, so the key lands in it. */
	typeInto: () => void;
	/** Rows in a screenful, for Page Up and Page Down. */
	page: number;
}

/**
 * `prevent`: handled, the browser must do nothing else. `pass`: handled, and
 * the browser's default (a copy, a dead key) must still happen. null: not ours.
 */
export type KeyResult = "prevent" | "pass" | null;

type Action = (
	sheet: SheetState,
	event: KeyboardEvent,
	context: GridKeyContext,
) => void;

/** Ctrl (⌘) shortcuts. AltGr arrives as Ctrl+Alt and types a character. */
const SHORTCUTS: Record<string, Action> = {
	a: (sheet) => sheet.selectAll(),
	z: (sheet, event) => (event.shiftKey ? sheet.redo() : sheet.undo()),
	y: (sheet) => sheet.redo(),
	c: (_, __, context) => context.clipboard("copy"),
	x: (_, __, context) => context.clipboard("cut"),
	v: (_, __, context) => context.clipboard("paste"),
	d: (sheet) => sheet.fill("down"),
	r: (sheet) => sheet.fill("right"),
	home: (sheet) => sheet.select(single(0, 0)),
	" ": (sheet) => sheet.selectCols(sheet.selection.anchor.col, false),
};

/** The browser must still copy or paste, into the clipboard helper. */
const NATIVE = new Set(["c", "x", "v"]);

const MOVES: Record<
	string,
	(sheet: SheetState, event: KeyboardEvent, page: number) => void
> = {
	Tab: (sheet, event) => sheet.advance(0, event.shiftKey ? -1 : 1),
	Enter: (sheet, event) =>
		event.shiftKey ? sheet.move(-1, 0) : sheet.begin("edit"),
	F2: (sheet) => sheet.begin("edit"),
	Delete: (sheet) => sheet.clear(),
	Backspace: (sheet) => sheet.clear(),
	Escape: (sheet) => {
		sheet.copied = null;
		sheet.select(
			single(sheet.selection.anchor.row, sheet.selection.anchor.col),
		);
	},
	Home: (sheet) => sheet.select(single(sheet.selection.anchor.row, 0)),
	End: (sheet) =>
		sheet.select(
			single(sheet.selection.anchor.row, Math.max(0, sheet.width - 1)),
		),
	PageDown: (sheet, event, page) => sheet.move(page, 0, event.shiftKey),
	PageUp: (sheet, event, page) => sheet.move(-page, 0, event.shiftKey),
};

/** A key pressed on the grid itself, not in an editor. */
export function gridKey(
	sheet: SheetState,
	event: KeyboardEvent,
	context: GridKeyContext,
): KeyResult {
	const mod = (event.metaKey || event.ctrlKey) && !event.altKey;
	const arrow = ARROWS[event.key];
	if (arrow) {
		(mod ? sheet.leap : sheet.move)(arrow[0], arrow[1], event.shiftKey);
		return "prevent";
	}
	if (mod) {
		const key = event.key.toLowerCase();
		const action = SHORTCUTS[key];
		if (!action) {
			return null;
		}
		action(sheet, event, context);
		return NATIVE.has(key) ? "pass" : "prevent";
	}
	const move = MOVES[event.key];
	if (move) {
		move(sheet, event, context.page);
		return "prevent";
	}
	if (event.key === " " && event.shiftKey) {
		sheet.selectRows(sheet.selection.anchor.row, false);
		return "prevent";
	}
	if (event.key === "Dead" || event.key === "Process") {
		// A composed character: the editor must hold the focus before it lands.
		sheet.begin("enter", "");
		context.typeInto();
		return "pass";
	}
	// ⌘ never types; Ctrl+Alt is AltGr, which does.
	if (event.key.length === 1 && !event.metaKey) {
		sheet.begin("enter", event.key);
		return "prevent";
	}
	return null;
}

/**
 * A key pressed in the cell editor or the formula bar. Enter and Tab write
 * and move on, Escape puts the cell back. Arrows move on too while a value
 * is being typed over a cell, but not in a formula, where they move the
 * caret.
 */
export function editorKey(
	sheet: SheetState,
	event: KeyboardEvent,
	inCell: boolean,
): boolean {
	if (event.isComposing) {
		return false;
	}
	const done = (rows: number, cols: number) => {
		sheet.commit(rows, cols);
		sheet.focusGrid();
		return true;
	};
	switch (event.key) {
		case "Enter":
			// Alt+Enter is a line break inside the cell, as in Excel.
			return event.altKey ? false : done(event.shiftKey ? -1 : 1, 0);
		case "Tab":
			return done(0, event.shiftKey ? -1 : 1);
		case "Escape":
			sheet.cancel();
			sheet.focusGrid();
			return true;
		default:
			break;
	}
	const arrow = ARROWS[event.key];
	const typing =
		inCell &&
		sheet.editing?.mode === "enter" &&
		!sheet.editing.draft.startsWith("=");
	return arrow && typing ? done(arrow[0], arrow[1]) : false;
}
