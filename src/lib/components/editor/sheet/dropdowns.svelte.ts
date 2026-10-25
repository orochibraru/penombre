import { toast } from "svelte-sonner";

import { display, isFormula, MAX_COL, MAX_ROW } from "#lib/formula.js";
import { m } from "#lib/paraglide/messages.js";
import { withRows, writeBlock } from "#lib/sheet/book.js";
import { ConditionalStyles, ruleCss } from "#lib/sheet/conditional.js";
import {
	autoColors,
	type ChipColor,
	colorOf,
	distinctValues,
	type Dropdown,
	dropdownAt,
	fitList,
	matchItem,
	parseSqref,
	type PlacedDropdown,
	placeDropdowns,
	rectName,
	renameInCells,
	suggestionRange,
	withDropdown,
} from "#lib/sheet/dropdowns.js";
import { parseParts } from "#lib/sheet/references.js";
import { type Rect, single } from "#lib/sheet/selection.js";
import { patchSheet } from "#lib/sheet/styles.js";

import { canFormat } from "./formatting.js";
import type { SheetState } from "./state.svelte.js";

/**
 * Dropdown chips and conditional formatting on the grid: what each cell
 * draws, the picker, the "Convert to dropdown" offer and the editor panel's
 * commands. One per `SheetState` (`dropdownsOf`), so the grid, the menus and
 * the panel share it; every change is a `sheet.apply`, so undo covers it.
 */
export class Dropdowns {
	private readonly sheet: SheetState;
	/** The cell whose list is open. */
	picker = $state.raw<{ row: number; col: number } | null>(null);
	/** The dropdown the editor panel is open on: its sheet's id, its index. */
	panel = $state.raw<{ sheet: number; index: number } | null>(null);
	/** Offers turned down this session, as `sheetId:range`. */
	private dismissed = $state.raw<ReadonlySet<string>>(new Set());

	readonly placed = $derived.by(() =>
		placeDropdowns(this.sheet.sheet?.dropdowns),
	);
	/** Each dropdown's items, a range's read through the engine. */
	readonly lists = $derived.by(
		() =>
			new Map(this.placed.map((p) => [p.dropdown, this.resolve(p.dropdown)])),
	);
	readonly rules = $derived.by(() => {
		const sheet = this.sheet;
		return new ConditionalStyles(sheet.sheet?.conditional, {
			value: (row, col) => sheet.engine.value(sheet.active, row, col),
			compute: (formula) => sheet.engine.compute(sheet.active, formula),
			rows: sheet.rows.length,
			cols: sheet.width,
		});
	});
	/** Where "Convert to dropdown" is offered, if anywhere. */
	readonly offer = $derived.by(() => {
		const sheet = this.sheet;
		if (
			sheet.readOnly ||
			!sheet.workbook ||
			sheet.editing ||
			sheet.singleCell
		) {
			return null;
		}
		const area = suggestionRange(sheet.rect, sheet.rows, {
			bodyStart: sheet.bodyStart,
			dropdowns: sheet.sheet?.dropdowns,
		});
		return area && !this.dismissed.has(this.offerKey(area)) ? area : null;
	});
	readonly editing = $derived.by(() => {
		const own = this.sheet.sheet;
		return this.panel?.sheet === own?.id
			? (own?.dropdowns?.[this.panel?.index ?? -1] ?? null)
			: null;
	});

	constructor(sheet: SheetState) {
		this.sheet = sheet;
		sheet.vet = this.vet;
	}

	// =====================================================================
	// Reading
	// =====================================================================

	at = (row: number, col: number): PlacedDropdown | undefined =>
		this.placed.length > 0 ? dropdownAt(this.placed, row, col) : undefined;

	items = (dropdown: Dropdown): string[] => this.lists.get(dropdown) ?? [];

	/** A range's values, blanks and repeats left out. */
	private resolve(dropdown: Dropdown): string[] {
		if (dropdown.values) {
			return dropdown.values;
		}
		const { sheet: name, start, end } = parseParts(dropdown.source ?? "");
		const last = end ?? start;
		const index =
			name === null
				? this.sheet.active
				: this.sheet.book.sheets.findIndex(
						(s) => s.name.toLowerCase() === name.toLowerCase(),
					);
		const rows = this.sheet.book.sheets[index]?.rows ?? [];
		const width = rows.reduce((w, row) => Math.max(w, row.length), 0);
		const bottom = Math.min(last.row ?? MAX_ROW, rows.length - 1);
		const right = Math.min(last.col ?? MAX_COL, width - 1);
		const values: string[] = [];
		for (let r = start.row ?? 0; r <= bottom; r++) {
			for (let c = start.col ?? 0; c <= right; c++) {
				values.push(display(this.sheet.engine.value(index, r, c)));
			}
		}
		return distinctValues(values).slice(0, 1000);
	}

	/** What a dropdown cell draws, or null when it has none. */
	chip = (
		row: number,
		col: number,
	): {
		text: string;
		color?: ChipColor;
		invalid: boolean;
		arrow: boolean;
	} | null => {
		const placed = this.at(row, col);
		if (!placed) {
			return null;
		}
		const text = this.sheet.shown(row, col);
		const items = this.items(placed.dropdown);
		return {
			text,
			color: text
				? colorOf(placed.dropdown, matchItem(items, text) ?? text)
				: undefined,
			invalid: text !== "" && matchItem(items, text) === null,
			arrow: !placed.dropdown.hideArrow && !this.sheet.readOnly,
		};
	};

	/** The cell's conditional look, and room for the offer anchored to it. */
	css = (row: number, col: number): string => {
		const rule = this.rules.empty ? null : this.rules.at(row, col);
		const css = rule ? ruleCss(rule, this.sheet.styleAt(row, col)) : "";
		return this.offersAt(row, col)
			? [css, "overflow: visible"].filter(Boolean).join("; ")
			: css;
	};

	/** The offer hangs under the selection's moving end. */
	offersAt = (row: number, col: number): boolean => {
		const { focus } = this.sheet.selection;
		return this.offer !== null && focus.row === row && focus.col === col;
	};

	// =====================================================================
	// Typing and picking
	// =====================================================================

	/**
	 * A value typed into a dropdown cell, as stored: the list's own spelling
	 * when it matches one, null when the dropdown refuses it.
	 */
	vet = (row: number, col: number, text: string): string | null => {
		const placed = this.at(row, col);
		if (!placed || text === "" || isFormula(text)) {
			return text;
		}
		const item = matchItem(this.items(placed.dropdown), text);
		if (item !== null) {
			return item;
		}
		if (placed.dropdown.strict) {
			toast.error(m.sheet_dropdown_rejected({ value: text }));
			return null;
		}
		return text;
	};

	/** The list being typed into, filtered by the draft. */
	typed = (): string[] | null => {
		const editing = this.sheet.editing;
		if (!editing || editing.draft.startsWith("=")) {
			return null;
		}
		const placed = this.at(editing.row, editing.col);
		if (!placed) {
			return null;
		}
		const wanted = editing.draft.trim().toLowerCase();
		const items = this.items(placed.dropdown).filter((item) =>
			item.toLowerCase().includes(wanted),
		);
		return items.length > 0 ? items : null;
	};

	/** Alt+↓, or the chevron: the active cell's list. */
	open = (
		row = this.sheet.selection.anchor.row,
		col = this.sheet.selection.anchor.col,
	): boolean => {
		if (this.sheet.readOnly || !this.at(row, col)) {
			return false;
		}
		this.sheet.commit();
		this.sheet.select(single(row, col));
		this.picker = { row, col };
		return true;
	};

	close = (): void => {
		this.picker = null;
	};

	choose = (row: number, col: number, value: string): void => {
		this.picker = null;
		if (value !== this.sheet.raw(row, col)) {
			this.sheet.apply(
				withRows(
					this.sheet.book,
					this.sheet.active,
					writeBlock(this.sheet.rows, row, col, [[value]]),
				),
				single(row, col),
			);
		}
		this.sheet.focusGrid();
	};

	// =====================================================================
	// Creating, editing, removing
	// =====================================================================

	private offerKey(area: Rect): string {
		return `${this.sheet.sheet?.id ?? 0}:${rectName(area)}`;
	}

	dismiss = (): void => {
		if (this.offer) {
			this.dismissed = new Set([...this.dismissed, this.offerKey(this.offer)]);
		}
	};

	private setDropdowns(dropdowns: Dropdown[], rows?: string[][]): void {
		const book = rows
			? withRows(this.sheet.book, this.sheet.active, rows)
			: this.sheet.book;
		this.sheet.apply(patchSheet(book, this.sheet.active, { dropdowns }));
	}

	/** A dropdown over `area`, listing what its cells hold, its editor open. */
	private create(area: Rect): void {
		const cells = this.sheet.rows
			.slice(area.top, area.bottom + 1)
			.map((row) => row[area.left] ?? "");
		const found = fitList(distinctValues(cells));
		const values =
			found.length > 0
				? found
				: [
						m.sheet_dropdown_option({ n: "1" }),
						m.sheet_dropdown_option({ n: "2" }),
					];
		const dropdowns = withDropdown(this.sheet.sheet?.dropdowns, {
			range: rectName(area),
			values,
			colors: autoColors(values),
		});
		this.setDropdowns(dropdowns);
		this.openPanel(dropdowns.length - 1);
	}

	/** Accepts the offer. */
	convert = (): void => {
		const area = this.offer;
		if (area && canFormat(this.sheet)) {
			this.sheet.commit();
			this.create(area);
		}
	};

	/** Data → Dropdown: the active cell's, or a new one over the selection. */
	edit = (): void => {
		if (!canFormat(this.sheet)) {
			return;
		}
		this.sheet.commit();
		const { row, col } = this.sheet.selection.anchor;
		const placed = this.at(row, col);
		if (placed) {
			this.openPanel(placed.index);
			return;
		}
		const rect = this.sheet.rect;
		const area = suggestionRange(rect, this.sheet.rows, {
			bodyStart: this.sheet.bodyStart,
			dropdowns: undefined,
		}) ?? {
			...rect,
			bottom: Math.min(
				rect.bottom,
				Math.max(this.sheet.rows.length - 1, rect.top),
			),
		};
		this.create(area);
	};

	private openPanel(index: number): void {
		this.sheet.chartPanel = false;
		this.panel = { sheet: this.sheet.sheet?.id ?? 0, index };
	}

	/** The open dropdown changed; `rows` when its cells changed with it. */
	update = (dropdown: Dropdown, rows?: string[][]): void => {
		const index = this.editing ? (this.panel?.index ?? null) : null;
		const list = this.sheet.sheet?.dropdowns;
		if (index === null || !list?.[index]) {
			return;
		}
		this.setDropdowns(
			list.map((d, i) => (i === index ? dropdown : d)),
			rows,
		);
	};

	/** An item renamed in the list, its colour and the cells holding it. */
	rename = (dropdown: Dropdown, from: string, to: string): void => {
		const values = (dropdown.values ?? []).map((v) => (v === from ? to : v));
		const colors = dropdown.colors?.map((c) =>
			c.value === from ? { ...c, value: to } : c,
		);
		const rows = renameInCells(
			this.sheet.rows,
			parseSqref(dropdown.range),
			from,
			to,
		);
		this.update(
			{ ...dropdown, values, ...(colors ? { colors } : {}) },
			rows === this.sheet.rows ? undefined : rows,
		);
	};

	remove = (): void => {
		const index = this.editing ? (this.panel?.index ?? null) : null;
		const list = this.sheet.sheet?.dropdowns;
		if (index === null || !list) {
			return;
		}
		this.panel = null;
		this.setDropdowns(list.filter((_, i) => i !== index));
		this.sheet.focusGrid();
	};
}

const instances = new WeakMap<SheetState, Dropdowns>();

export function dropdownsOf(sheet: SheetState): Dropdowns {
	let found = instances.get(sheet);
	if (!found) {
		found = new Dropdowns(sheet);
		instances.set(sheet, found);
	}
	return found;
}
