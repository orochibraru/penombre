import { cellKey } from "#lib/editor/comments.js";
import {
	createWorkbook,
	display,
	FormulaError,
	isFormula,
	normalizeFormula,
} from "#lib/formula.js";
import {
	addSheet,
	type BookData,
	blockAt,
	fill,
	fillWith,
	freeSheetName,
	parseBook,
	removeSheet,
	renameSheet,
	restructure,
	serializeBook,
	sheetNameProblem,
	shiftBlock,
	sortRows,
	tile,
	widthOf,
	withRows,
	writeBlock,
} from "#lib/sheet/book.js";
import { parseTsv, toTsv } from "#lib/sheet/clipboard.js";
import { History } from "#lib/sheet/history.js";
import {
	type Bounds,
	type Cell,
	cellName,
	clamp,
	colsOf,
	inRect,
	isSingle,
	leap,
	moveTo,
	type Rect,
	rangeName,
	rectOf,
	rowsOf,
	type Selection,
	selectAll,
	single,
	step,
} from "#lib/sheet/selection.js";
import { literal } from "#lib/sheet/values.js";

/** How a cell is being edited: typed over (`enter`) or opened in place. */
export type EditMode = "enter" | "edit";

export interface Editing {
	row: number;
	col: number;
	draft: string;
	mode: EditMode;
	/** Typed in the formula bar, which keeps the focus; the cell only shows it. */
	bar: boolean;
}

interface Snapshot {
	book: BookData;
	active: number;
	selection: Selection;
}

/** What was last copied here, so a paste back in keeps its formulas. */
interface Clip {
	text: string;
	block: string[][];
	origin: Cell;
	/** Set for a cut: the cells a paste moves away from. */
	cut: { sheet: number; rect: Rect } | null;
}

export const DEFAULT_WIDTH = 112;

/** An empty sheet still looks like one: at least this much grid. */
const MIN_ROWS = 60;
const MIN_COLS = 12;

/**
 * Everything the sheet editor knows, and every command it offers. The
 * components only render this and turn events into calls on it; the rules
 * themselves live in `#lib/sheet/*`, where they are tested.
 */
export class SheetState {
	book = $state.raw<BookData>({ sheets: [] });
	/** Index of the sheet on screen. */
	active = $state(0);
	selection = $state.raw<Selection>(single(0, 0));
	editing = $state.raw<Editing | null>(null);
	/** The first row as a sticky header, left out of sorting. */
	header = $state(true);
	/** Column widths by sheet id; view only, never saved. */
	widths = $state<Record<number, number[]>>({});
	/** The copied range, drawn dashed until the next edit. */
	copied = $state.raw<{ sheet: number; rect: Rect } | null>(null);
	canUndo = $state(false);
	canRedo = $state(false);
	/** Column A stays on screen while scrolling across. */
	frozen = $state(false);
	/** Where the caret is in whichever input holds the draft. */
	caret = $state(0);
	/** Bumped when the caret is placed from here, for the input to follow. */
	caretMoved = $state(0);
	/** The range a click inserted into the formula, while it can still grow. */
	picked = $state.raw<Rect | null>(null);
	/** Viewing only: selecting, copying and finding still work, nothing edits. */
	readOnly = $state(false);
	/** Cells with an open comment, as `cellKey`s. */
	comments = $state.raw<ReadonlySet<string>>(new Set());

	/** Set by the grid: hands keyboard focus back to it. */
	focusGrid: () => void = () => undefined;
	/** Set by the editor: starts a comment on the active cell. */
	onComment: (() => void) | null = null;

	readonly engine = $derived(createWorkbook(this.book.sheets));
	readonly sheet = $derived(
		this.book.sheets[this.active] ?? this.book.sheets[0],
	);
	readonly rows = $derived(this.sheet?.rows ?? [[""]]);
	readonly width = $derived(widthOf(this.rows));
	readonly bodyStart = $derived(this.header && this.rows.length > 1 ? 1 : 0);
	/** The grid on screen: the data, one spare row and column, a minimum. */
	readonly bounds: Bounds = $derived({
		rows: Math.max(this.rows.length + 1, MIN_ROWS),
		cols: Math.max(this.width + 1, MIN_COLS),
	});
	readonly rect = $derived(rectOf(this.selection));

	private readonly history = new History<Snapshot>(100);
	private clip: Clip | null = null;
	/** Where the picked reference sits in the draft, and the cell it began on. */
	private pick: { start: number; end: number; from: Cell } | null = null;
	private nextId: number;

	constructor(
		content: string,
		readonly workbook: boolean,
		private readonly onChange: (content: string) => void,
	) {
		this.book = parseBook(content, workbook);
		const declared = workbook
			? Number((JSON.parse(content) as { nextId?: number }).nextId ?? 0)
			: 0;
		this.nextId = Math.max(
			declared,
			...this.book.sheets.map((sheet) => sheet.id + 1),
		);
	}

	// =====================================================================
	// Reading cells
	// =====================================================================

	raw = (row: number, col: number): string => this.rows[row]?.[col] ?? "";

	shown = (row: number, col: number): string =>
		this.engine.shown(this.active, row, col);

	/** Whether a cell reads as a number, so it aligns right. */
	numeric = (row: number, col: number): boolean => {
		const raw = this.raw(row, col);
		if (isFormula(raw)) {
			return typeof this.engine.value(this.active, row, col) === "number";
		}
		return raw !== "" && typeof literal(raw) === "number";
	};

	failed = (row: number, col: number): boolean =>
		isFormula(this.raw(row, col)) &&
		this.engine.value(this.active, row, col) instanceof FormulaError;

	selected = (row: number, col: number): boolean => inRect(this.rect, row, col);

	commented = (row: number, col: number): boolean =>
		this.comments.size > 0 &&
		this.comments.has(cellKey(this.sheet?.name ?? "", cellName({ row, col })));

	isCopied = (row: number, col: number): boolean =>
		this.copied?.sheet === this.active && inRect(this.copied.rect, row, col);

	// =====================================================================
	// Changing the workbook
	// =====================================================================

	private snapshot(): Snapshot {
		return { book: this.book, active: this.active, selection: this.selection };
	}

	private restore(snapshot: Snapshot): void {
		this.book = snapshot.book;
		this.active = Math.min(snapshot.active, snapshot.book.sheets.length - 1);
		this.selection = snapshot.selection;
		this.editing = null;
		this.settled();
	}

	private settled(): void {
		this.canUndo = this.history.canUndo;
		this.canRedo = this.history.canRedo;
		this.onChange(serializeBook(this.book, this.workbook));
	}

	/** Every edit goes through here: one undo step, one save. */
	private apply(book: BookData, selection?: Selection): void {
		if (book === this.book || this.readOnly) {
			return;
		}
		this.history.record(this.snapshot());
		this.book = book;
		if (selection) {
			this.selection = selection;
		}
		this.copied = null;
		this.settled();
	}

	private setRows(rows: string[][], selection?: Selection): void {
		this.apply(withRows(this.book, this.active, rows), selection);
	}

	undo = (): void => {
		this.commit();
		const previous = this.history.undo(this.snapshot());
		if (previous) {
			this.restore(previous);
		}
	};

	redo = (): void => {
		this.commit();
		const next = this.history.redo(this.snapshot());
		if (next) {
			this.restore(next);
		}
	};

	// =====================================================================
	// Selection
	// =====================================================================

	/** Where a run of Tabs began: Enter after it goes back to that column. */
	private tabStart: number | null = null;

	select = (selection: Selection): void => {
		this.tabStart = null;
		this.selection = {
			anchor: clamp(selection.anchor, this.bounds),
			focus: clamp(selection.focus, this.bounds),
		};
	};

	/**
	 * Tab and Enter, as Excel and Sheets do them: a row typed with Tabs ends
	 * with Enter on the next row, under the cell the Tabs started from.
	 */
	advance = (rows: number, cols: number): void => {
		const start = this.tabStart;
		if (rows === 1 && cols === 0 && start !== null) {
			this.select(single(this.selection.anchor.row + 1, start));
			return;
		}
		this.move(rows, cols);
		if (rows === 0 && cols !== 0) {
			this.tabStart = start ?? this.selection.anchor.col - cols;
		}
	};

	selectCell = (cell: Cell, extend = false): void => {
		this.select(moveTo(this.selection, cell, extend));
	};

	move = (rows: number, cols: number, extend = false): void => {
		this.select(
			step(this.selection, { row: rows, col: cols }, this.bounds, extend),
		);
	};

	/** Ctrl+arrow. */
	leap = (rows: number, cols: number, extend = false): void => {
		const filled = (row: number, col: number) => this.raw(row, col) !== "";
		const { anchor, focus } = this.selection;
		const to = leap(
			extend ? focus : anchor,
			{ row: rows, col: cols },
			this.bounds,
			filled,
		);
		this.select(moveTo(this.selection, to, extend));
	};

	selectAll = (): void => {
		this.select(selectAll({ rows: this.rows.length, cols: this.width }));
	};

	selectRows = (row: number, extend: boolean): void => {
		const from = extend ? this.selection.anchor.row : row;
		this.select(rowsOf(from, row, { rows: 0, cols: this.width }));
	};

	selectCols = (col: number, extend: boolean): void => {
		const from = extend ? this.selection.anchor.col : col;
		this.select(colsOf(from, col, { rows: this.rows.length, cols: 0 }));
	};

	// =====================================================================
	// Editing a cell
	// =====================================================================

	/** Starts editing the active cell, with its text or `draft` typed over it. */
	begin = (mode: EditMode, draft?: string, bar = false): void => {
		if (this.readOnly) {
			return;
		}
		const { row, col } = this.selection.anchor;
		this.editing = { row, col, draft: draft ?? this.raw(row, col), mode, bar };
		this.unpick();
	};

	setDraft = (draft: string): void => {
		this.unpick();
		if (!this.editing) {
			this.begin("edit", draft, true);
			return;
		}
		this.editing = { ...this.editing, draft };
	};

	/** Writes the draft, then moves the selection by `rows`, `cols`. */
	commit = (rows = 0, cols = 0): void => {
		const editing = this.editing;
		const tabStart = this.tabStart;
		this.unpick();
		if (editing) {
			this.editing = null;
			const target = single(editing.row, editing.col);
			// `=sum(a1)` is kept as `=SUM(A1)`, as spreadsheets do.
			const text = normalizeFormula(editing.draft);
			if (text !== this.raw(editing.row, editing.col)) {
				this.setRows(
					writeBlock(this.rows, editing.row, editing.col, [[text]]),
					target,
				);
			} else {
				this.selection = target;
			}
		}
		if (rows || cols) {
			// Writing the cell may have reselected it; the Tab run goes on.
			this.tabStart = tabStart;
			this.advance(rows, cols);
		}
	};

	cancel = (): void => {
		this.editing = null;
		this.unpick();
	};

	placeCaret = (at: number): void => {
		this.caret = at;
		this.caretMoved++;
	};

	private unpick(): void {
		this.pick = null;
		this.picked = null;
	}

	/**
	 * Whether a click on a cell should put its reference into the formula
	 * being typed, as Excel does after `=`, `(`, `,` or an operator.
	 */
	get pointing(): boolean {
		const draft = this.editing?.draft ?? "";
		if (!draft.startsWith("=")) {
			return false;
		}
		return (
			this.pick !== null ||
			/[=(,;+\-*/^&<>:]$/.test(draft.slice(0, this.caret).trimEnd())
		);
	}

	/** Puts `cell` (or the range from the first pick, dragging) into the draft. */
	pointAt = (cell: Cell, extend: boolean): void => {
		const editing = this.editing;
		if (!editing) {
			return;
		}
		const from = extend && this.pick ? this.pick.from : cell;
		const range = { anchor: from, focus: cell };
		const name = rangeName(range);
		const start = this.pick?.start ?? this.caret;
		const end = this.pick?.end ?? this.caret;
		const draft =
			editing.draft.slice(0, start) + name + editing.draft.slice(end);
		this.editing = { ...editing, draft };
		this.pick = { start, end: start + name.length, from };
		this.picked = rectOf(range);
		this.placeCaret(start + name.length);
	};

	/** Delete: empties every cell of the selection. */
	clear = (): void => {
		const rect = this.rect;
		const within = {
			...rect,
			bottom: Math.min(rect.bottom, this.rows.length - 1),
			right: Math.min(rect.right, this.width - 1),
		};
		if (within.bottom < within.top || within.right < within.left) {
			return;
		}
		if (
			blockAt(this.rows, within).some((row) => row.some((cell) => cell !== ""))
		) {
			this.setRows(fillWith(this.rows, within, ""));
		}
	};

	fill = (direction: "down" | "right"): void => {
		this.commit();
		this.setRows(fill(this.rows, this.rect, direction));
	};

	// =====================================================================
	// Clipboard
	// =====================================================================

	/** The selection as text for the clipboard: values, as Excel copies. */
	copy = (cut: boolean): string => {
		const rect = this.rect;
		const values: string[][] = [];
		for (let r = rect.top; r <= rect.bottom; r++) {
			const line: string[] = [];
			for (let c = rect.left; c <= rect.right; c++) {
				line.push(this.shown(r, c));
			}
			values.push(line);
		}
		const text = toTsv(values);
		this.clip = {
			text,
			block: blockAt(this.rows, rect),
			origin: { row: rect.top, col: rect.left },
			cut: cut ? { sheet: this.active, rect } : null,
		};
		this.copied = { sheet: this.active, rect };
		return text;
	};

	/**
	 * Pastes at the selection. Our own copy brings its formulas, references
	 * shifted (a cut moves them as they are); anything else is values. One
	 * copied cell over a larger selection fills all of it.
	 */
	paste = (text: string): void => {
		this.commit();
		const clip = this.clip?.text === text ? this.clip : null;
		const rect = this.rect;
		let book = this.book;
		let block = clip ? clip.block : parseTsv(text);
		if (clip?.cut) {
			const source = book.sheets[clip.cut.sheet]?.rows ?? [];
			book = withRows(
				book,
				clip.cut.sheet,
				fillWith(source, clip.cut.rect, ""),
			);
			this.clip = null;
		} else if (clip) {
			block = shiftBlock(
				block,
				rect.top - clip.origin.row,
				rect.left - clip.origin.col,
			);
		}
		block = tile(block, rect, clip !== null && !clip.cut);
		const rows = book.sheets[this.active]?.rows ?? [];
		const next = withRows(
			book,
			this.active,
			writeBlock(rows, rect.top, rect.left, block),
		);
		const pasted = {
			anchor: { row: rect.top, col: rect.left },
			focus: {
				row: rect.top + block.length - 1,
				col: rect.left + (block[0]?.length ?? 1) - 1,
			},
		};
		this.apply(next, pasted);
	};

	// =====================================================================
	// Rows, columns, sorting
	// =====================================================================

	private lines(axis: "row" | "col", at: number, count: number): void {
		this.commit();
		this.apply(restructure(this.book, this.active, { axis, at, count }));
	}

	insertRows = (after: boolean): void => {
		const { top, bottom } = this.rect;
		this.lines("row", after ? bottom + 1 : top, bottom - top + 1);
	};

	insertCols = (after: boolean): void => {
		const { left, right } = this.rect;
		this.lines("col", after ? right + 1 : left, right - left + 1);
	};

	deleteRows = (): void => {
		const { top, bottom } = this.rect;
		if (top >= this.rows.length) {
			return;
		}
		this.lines("row", top, -(Math.min(bottom, this.rows.length - 1) - top + 1));
		this.select(single(top, this.selection.anchor.col));
	};

	deleteCols = (): void => {
		const { left, right } = this.rect;
		if (left >= this.width) {
			return;
		}
		this.lines("col", left, -(Math.min(right, this.width - 1) - left + 1));
		this.select(single(this.selection.anchor.row, left));
	};

	/** Sorts the rows below the header by the active column. */
	sort = (descending: boolean, col = this.selection.anchor.col): void => {
		this.commit();
		const key = (row: number) => {
			const value = isFormula(this.raw(row, col))
				? this.engine.value(this.active, row, col)
				: literal(this.raw(row, col));
			return typeof value === "number" ? value : display(value);
		};
		const rows = sortRows(this.rows, this.bodyStart, descending, key);
		const sheet = this.sheet;
		this.apply({
			sheets: this.book.sheets.map((s) =>
				// The file's recorded values are by position, which just moved.
				s === sheet ? { id: s.id, name: s.name, rows } : s,
			),
		});
	};

	/** The next cell after the active one whose text or value holds `query`. */
	find = (query: string): boolean => {
		const needle = query.trim().toLowerCase();
		if (!needle) {
			return true;
		}
		const width = this.width;
		const total = this.rows.length * width;
		const { row, col } = this.selection.anchor;
		for (let step = 1; step <= total; step++) {
			const at = (row * width + col + step) % total;
			const r = Math.floor(at / width);
			const c = at % width;
			const raw = this.raw(r, c);
			if (
				raw.toLowerCase().includes(needle) ||
				(isFormula(raw) && this.shown(r, c).toLowerCase().includes(needle))
			) {
				this.select(single(r, c));
				return true;
			}
		}
		return false;
	};

	// =====================================================================
	// Column widths
	// =====================================================================

	widthOf = (col: number): number =>
		this.widths[this.sheet?.id ?? 0]?.[col] ?? DEFAULT_WIDTH;

	setWidth = (col: number, width: number): void => {
		const id = this.sheet?.id ?? 0;
		const list = this.widths[id] ?? [];
		while (list.length <= col) {
			list.push(DEFAULT_WIDTH);
		}
		list[col] = Math.max(40, Math.round(width));
		this.widths[id] = list;
	};

	// =====================================================================
	// Sheets
	// =====================================================================

	switchTo = (index: number): void => {
		if (index === this.active || !this.book.sheets[index]) {
			return;
		}
		this.commit();
		this.active = index;
		this.selection = single(0, 0);
		this.copied = null;
	};

	addSheet = (): void => {
		if (this.readOnly) {
			return;
		}
		this.commit();
		const book = addSheet(this.book, this.nextId++, freeSheetName(this.book));
		this.apply(book, single(0, 0));
		this.active = book.sheets.length - 1;
	};

	/** Renames sheet `index`; the reason it cannot, when it cannot. */
	renameSheet = (index: number, name: string) => {
		if (this.readOnly) {
			return null;
		}
		const problem = sheetNameProblem(this.book, name, index);
		if (!problem && name.trim() !== this.book.sheets[index]?.name) {
			this.apply(renameSheet(this.book, index, name.trim()));
		}
		return problem;
	};

	deleteSheet = (index: number): void => {
		if (this.readOnly) {
			return;
		}
		this.commit();
		const book = removeSheet(this.book, index);
		if (book === this.book) {
			return;
		}
		const active = index < this.active ? this.active - 1 : this.active;
		this.apply(book, single(0, 0));
		this.active = Math.min(active, book.sheets.length - 1);
	};

	get singleCell(): boolean {
		return isSingle(this.selection);
	}
}
