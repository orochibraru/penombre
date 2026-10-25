import { sourceOf } from "#lib/chart/data.js";
import { type Chart, checkCharts } from "#lib/chart/model.js";
import { parseCsv } from "#lib/documents.js";
import { createWorkbook, renameSheetRefs } from "#lib/formula.js";
import { checkDropdowns, type Dropdown } from "#lib/sheet/dropdowns.js";
import type { Freeze } from "#lib/sheet/layout.js";
import { isMergeList } from "#lib/sheet/merges.js";
import { type CellStyle, isStyleGrid } from "#lib/sheet/styles.js";

import {
	type Base,
	dateStyles,
	NotASpreadsheetError,
	readPart,
	sharedStrings,
	type SheetFormats,
	type WorkbookSheet,
	writePart,
} from "./xlsx-cells";
import {
	readSheetCharts,
	workbookPalette,
	writeSheetCharts,
} from "./xlsx-charts/index";
import { readSheetPictures } from "./xlsx-pictures";
import { rulesContext } from "./xlsx-rules";
import { mappedFormats, styleTable, styleWriterFor } from "./xlsx-style-writer";
import { readStyles, Stylesheet } from "./xlsx-styles";
import { checkTables, readSheetTables, writeSheetTables } from "./xlsx-tables";
import { checkView } from "./xlsx-view";
import {
	childNamed,
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

export {
	columnIndex,
	columnRef,
	NotASpreadsheetError,
	type WorkbookSheet,
} from "./xlsx-cells";

/**
 * A workbook's worksheets, as grids, and back again; the cells themselves are
 * `xlsx-cells.ts`. Sheets are matched by their `sheetId`, so a renamed sheet
 * is still the same part; a sheet added in the editor gets a new part, and
 * one deleted there loses its own. Charts are `xlsx-charts/`; the theme
 * and every other part are never parsed.
 *
 * The editor speaks JSON for a workbook: `{ nextId, sheets: [{ id, name,
 * rows, cached, charts }] }`, `cached` holding the values the file recorded for its
 * formulas, for the ones the editor's engine cannot compute.
 */

const WORKBOOK = "xl/workbook.xml";
const WORKBOOK_RELS = "xl/_rels/workbook.xml.rels";
const CONTENT_TYPES = "[Content_Types].xml";
const REL_NS =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const WORKSHEET_CONTENT =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";
const EMPTY_WORKSHEET =
	'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
	'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
	`xmlns:r="${REL_NS}"><dimension ref="A1"/><sheetData/></worksheet>`;

// =========================================================================
// The workbook part: which sheets there are, and where
// =========================================================================

interface SheetEntry {
	/** The `<sheet>` element in workbook.xml. */
	element: XmlElement;
	id: number;
	name: string;
	/** The worksheet part, or null for a chartsheet or anything else. */
	path: string | null;
	relationship: XmlElement | undefined;
}

interface Package {
	workbook: XmlDocument;
	rels: XmlDocument;
	sheets: SheetEntry[];
}

/** Targets are relative to the part's own folder, `xl/`. */
const partPath = (target: string) =>
	`xl/${target.replace(/^\/?xl\//, "").replace(/^\//, "")}`;

function openPackage(entries: ZipEntry[]): Package {
	const workbookText = partText(entries, WORKBOOK);
	const relsText = partText(entries, WORKBOOK_RELS);
	if (!(workbookText && relsText)) {
		throw new NotASpreadsheetError("Workbook part is missing");
	}
	const workbook = parseXml(workbookText);
	const rels = parseXml(relsText);
	const relationships = findElements(rels.root, "Relationship");
	const sheets = findElements(workbook.root, "sheet").map((sheet) => {
		const relationship = relationships.find(
			(r) => r.attrs.Id === sheet.attrs["r:id"],
		);
		const target = relationship?.attrs.Target;
		const isWorksheet = relationship?.attrs.Type === `${REL_NS}/worksheet`;
		return {
			element: sheet,
			id: Number(sheet.attrs.sheetId),
			name: sheet.attrs.name ?? "",
			path: target && isWorksheet ? partPath(target) : null,
			relationship,
		};
	});
	if (!sheets.some((sheet) => sheet.path)) {
		throw new NotASpreadsheetError("Workbook declares no worksheet");
	}
	return { workbook, rels, sheets };
}

/** Every worksheet, in workbook order. Chartsheets are left out. */
export function readWorkbook(entries: ZipEntry[]): WorkbookSheet[] {
	const { sheets } = openPackage(entries);
	const base = {
		strings: sharedStrings(entries),
		styles: dateStyles(entries),
		rules: rulesContext(entries),
	};
	return sheets.flatMap((sheet) => {
		const source = sheet.path ? partText(entries, sheet.path) : null;
		if (!source) {
			return [];
		}
		return [{ id: sheet.id, name: sheet.name, ...readPart(source, base) }];
	});
}

/** Every worksheet, with the charts that float over it. */
export function readWorkbookCharts(
	entries: ZipEntry[],
): (WorkbookSheet & { charts?: Chart[] })[] {
	const palette = workbookPalette(entries);
	const paths = new Map(
		openPackage(entries).sheets.map((sheet) => [sheet.id, sheet.path]),
	);
	return readWorkbook(entries).map((sheet) => {
		const path = paths.get(sheet.id);
		const charts = path ? readSheetCharts(entries, path, palette) : [];
		return charts.length > 0 ? { ...sheet, charts } : sheet;
	});
}

/** The workbook as the sheet editor's JSON. */
export function workbookToText(entries: ZipEntry[]): string {
	const { sheets } = openPackage(entries);
	// Chartsheets hold ids too, and a sheet added in the editor must not
	// take one of theirs.
	const nextId =
		sheets.reduce(
			(highest, sheet) =>
				Math.max(highest, Number.isFinite(sheet.id) ? sheet.id : 0),
			0,
		) + 1;
	const paths = new Map(sheets.map((sheet) => [sheet.id, sheet.path]));
	const stylesheet = new Stylesheet(entries);
	return JSON.stringify({
		nextId,
		sheets: readWorkbookCharts(entries).map((sheet) => {
			const path = paths.get(sheet.id);
			if (!path) {
				return sheet;
			}
			const pictures = readSheetPictures(entries, path);
			const tables = readSheetTables(entries, path, stylesheet);
			return {
				...sheet,
				...(pictures.length > 0 ? { pictures } : {}),
				...(tables.length > 0 ? { tables } : {}),
			};
		}),
		styles: readStyles(entries),
	});
}

// =========================================================================
// Writing the workbook: sheets renamed, added and deleted
// =========================================================================

/** What the editor sends back for one sheet. */
export interface SheetInput {
	id: number;
	name: string;
	rows: string[][];
	/** Absent: the sheet's charts are left as they are. */
	charts?: Chart[];
	/** Indices into the editor's style table; absent keeps the file's. */
	styleIds?: number[][];
	/** Merged ranges; absent keeps the file's. */
	merges?: string[];
	/** List validations; absent keeps the file's. */
	dropdowns?: Dropdown[];
	/** Column widths in pixels; absent or 0 keeps the file's. */
	widths?: number[];
	freeze?: Freeze;
	/** Each table's part and range; absent keeps the file's tables. */
	tables?: { part: string; ref: string }[];
}

function checkLayout(sheet: Partial<SheetInput>): Partial<SheetInput> {
	const view = checkView(sheet);
	if (!view) {
		throw new NotASpreadsheetError("Malformed sheet view");
	}
	const tables = checkTables(sheet.tables);
	return { ...view, ...(tables ? { tables } : {}) };
}

const isGrid = (rows: unknown): rows is string[][] =>
	Array.isArray(rows) &&
	rows.every(
		(row) =>
			Array.isArray(row) && row.every((cell) => typeof cell === "string"),
	);

function checkFormats(sheet: Partial<SheetInput>): Partial<SheetInput> {
	const { styleIds, merges } = sheet;
	const dropdowns =
		sheet.dropdowns === undefined ? undefined : checkDropdowns(sheet.dropdowns);
	if (
		(styleIds !== undefined && !isStyleGrid(styleIds)) ||
		(merges !== undefined && !isMergeList(merges)) ||
		(sheet.dropdowns !== undefined && !dropdowns)
	) {
		throw new NotASpreadsheetError("Malformed formatting");
	}
	return {
		...(styleIds ? { styleIds } : {}),
		...(merges ? { merges } : {}),
		...(dropdowns ? { dropdowns } : {}),
	};
}

/** The editor's JSON, checked: it crossed the network. */
function parseSheets(content: string): SheetInput[] | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		return null;
	}
	const sheets = (parsed as { sheets?: unknown } | null)?.sheets;
	if (!Array.isArray(sheets)) {
		return null;
	}
	return sheets.map((sheet: Partial<SheetInput>) => {
		if (
			!(Number.isSafeInteger(sheet.id) && (sheet.id ?? 0) > 0) ||
			typeof sheet.name !== "string" ||
			!isGrid(sheet.rows)
		) {
			throw new NotASpreadsheetError("Malformed sheet");
		}
		return {
			id: sheet.id ?? 0,
			name: sheet.name,
			rows: sheet.rows,
			charts: checkCharts(sheet.charts),
			...checkFormats(sheet),
			...checkLayout(sheet),
		};
	});
}

/** Excel's rules for sheet names and ids; a file breaking them will not open. */
function checkSheets(sheets: SheetInput[]): void {
	if (sheets.length === 0) {
		throw new NotASpreadsheetError("A workbook needs a sheet");
	}
	const names = new Set<string>();
	const ids = new Set<number>();
	for (const { id, name } of sheets) {
		const lower = name.toLowerCase();
		if (
			!/^[^[\]:*?/\\]{1,31}$/.test(name) ||
			name.trim() === "" ||
			name.startsWith("'") ||
			name.endsWith("'") ||
			names.has(lower) ||
			ids.has(id)
		) {
			throw new NotASpreadsheetError(`Invalid sheet name or id: ${name}`);
		}
		names.add(lower);
		ids.add(id);
	}
}

/** Rewrites every defined name's formula; a null result drops the name. */
function rewriteDefinedNames(
	workbook: XmlDocument,
	rewrite: (formula: string, local: number | null) => string | null,
): void {
	const holder = findElement(workbook.root, "definedNames");
	if (!holder) {
		return;
	}
	holder.children = holder.children.filter((child) => {
		if (!(isElement(child) && child.name === "definedName")) {
			return true;
		}
		const local = child.attrs.localSheetId;
		const next = rewrite(
			`=${textContent(child)}`,
			local === undefined ? null : Number(local),
		);
		if (next === null) {
			return false;
		}
		child.children = [text(next.slice(1))];
		return true;
	});
}

function removeOverride(types: XmlDocument, path: string): void {
	types.root.children = types.root.children.filter(
		(child) =>
			!(
				isElement(child) &&
				child.name === "Override" &&
				child.attrs.PartName === `/${path}`
			),
	);
}

function removeEntry(entries: ZipEntry[], name: string): void {
	const at = entries.findIndex((entry) => entry.name === name);
	if (at >= 0) {
		entries.splice(at, 1);
	}
}

interface Edit {
	entries: ZipEntry[];
	pkg: Package;
	types: XmlDocument;
}

function dropSheets(edit: Edit, removed: SheetEntry[]): void {
	if (removed.length === 0) {
		return;
	}
	const { entries, pkg, types } = edit;
	const positions = removed.map((sheet) => pkg.sheets.indexOf(sheet));
	rewriteDefinedNames(pkg.workbook, (formula, local) => {
		if (local !== null && positions.includes(local)) {
			return null;
		}
		return removed.reduce(
			(text, sheet) => renameSheetRefs(text, sheet.name, null),
			formula,
		);
	});
	for (const name of findElements(pkg.workbook.root, "definedName")) {
		const local = name.attrs.localSheetId;
		if (local !== undefined) {
			const shift = positions.filter((p) => p < Number(local)).length;
			name.attrs.localSheetId = String(Number(local) - shift);
		}
	}
	for (const sheet of removed) {
		const holder = findElement(pkg.workbook.root, "sheets");
		if (holder) {
			holder.children = holder.children.filter(
				(child) => child !== sheet.element,
			);
		}
		pkg.rels.root.children = pkg.rels.root.children.filter(
			(child) => child !== sheet.relationship,
		);
		if (sheet.path) {
			removeEntry(entries, sheet.path);
			removeEntry(entries, sheet.path.replace(/([^/]+)$/, "_rels/$1.rels"));
			removeOverride(types, sheet.path);
		}
	}
	const remaining = pkg.sheets.length - removed.length;
	for (const view of findElements(pkg.workbook.root, "workbookView")) {
		for (const attr of ["activeTab", "firstSheet"]) {
			if (Number(view.attrs[attr] ?? 0) >= remaining) {
				view.attrs[attr] = "0";
			}
		}
	}
}

function renameEntry(pkg: Package, sheet: SheetEntry, name: string): void {
	sheet.element.attrs.name = name;
	rewriteDefinedNames(pkg.workbook, (formula) =>
		renameSheetRefs(formula, sheet.name, name),
	);
}

/** The first name `make(n)` gives that `taken` does not hold. */
function unused(taken: (name: string) => boolean, make: (n: number) => string) {
	for (let n = 1; ; n++) {
		if (!taken(make(n))) {
			return make(n);
		}
	}
}

function addSheetPart(
	edit: Edit,
	input: SheetInput,
	base: Base,
	formats?: SheetFormats,
): string {
	const { entries, pkg, types } = edit;
	const path = unused(
		(name) => entries.some((entry) => entry.name === name),
		(n) => `xl/worksheets/sheet${n}.xml`,
	);
	const relId = unused(
		(id) =>
			findElements(pkg.rels.root, "Relationship").some(
				(r) => r.attrs.Id === id,
			),
		(n) => `rId${n}`,
	);
	setPartText(entries, path, EMPTY_WORKSHEET);
	writePart(entries, path, { rows: input.rows, ...formats }, base);
	pkg.rels.root.children.push(
		element("Relationship", {
			Id: relId,
			Type: `${REL_NS}/worksheet`,
			Target: path.replace(/^xl\//, ""),
		}),
	);
	types.root.children.push(
		element("Override", {
			PartName: `/${path}`,
			ContentType: WORKSHEET_CONTENT,
		}),
	);
	const holder = findElement(pkg.workbook.root, "sheets");
	holder?.children.push(
		element("sheet", {
			name: input.name,
			sheetId: String(input.id),
			// openpyxl declares the prefix on each `<sheet>` rather than the root.
			"xmlns:r": pkg.workbook.root.attrs["xmlns:r"] ? undefined : REL_NS,
			"r:id": relId,
		}),
	);
	return path;
}

/**
 * Cached results are gone from every cell we rewrote, so the calculation
 * chain (a cache of its own, which Excel "repairs" when it names a cell that
 * no longer holds a formula) goes, and Excel is told to recalculate on open.
 */
function recalculateOnOpen(edit: Edit): void {
	const { entries, pkg, types } = edit;
	const chain = findElements(pkg.rels.root, "Relationship").find((r) =>
		r.attrs.Type?.endsWith("/calcChain"),
	);
	if (chain) {
		const path = partPath(chain.attrs.Target ?? "");
		pkg.rels.root.children = pkg.rels.root.children.filter((c) => c !== chain);
		removeEntry(entries, path);
		removeOverride(types, path);
	}
	let calcPr = findElement(pkg.workbook.root, "calcPr");
	if (!calcPr) {
		calcPr = element("calcPr", {});
		// Schema order: calcPr follows these, whichever are present.
		const before = [
			"definedNames",
			"externalReferences",
			"functionGroups",
			"sheets",
		]
			.map((name) => childNamed(pkg.workbook.root, name))
			.find(Boolean);
		const at = before ? pkg.workbook.root.children.indexOf(before) + 1 : 0;
		pkg.workbook.root.children.splice(at, 0, calcPr);
	}
	calcPr.attrs.fullCalcOnLoad = "1";
}

/** The editor's sheets applied to the workbook, in place. */
export function writeWorkbook(
	entries: ZipEntry[],
	sheets: SheetInput[],
	styles: CellStyle[] = [],
): void {
	checkSheets(sheets);
	const pkg = openPackage(entries);
	const typesText = partText(entries, CONTENT_TYPES);
	if (!typesText) {
		throw new NotASpreadsheetError("Package has no content types");
	}
	const edit: Edit = { entries, pkg, types: parseXml(typesText) };
	// Styles first: a new combination is appended before a cell points at it.
	const writer = styleWriterFor(entries, styles, sheets, {
		rels: pkg.rels,
		types: edit.types,
	});
	const formats = new Map(
		sheets.map((sheet) => [
			sheet.id,
			{
				...mappedFormats(writer, sheet),
				dropdowns: sheet.dropdowns,
				widths: sheet.widths,
				freeze: sheet.freeze,
			},
		]),
	);
	writer.save();
	const base = {
		strings: sharedStrings(entries),
		styles: dateStyles(entries),
		rules: { ...rulesContext(entries), dxf: writer.dxf },
	};
	const wanted = new Map(sheets.map((sheet) => [sheet.id, sheet]));

	dropSheets(
		edit,
		pkg.sheets.filter((sheet) => sheet.path && !wanted.has(sheet.id)),
	);
	for (const sheet of pkg.sheets) {
		const input = wanted.get(sheet.id);
		if (!(sheet.path && input)) {
			continue;
		}
		if (input.name !== sheet.name) {
			renameEntry(pkg, sheet, input.name);
		}
		writePart(
			entries,
			sheet.path,
			{ rows: input.rows, ...formats.get(input.id) },
			base,
		);
	}
	const byId = new Map(pkg.sheets.map((sheet) => [sheet.id, sheet]));
	const paths = new Map<number, string>();
	for (const input of sheets) {
		const existing = byId.get(input.id);
		if (existing && !existing.path) {
			throw new NotASpreadsheetError(`Sheet ${input.id} is not a worksheet`);
		}
		paths.set(
			input.id,
			existing?.path ?? addSheetPart(edit, input, base, formats.get(input.id)),
		);
	}
	if (sheets.some((sheet) => sheet.charts !== undefined)) {
		const source = sourceOf(createWorkbook(sheets), sheets);
		const palette = workbookPalette(entries);
		sheets.forEach((input, index) => {
			const path = paths.get(input.id);
			if (path) {
				writeSheetCharts(
					edit,
					{ path, index, charts: input.charts },
					{ source, palette },
				);
			}
		});
	}
	for (const input of sheets) {
		const path = paths.get(input.id);
		if (path) {
			writeSheetTables(edit, path, input.tables, input.rows);
		}
	}
	recalculateOnOpen(edit);
	// Chip colours append their formats while the sheets are written.
	writer.save();

	setPartText(entries, WORKBOOK, serializeXml(pkg.workbook));
	setPartText(entries, WORKBOOK_RELS, serializeXml(pkg.rels));
	setPartText(entries, CONTENT_TYPES, serializeXml(edit.types));
}

/**
 * The editor's text applied to the workbook. A CSV (what the editor sent
 * before it knew about sheets) replaces the first sheet and keeps the rest.
 */
export function workbookFromText(entries: ZipEntry[], content: string): void {
	const sheets =
		parseSheets(content) ??
		readWorkbook(entries).map(({ id, name, rows }, index) => ({
			id,
			name,
			rows: index === 0 ? parseCsv(content) : rows,
		}));
	writeWorkbook(entries, sheets, styleTableOf(content));
}

function styleTableOf(content: string): CellStyle[] {
	try {
		return styleTable(JSON.parse(content));
	} catch {
		return [];
	}
}
