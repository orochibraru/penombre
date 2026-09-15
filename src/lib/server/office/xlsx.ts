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
	type XmlElement,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * A workbook's first sheet, as a grid, and back again.
 *
 * Writing is surgical: a cell whose text the user did not change keeps its
 * original XML, so its formula, number format, shared-string reference and
 * style survive untouched. Only cells that actually changed are rewritten,
 * and every other part of the package — other sheets, charts, drawings,
 * defined names, the theme — is never even parsed.
 *
 * Sheets after the first are preserved but not shown: the editor is one grid,
 * and inventing a sheet switcher for it is a different feature.
 */

/** Built-in number formats that mean a date or a time. */
const DATE_FORMAT_IDS = new Set([
	14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57,
]);

/** Excel's epoch is 1899-12-30: day 1 is 1900-01-01, with the 1900 leap bug. */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

export interface SheetGrid {
	rows: string[][];
	/** Cell references that hold a date, so an edit can be written back as one. */
	dateCells: Set<string>;
}

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

/** The worksheet part the workbook's first sheet points at. */
function firstSheetPath(entries: ZipEntry[]): string {
	const workbook = partText(entries, "xl/workbook.xml");
	const rels = partText(entries, "xl/_rels/workbook.xml.rels");
	if (!(workbook && rels)) {
		throw new NotASpreadsheetError("Workbook part is missing");
	}
	const sheet = findElement(parseXml(workbook).root, "sheet");
	const id = sheet?.attrs["r:id"];
	if (!id) {
		throw new NotASpreadsheetError("Workbook declares no sheet");
	}
	const target = findElements(parseXml(rels).root, "Relationship").find(
		(relationship) => relationship.attrs.Id === id,
	)?.attrs.Target;
	if (!target) {
		throw new NotASpreadsheetError(`No relationship for ${id}`);
	}
	// Targets are relative to the part's own folder, `xl/`.
	return `xl/${target.replace(/^\/?xl\//, "").replace(/^\//, "")}`;
}

export class NotASpreadsheetError extends Error {}

/** Shared strings, in index order; rich-text runs are flattened. */
function sharedStrings(entries: ZipEntry[]): string[] {
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
function dateStyles(entries: ZipEntry[]): boolean[] {
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

/** The text a cell displays, given the workbook's strings and styles. */
function cellText(
	cell: XmlElement,
	strings: string[],
	isDate: boolean,
): string {
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
		return strings[Number(raw)] ?? "";
	}
	if (type === "b") {
		return raw === "1" ? "TRUE" : "FALSE";
	}
	if (type === "e" || type === "str") {
		return raw;
	}
	if (isDate) {
		const serial = Number(raw);
		return Number.isFinite(serial)
			? serialToText(serial, !Number.isInteger(serial))
			: raw;
	}
	return raw;
}

/** One `<row>` as its values, noting any cell that carries a date format. */
function rowValues(
	row: XmlElement,
	strings: string[],
	styles: boolean[],
	dateCells: Set<string>,
): string[] {
	const values: string[] = [];
	for (const cell of childrenNamed(row, "c")) {
		const ref = cell.attrs.r ?? "";
		const column = ref ? splitRef(ref).column : values.length;
		const isDate = styles[Number(cell.attrs.s ?? 0)] === true;
		if (isDate) {
			dateCells.add(ref);
		}
		while (values.length < column) {
			values.push("");
		}
		values[column] = cellText(cell, strings, isDate);
	}
	return values;
}

export function readSheet(entries: ZipEntry[]): SheetGrid {
	const path = firstSheetPath(entries);
	const source = partText(entries, path);
	if (!source) {
		throw new NotASpreadsheetError(`Missing worksheet part ${path}`);
	}
	const strings = sharedStrings(entries);
	const styles = dateStyles(entries);
	const sheetData = findElement(parseXml(source).root, "sheetData");

	const rows: string[][] = [];
	const dateCells = new Set<string>();

	for (const row of sheetData ? childrenNamed(sheetData, "row") : []) {
		const number = Number(row.attrs.r);
		// A row carries its own number, and a sheet may skip rows entirely.
		const index = (Number.isFinite(number) ? number : rows.length + 1) - 1;
		while (rows.length < index) {
			rows.push([]);
		}
		rows[index] = rowValues(row, strings, styles, dateCells);
	}

	// A rectangle: the grid editor pads short rows anyway, and doing it here
	// keeps the write side comparing like with like.
	const width = rows.reduce((widest, row) => Math.max(widest, row.length), 1);
	for (const row of rows) {
		while (row.length < width) {
			row.push("");
		}
	}

	return { rows: rows.length > 0 ? rows : [[""]], dateCells };
}

/** `<v>` plus the type attribute for a value the user typed. */
function writeValue(cell: XmlElement, value: string, isDate: boolean): void {
	// A formula's cached result is meaningless once the value is overwritten,
	// and leaving it would have the next reader recompute over the old inputs.
	cell.children = cell.children.filter(
		(child) =>
			!(isElement(child) && (child.name === "f" || child.name === "v")),
	);
	cell.children = cell.children.filter(
		(child) => !(isElement(child) && child.name === "is"),
	);
	cell.attrs.t = undefined;

	if (value === "") {
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
	strings: string[];
	styles: boolean[];
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
	const isDate = existing
		? options.styles[Number(existing.attrs.s ?? 0)] === true
		: false;
	if (existing && cellText(existing, options.strings, isDate) === value) {
		// Untouched: keep the cell exactly as the writer left it — formula,
		// number format, shared-string reference and all.
		return existing;
	}
	if (!existing && value === "") {
		return null;
	}
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

/** Apply an edited grid to the workbook's first sheet, in place. */
export function writeSheet(entries: ZipEntry[], grid: string[][]): void {
	const path = firstSheetPath(entries);
	const source = partText(entries, path);
	if (!source) {
		throw new NotASpreadsheetError(`Missing worksheet part ${path}`);
	}
	const document = parseXml(source);
	const sheetData = findElement(document.root, "sheetData");
	if (!sheetData) {
		throw new NotASpreadsheetError("Worksheet has no sheetData");
	}

	const existingRows = new Map<number, XmlElement>();
	for (const row of childrenNamed(sheetData, "row")) {
		existingRows.set(Number(row.attrs.r), row);
	}

	const options: WriteOptions = {
		strings: sharedStrings(entries),
		styles: dateStyles(entries),
		width: grid.reduce((widest, row) => Math.max(widest, row.length), 1),
	};

	sheetData.children = grid.map((values, index) =>
		writeRow(
			existingRows.get(index + 1) ?? element("row", {}),
			index + 1,
			values,
			options,
		),
	);

	const dimension = findElement(document.root, "dimension");
	if (dimension) {
		const last = `${columnRef(options.width - 1)}${Math.max(grid.length, 1)}`;
		dimension.attrs.ref = `A1:${last}`;
	}

	setPartText(entries, path, serializeXml(document));
}
