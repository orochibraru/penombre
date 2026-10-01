import { fromFileFormula, shiftFormula, toFileFormula } from "#lib/formula.js";
import {
	childNamed,
	childrenNamed,
	element,
	findElement,
	findElements,
	isElement,
	parseXml,
	serializeXml,
	text,
	textContent,
	type XmlDocument,
	type XmlElement,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * One worksheet part's cells, read into the grid the editor edits and
 * written back. `xlsx.ts` is the workbook around them.
 *
 * Writing is surgical: a cell whose text the user did not change keeps its
 * original XML, so its formula, cached value, number format, shared-string
 * reference and style survive untouched. Only cells that actually changed
 * are rewritten.
 */

/** Built-in number formats that mean a date or a time. */
const DATE_FORMAT_IDS = new Set([
	14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57,
]);

/** Excel's epoch is 1899-12-30: day 1 is 1900-01-01, with the 1900 leap bug. */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

/** One worksheet as the editor sees it. */
export interface WorkbookSheet {
	id: number;
	name: string;
	rows: string[][];
	/** `"row:col"` → [formula, value the file recorded for it]. */
	cached?: Record<string, [string, string]>;
}

export class NotASpreadsheetError extends Error {}

export function columnIndex(ref: string): number {
	let index = 0;
	for (const char of ref) {
		index = index * 26 + (char.charCodeAt(0) - 64);
	}
	return index - 1;
}

export function columnRef(index: number): string {
	let ref = "";
	let n = index;
	do {
		ref = String.fromCharCode(65 + (n % 26)) + ref;
		n = Math.floor(n / 26) - 1;
	} while (n >= 0);
	return ref;
}

/** Split `B12` into its column index and 1-based row number. */
function splitRef(ref: string): { column: number; row: number } {
	const match = /^([A-Z]+)(\d+)$/.exec(ref);
	if (!match) {
		return { column: 0, row: 0 };
	}
	return {
		column: columnIndex(match[1] as string),
		row: Number(match[2]),
	};
}

// =========================================================================
// Reading
// =========================================================================

/** Shared strings, in index order; rich-text runs are flattened. */
export function sharedStrings(entries: ZipEntry[]): string[] {
	const source = partText(entries, "xl/sharedStrings.xml");
	if (!source) {
		return [];
	}
	return childrenNamed(parseXml(source).root, "si").map((item) =>
		findElements(item, "t")
			.map((node) => textContent(node))
			.join(""),
	);
}

/** Style index → true when that style formats its number as a date. */
export function dateStyles(entries: ZipEntry[]): boolean[] {
	const source = partText(entries, "xl/styles.xml");
	if (!source) {
		return [];
	}
	const root = parseXml(source).root;

	const custom = new Map<number, string>();
	for (const format of findElements(root, "numFmt")) {
		const id = Number(format.attrs.numFmtId);
		if (Number.isFinite(id)) {
			custom.set(id, format.attrs.formatCode ?? "");
		}
	}

	const cellXfs = childNamed(root, "cellXfs");
	if (!cellXfs) {
		return [];
	}
	return childrenNamed(cellXfs, "xf").map((xf) => {
		const id = Number(xf.attrs.numFmtId ?? 0);
		if (DATE_FORMAT_IDS.has(id)) {
			return true;
		}
		const code = custom.get(id);
		// A date code is one with y/m/d/h/s outside the quoted literals.
		return code ? /[ymdhs]/i.test(code.replace(/"[^"]*"/g, "")) : false;
	});
}

function serialToText(serial: number, withTime: boolean): string {
	const date = new Date(EXCEL_EPOCH_MS + serial * MS_PER_DAY);
	const iso = date.toISOString();
	return withTime ? iso.slice(0, 19).replace("T", " ") : iso.slice(0, 10);
}

/** `2026-01-31` or `2026-01-31 14:05` back to a serial, or null. */
function textToSerial(value: string): number | null {
	const match =
		/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
			value.trim(),
		);
	if (!match) {
		return null;
	}
	const ms = Date.UTC(
		Number(match[1]),
		Number(match[2]) - 1,
		Number(match[3]),
		Number(match[4] ?? 0),
		Number(match[5] ?? 0),
		Number(match[6] ?? 0),
	);
	return (ms - EXCEL_EPOCH_MS) / MS_PER_DAY;
}

/** What a sheet's cells need from the rest of the package to be read. */
interface Context {
	strings: string[];
	styles: boolean[];
	/** A shared formula's master cell, by its `si`. */
	shared: Map<string, { formula: string; row: number; col: number }>;
}

/** Masters of the sheet's shared formulas: the one cell holding the text. */
function sharedFormulas(sheetData: XmlElement): Context["shared"] {
	const shared: Context["shared"] = new Map();
	for (const row of childrenNamed(sheetData, "row")) {
		for (const cell of childrenNamed(row, "c")) {
			const f = childNamed(cell, "f");
			const formula = f ? textContent(f) : "";
			if (f?.attrs.t === "shared" && f.attrs.si && formula) {
				const { column, row: number } = splitRef(cell.attrs.r ?? "");
				shared.set(f.attrs.si, { formula, row: number - 1, col: column });
			}
		}
	}
	return shared;
}

/**
 * A cell's formula as typed (`=SUM(A1:A3)`), or null when it has none or has
 * one the grid cannot edit: an array formula shows its value instead.
 */
function formulaOf(cell: XmlElement, context: Context): string | null {
	const f = childNamed(cell, "f");
	if (!f || f.attrs.t === "array" || f.attrs.t === "dataTable") {
		return null;
	}
	let formula = textContent(f);
	if (f.attrs.t === "shared" && !formula) {
		const master = context.shared.get(f.attrs.si ?? "");
		if (!master) {
			return null;
		}
		const { column, row } = splitRef(cell.attrs.r ?? "");
		formula = shiftFormula(
			`=${master.formula}`,
			row - 1 - master.row,
			column - master.col,
		).slice(1);
	}
	return formula ? `=${fromFileFormula(formula)}` : null;
}

/** The value a cell displays, formulas aside. */
function valueText(cell: XmlElement, context: Context): string {
	const type = cell.attrs.t;
	if (type === "inlineStr") {
		return findElements(cell, "t")
			.map((node) => textContent(node))
			.join("");
	}
	const value = childNamed(cell, "v");
	if (!value) {
		return "";
	}
	const raw = textContent(value);
	if (type === "s") {
		return context.strings[Number(raw)] ?? "";
	}
	if (type === "b") {
		return raw === "1" ? "TRUE" : "FALSE";
	}
	if (type === "e" || type === "str" || raw === "") {
		return raw;
	}
	if (context.styles[Number(cell.attrs.s ?? 0)] === true) {
		const serial = Number(raw);
		return Number.isFinite(serial)
			? serialToText(serial, !Number.isInteger(serial))
			: raw;
	}
	return raw;
}

/** The text the grid edits: a formula as typed, or the value. */
function cellText(cell: XmlElement, context: Context): string {
	return formulaOf(cell, context) ?? valueText(cell, context);
}

export type Base = Omit<Context, "shared">;

function sheetDataOf(document: XmlDocument): XmlElement {
	const sheetData = findElement(document.root, "sheetData");
	if (!sheetData) {
		throw new NotASpreadsheetError("Worksheet has no sheetData");
	}
	return sheetData;
}

export function readPart(
	source: string,
	base: Base,
): Omit<WorkbookSheet, "id" | "name"> {
	return readSheetData(sheetDataOf(parseXml(source)), base);
}

function readSheetData(
	sheetData: XmlElement,
	base: Base,
): Omit<WorkbookSheet, "id" | "name"> {
	const context = { ...base, shared: sharedFormulas(sheetData) };
	const rows: string[][] = [];
	const cached: Record<string, [string, string]> = {};

	for (const row of childrenNamed(sheetData, "row")) {
		const number = Number(row.attrs.r);
		// A row carries its own number, and a sheet may skip rows entirely.
		const index = (Number.isFinite(number) ? number : rows.length + 1) - 1;
		while (rows.length < index) {
			rows.push([]);
		}
		const values: string[] = [];
		for (const cell of childrenNamed(row, "c")) {
			const ref = cell.attrs.r ?? "";
			const column = ref ? splitRef(ref).column : values.length;
			while (values.length < column) {
				values.push("");
			}
			const formula = formulaOf(cell, context);
			const value = valueText(cell, context);
			values[column] = formula ?? value;
			if (formula && value !== "") {
				cached[`${index}:${column}`] = [formula, value];
			}
		}
		rows[index] = values;
	}

	// A rectangle: the grid editor pads short rows anyway, and doing it here
	// keeps the write side comparing like with like.
	const width = rows.reduce((widest, row) => Math.max(widest, row.length), 1);
	for (const row of rows) {
		while (row.length < width) {
			row.push("");
		}
	}
	return {
		rows: rows.length > 0 ? rows : [[""]],
		...(Object.keys(cached).length > 0 ? { cached } : {}),
	};
}

// =========================================================================
// Writing cells
// =========================================================================

/** `<v>`, `<f>` or `<is>` plus the type attribute for a value the user typed. */
function writeValue(cell: XmlElement, value: string, isDate: boolean): void {
	// A formula's cached result is meaningless once the value is overwritten,
	// and leaving it would have the next reader recompute over the old inputs.
	cell.children = cell.children.filter(
		(child) => !(isElement(child) && ["f", "v", "is"].includes(child.name)),
	);
	cell.attrs.t = undefined;

	if (value === "") {
		return;
	}

	if (value.length > 1 && value.startsWith("=")) {
		// No cached `<v>`: the workbook is marked for a full recalculation.
		cell.children.push(element("f", {}, [text(toFileFormula(value.slice(1)))]));
		return;
	}
	const serial = isDate ? textToSerial(value) : null;
	if (serial !== null) {
		cell.children.push(element("v", {}, [text(String(serial))]));
		return;
	}
	if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value)) {
		cell.children.push(element("v", {}, [text(value)]));
		return;
	}
	// Inline rather than a new shared string: it keeps the edit inside the
	// worksheet part, so sharedStrings.xml and its counts are never touched.
	cell.attrs.t = "inlineStr";
	cell.children.push(
		element("is", {}, [
			element("t", { "xml:space": "preserve" }, [text(value)]),
		]),
	);
}

interface WriteOptions {
	context: Context;
	width: number;
}

/**
 * One cell of the new grid: the original element when its text is unchanged,
 * a rewritten one when it is not, or null when there is nothing to store.
 */
function writeCell(
	existing: XmlElement | undefined,
	ref: string,
	value: string,
	options: WriteOptions,
): XmlElement | null {
	if (existing && cellText(existing, options.context) === value) {
		// Untouched: keep the cell exactly as the writer left it — formula,
		// number format, shared-string reference and all.
		return existing;
	}
	if (!existing && value === "") {
		return null;
	}
	const isDate = existing
		? options.context.styles[Number(existing.attrs.s ?? 0)] === true
		: false;
	const cell = existing ?? element("c", {});
	cell.attrs.r = ref;
	writeValue(cell, value, isDate);
	// An emptied cell with no style left on it is just noise.
	return cell.children.length > 0 || cell.attrs.s ? cell : null;
}

/** One grid row applied to its `<row>`, reusing every cell that is unchanged. */
function writeRow(
	row: XmlElement,
	number: number,
	values: string[],
	options: WriteOptions,
): XmlElement {
	row.attrs.r = String(number);

	const existingCells = new Map<number, XmlElement>();
	for (const cell of childrenNamed(row, "c")) {
		existingCells.set(splitRef(cell.attrs.r ?? "").column, cell);
	}

	const cells: XmlElement[] = [];
	for (let column = 0; column < options.width; column++) {
		const cell = writeCell(
			existingCells.get(column),
			`${columnRef(column)}${number}`,
			values[column] ?? "",
			options,
		);
		if (cell) {
			cells.push(cell);
		}
	}

	row.children = cells;
	// `spans` describes the old extent and is only a hint; a stale one has
	// Excel offer to repair the file.
	row.attrs.spans = cells.length > 0 ? `1:${options.width}` : undefined;
	return row;
}

/**
 * A shared formula whose master cell was rewritten or dropped leaves its
 * other cells pointing at nothing, which Excel repairs by deleting them. Each
 * such cell gets its formula written out in full instead.
 */
function detachOrphans(rows: XmlElement[], context: Context): void {
	const cells = rows.flatMap((row) => childrenNamed(row, "c"));
	const masters = new Set<string>();
	for (const cell of cells) {
		const f = childNamed(cell, "f");
		if (f?.attrs.t === "shared" && f.attrs.si && textContent(f)) {
			masters.add(f.attrs.si);
		}
	}
	for (const cell of cells) {
		const f = childNamed(cell, "f");
		if (f?.attrs.t !== "shared" || masters.has(f.attrs.si ?? "")) {
			continue;
		}
		const formula = formulaOf(cell, context);
		if (formula) {
			f.attrs.t = undefined;
			f.attrs.si = undefined;
			f.attrs.ref = undefined;
			f.children = [text(toFileFormula(formula.slice(1)))];
		}
	}
}

function sameGrid(a: string[][], b: string[][]): boolean {
	const width = Math.max(
		a.reduce((w, row) => Math.max(w, row.length), 0),
		b.reduce((w, row) => Math.max(w, row.length), 0),
	);
	const rows = Math.max(a.length, b.length);
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < width; c++) {
			if ((a[r]?.[c] ?? "") !== (b[r]?.[c] ?? "")) {
				return false;
			}
		}
	}
	return a.length === b.length;
}

/** An edited grid applied to one worksheet part, in place. */
export function writePart(
	entries: ZipEntry[],
	path: string,
	grid: string[][],
	base: Base,
): void {
	const source = partText(entries, path);
	if (!source) {
		throw new NotASpreadsheetError(`Missing worksheet part ${path}`);
	}
	const document = parseXml(source);
	const sheetData = sheetDataOf(document);
	// A sheet the user never changed is left byte for byte as it was.
	if (sameGrid(readSheetData(sheetData, base).rows, grid)) {
		return;
	}

	const existingRows = new Map<number, XmlElement>();
	for (const row of childrenNamed(sheetData, "row")) {
		existingRows.set(Number(row.attrs.r), row);
	}

	const options: WriteOptions = {
		context: { ...base, shared: sharedFormulas(sheetData) },
		width: grid.reduce((widest, row) => Math.max(widest, row.length), 1),
	};

	const rows = grid.map((values, index) =>
		writeRow(
			existingRows.get(index + 1) ?? element("row", {}),
			index + 1,
			values,
			options,
		),
	);
	detachOrphans(rows, options.context);
	sheetData.children = rows;

	const dimension = findElement(document.root, "dimension");
	if (dimension) {
		const last = `${columnRef(options.width - 1)}${Math.max(grid.length, 1)}`;
		dimension.attrs.ref = `A1:${last}`;
	}

	setPartText(entries, path, serializeXml(document));
}
