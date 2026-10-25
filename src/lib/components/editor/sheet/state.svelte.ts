import { regionAround, sourceOf } from "#lib/chart/data.js";
import { chartFor, copyOf } from "#lib/chart/edit.js";
import { type Chart, isEditable } from "#lib/chart/model.js";
import { chartPalette } from "#lib/components/editor/sheet/chart-defaults.js";
import { cellKey } from "#lib/editor/comments.js";
import {
	createWorkbook,
	FormulaError,
	isFormula,
	normalizeFormula,
} from "#lib/formula.js";
import {
	addSheet,
	blockAt,
	type BookData,
	fill,
	fillWith,
	freeSheetName,
	parseBook,
	removeSheet,
	renameSheet,
	serializeBook,
	sheetNameProblem,
	widthOf,
	withRows,
	writeBlock,
} from "#lib/sheet/book.js";
import { History } from "#lib/sheet/history.js";
import { CellLooks } from "#lib/sheet/layers.js";
import { mergeIndex } from "#lib/sheet/merges.js";
import { formatted } from "#lib/sheet/number-formats.js";
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
	rangeName,
	type Rect,
	rectOf,
	rowsOf,
	selectAll,
	type Selection,
	single,
	step,
} from "#lib/sheet/selection.js";
import {
	type CellStyle,
	fillStyles,
	type Look,
	lookOf,
	patchSheet,
	type StyleGrid,
	styleTableFrom,
} from "#lib/sheet/styles.js";
import { literal } from "#lib/sheet/values.js";

import { type Clip, copyCells, pasteCells } from "./clip.js";
import { deleteLines, findNext, insertLines, sortSheet } from "./lines.js";
import { columnWidth, freezeOf, resizeColumn, setFreeze } from "./view.js";

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
	/** The first row as a sticky header, left out of sorting: a frozen row. */
	get header(): boolean {
		return freezeOf(this).rows > 0;
	}
	set header(on: boolean) {
		setFreeze(this, "rows", on);
	}
	/** The column being dragged wider, until the drop saves it. */
	resizing = $state.raw<{ col: number; width: number } | null>(null);
	/** The copied range, drawn dashed until the next edit. */
	copied = $state.raw<{ sheet: number; rect: Rect } | null>(null);
	canUndo = $state(false);
	canRedo = $state(false);
	/** Column A stays on screen while scrolling across. */
	get frozen(): boolean {
		return freezeOf(this).cols > 0;
	}
	set frozen(on: boolean) {
		setFreeze(this, "cols", on);
	}
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
	/** The chart picked on the sheet, by id. */
	chartId = $state<string | null>(null);
	/** The chart editor panel is open on `chartId`. */
	chartPanel = $state(false);

	/** Set by the grid: hands keyboard focus back to it. */
	focusGrid: () => void = () => undefined;
	/** Set by the editor: starts a comment on the active cell. */
	onComment: (() => void) | null = null;
	/** Set by the dropdowns: a typed value as stored, null when refused. */
	vet = (_row: number, _col: number, text: string): string | null => text;

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
	/**
	 * The workbook's styles, appended to and never changed, so undo needs
	 * none of it; see `#lib/sheet/styles`.
	 */
	styles = $state.raw<CellStyle[]>([{}]);
	/** How each style draws, worked out once per style. */
	readonly looks = $derived(this.styles.map(lookOf));
	/** Looks with the sheet's tables and links under them. */
	readonly cellLooks = $derived(
		new CellLooks(this.styles, this.looks, this.sheet),
	);
	readonly pictures = $derived(this.sheet?.pictures ?? []);
	readonly styleIds = $derived<StyleGrid>(this.sheet?.styleIds ?? []);
	readonly merged = $derived(mergeIndex(this.sheet?.merges));
	/** Formats copied by the paint-format button, waiting for a target. */
	painter = $state.raw<StyleGrid | null>(null);
	/** The custom number format dialog is open. */
	formatDialog = $state(false);
	readonly charts = $derived(this.sheet?.charts ?? []);
	readonly chart = $derived(
		this.charts.find((chart) => chart.id === this.chartId) ?? null,
	);
	/** The cells as charts read them. */
	readonly source = $derived(sourceOf(this.engine, this.book.sheets));

	private readonly history = new History<Snapshot>(100);
	/** What was last copied here; see `clip.ts`. */
	clip: Clip | null = null;
	private chartClip: Chart | null = null;
	/** Where the picked reference sits in the draft, and the cell it began on. */
	private pick: { start: number; end: number; from: Cell } | null = null;
	private nextId: number;

	constructor(
		content: string,
		readonly workbook: boolean,
		private readonly onChange: (content: string) => void,
	) {
		this.book = parseBook(content, workbook);
		if (workbook) {
			this.styles = styleTableFrom(content);
		}
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

	shown = (row: number, col: number): string => {
		const format = this.styleAt(row, col).format;
		const text = format
			? formatted(this.engine.value(this.active, row, col), format)
			: null;
		return text ?? this.engine.shown(this.active, row, col);
	};

	styleId = (row: number, col: number): number =>
		this.styleIds[row]?.[col] ?? 0;

	styleAt = (row: number, col: number): CellStyle =>
		this.styles[this.styleId(row, col)] ?? {};

	look = (row: number, col: number): Look =>
		this.cellLooks.look(this.styleId(row, col), row, col);

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
		if (!this.chart) {
			this.chartId = null;
			this.chartPanel = false;
		}
		this.settled();
	}

	private settled(): void {
		this.canUndo = this.history.canUndo;
		this.canRedo = this.history.canRedo;
		this.onChange(
			serializeBook(
				this.book,
				this.workbook,
				this.workbook ? this.styles : undefined,
			),
		);
	}

	/** Every edit goes through here: one undo step, one save. */
	apply(book: BookData, selection?: Selection): void {
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
		this.chartId = null;
		this.chartPanel = false;
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
			const text = this.vet(
				editing.row,
				editing.col,
				normalizeFormula(editing.draft),
			);
			if (text !== null && text !== this.raw(editing.row, editing.col)) {
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
		const book = withRows(
			this.book,
			this.active,
			fill(this.rows, this.rect, direction),
		);
		this.apply(
			patchSheet(book, this.active, {
				styleIds: fillStyles(this.styleIds, this.rect, direction),
			}),
		);
	};

	// =====================================================================
	// Clipboard, lines, sorting, Find: `clip.ts` and `lines.ts`
	// =====================================================================

	copy = (cut: boolean): string => copyCells(this, cut);

	paste = (text: string): void => pasteCells(this, text);

	insertRows = (after: boolean): void => insertLines(this, "row", after);

	insertCols = (after: boolean): void => insertLines(this, "col", after);

	deleteRows = (): void => deleteLines(this, "row");

	deleteCols = (): void => deleteLines(this, "col");

	/** False, with nothing moved, when a merge is in the way. */
	sort = (descending: boolean, col = this.selection.anchor.col): boolean =>
		sortSheet(this, descending, col);

	find = (query: string): boolean => findNext(this, query);

	// =====================================================================
	// Column widths
	// =====================================================================

	widthOf = (col: number): number => columnWidth(this, col);

	/** `done` false while dragging: drawn, not yet saved. */
	setWidth = (col: number, width: number, done = true): void =>
		resizeColumn(this, col, width, done);

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
		this.chartId = null;
		this.chartPanel = false;
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

	// =====================================================================
	// Charts
	// =====================================================================

	private setCharts(
		charts: Chart[],
		picked: string | null = this.chartId,
	): void {
		const index = this.active;
		this.apply({
			sheets: this.book.sheets.map((sheet, i) =>
				i === index ? { ...sheet, charts } : sheet,
			),
		});
		this.chartId = picked;
		this.chartPanel &&= picked !== null;
	}

	/** Insert → Chart: over the selection, placed beside it, editor open. */
	insertChart = (): void => {
		if (this.readOnly || !this.workbook) {
			return;
		}
		this.commit();
		const { top, left, bottom, right } = this.rect;
		const area = this.singleCell
			? regionAround(this.source, this.active, top, left)
			: { sheet: this.active, top, left, bottom, right };
		// Below the frozen header row, which is drawn over charts.
		const chart = chartFor(this.source, area, chartPalette(), {
			row: Math.max(area.top, this.bodyStart),
			col: area.right + 2,
			x: 0,
			y: 0,
			width: 480,
			height: 300,
		});
		this.setCharts([...this.charts, chart], chart.id);
		this.chartPanel = true;
	};

	selectChart = (id: string | null): void => {
		this.commit();
		this.chartId = id;
		this.chartPanel &&= id !== null;
	};

	updateChart = (chart: Chart): void => {
		if (!this.readOnly) {
			this.setCharts(this.charts.map((c) => (c.id === chart.id ? chart : c)));
		}
	};

	deleteChart = (id = this.chartId): void => {
		if (id && !this.readOnly) {
			this.setCharts(
				this.charts.filter((chart) => chart.id !== id),
				null,
			);
		}
	};

	copyChart = (): void => {
		this.chartClip = this.chart;
	};

	/** A copy one cell down and right of the original, or of the copied one. */
	pasteChart = (from = this.chartClip): void => {
		if (from && !this.readOnly && this.workbook && isEditable(from)) {
			const copy = copyOf(from);
			this.setCharts([...this.charts, copy], copy.id);
		}
	};

	get singleCell(): boolean {
		return isSingle(this.selection);
	}
}
