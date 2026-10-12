import { parseRange, rangeOf } from "#lib/sheet/merges.js";
import type { SheetTable } from "#lib/sheet/tables.js";
import { relsPartFor } from "./pptx-package";
import { NotASpreadsheetError } from "./xlsx-cells";
import {
	kid,
	kids,
	openRels,
	relList,
	relTarget,
	removeEntry,
	removeOverride,
} from "./xlsx-charts/package";
import { idOf } from "./xlsx-charts/read";
import type { Stylesheet } from "./xlsx-styles";
import { tableStyle } from "./xlsx-table-styles";
import {
	element,
	parseXml,
	serializeNode,
	serializeXml,
	type XmlDocument,
	type XmlElement,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * A worksheet's tables (`<tableParts>` → `xl/tables/tableN.xml`): read with
 * their style resolved for the grid, and kept true on save. Rows inserted or
 * deleted move the editor's copy of the range, and the save writes it back
 * with the column list Excel checks against the header row; a table whose
 * cells were all deleted loses its part.
 */

interface PartRef {
	part: string;
	relId: string;
	node: XmlElement;
}

function tableRefs(entries: ZipEntry[], sheetPath: string, sheet: XmlDocument) {
	const rels = openRels(entries, sheetPath);
	const refs: PartRef[] = [];
	for (const node of kids(kid(sheet.root, "tableParts"), "tablePart")) {
		const relId = idOf(node);
		const part = relTarget(rels, sheetPath, relId);
		if (relId && part && partText(entries, part) !== null) {
			refs.push({ part, relId, node });
		}
	}
	return { rels, refs };
}

const count = (value: string | undefined, fallback: number) => {
	const n = Number(value ?? fallback);
	return Number.isSafeInteger(n) && n >= 0 ? n : fallback;
};

function readTable(
	part: string,
	root: XmlElement,
	stylesheet: Stylesheet,
): SheetTable | null {
	const ref = root.attrs.ref ?? "";
	if (!parseRange(ref)) {
		return null;
	}
	const info = kid(root, "tableStyleInfo");
	const on = (name: string) =>
		info?.attrs[name] === "1" || info?.attrs[name] === "true";
	const style = tableStyle(stylesheet, info?.attrs.name);
	return {
		part,
		ref,
		headerRows: Math.min(1, count(root.attrs.headerRowCount, 1)),
		totalRows: Math.min(1, count(root.attrs.totalsRowCount, 0)),
		...(on("showFirstColumn") ? { firstColumn: true } : {}),
		...(on("showLastColumn") ? { lastColumn: true } : {}),
		...(on("showRowStripes") ? { rowStripes: true } : {}),
		...(on("showColumnStripes") ? { columnStripes: true } : {}),
		...(style ? { style } : {}),
	};
}

/** Every table on a worksheet; one that does not parse is left out. */
export function readSheetTables(
	entries: ZipEntry[],
	sheetPath: string,
	stylesheet: Stylesheet,
): SheetTable[] {
	try {
		const sheet = parseXml(partText(entries, sheetPath) ?? "");
		return tableRefs(entries, sheetPath, sheet).refs.flatMap(({ part }) => {
			const table = readTable(
				part,
				parseXml(partText(entries, part) ?? "").root,
				stylesheet,
			);
			return table ? [table] : [];
		});
	} catch {
		// A table we cannot read must not keep the cells from opening.
		return [];
	}
}

// =========================================================================
// Writing
// =========================================================================

/** Column names as Excel requires them: the header's text, unique, never empty. */
function columnNames(header: string[]): string[] {
	const taken = new Set<string>();
	return header.map((text, i) => {
		const base = text.trim() || `Column${i + 1}`;
		let name = base;
		for (let n = 2; taken.has(name.toLowerCase()); n++) {
			name = `${base}${n}`;
		}
		taken.add(name.toLowerCase());
		return name;
	});
}

/** The table part brought in line with its range and header; whether it changed. */
function updateTable(root: XmlElement, ref: string, rows: string[][]): boolean {
	const rect = parseRange(ref);
	if (!rect) {
		return false;
	}
	const headerRows = Math.min(1, count(root.attrs.headerRowCount, 1));
	const totalRows = Math.min(1, count(root.attrs.totalsRowCount, 0));
	// Excel keeps one body row in a table emptied of its data.
	rect.bottom = Math.max(rect.bottom, rect.top + headerRows + totalRows);
	const before = serializeNode(root);
	root.attrs.ref = rangeOf(rect);
	const filter = kid(root, "autoFilter");
	if (filter) {
		filter.attrs.ref = rangeOf({ ...rect, bottom: rect.bottom - totalRows });
	}
	const holder = kid(root, "tableColumns");
	if (holder) {
		const width = rect.right - rect.left + 1;
		const header = Array.from({ length: width }, (_, i) =>
			headerRows > 0 ? (rows[rect.top]?.[rect.left + i] ?? "") : "",
		);
		const names = columnNames(header);
		const existing = kids(holder, "tableColumn");
		let nextId = existing.reduce(
			(top, column) => Math.max(top, Number(column.attrs.id) || 0),
			0,
		);
		holder.children = names.map((name, i) => {
			const column =
				existing[i] ?? element("tableColumn", { id: String(++nextId) });
			// Without a header row the names are the file's own.
			if (headerRows > 0 || !column.attrs.name) {
				column.attrs.name = name;
			}
			return column;
		});
		holder.attrs.count = String(names.length);
	}
	return serializeNode(root) !== before;
}

/** A table part and every pointer to it removed. */
function removeTable(
	{ entries, types }: { entries: ZipEntry[]; types: XmlDocument },
	found: PartRef,
	{ sheet, rels }: { sheet: XmlDocument; rels: ReturnType<typeof openRels> },
): void {
	const holder = kid(sheet.root, "tableParts");
	if (holder) {
		holder.children = holder.children.filter((child) => child !== found.node);
		const left = kids(holder, "tablePart").length;
		if (left === 0) {
			sheet.root.children = sheet.root.children.filter((c) => c !== holder);
		} else {
			holder.attrs.count = String(left);
		}
	}
	rels.doc.root.children = relList(rels).filter(
		(rel) => rel.attrs.Id !== found.relId,
	);
	removeEntry(entries, found.part);
	removeEntry(entries, relsPartFor(found.part));
	removeOverride(types, found.part);
}

/**
 * The editor's tables applied to a worksheet's: ranges and column names
 * written back, deleted ones removed. `tables` undefined leaves them all.
 */
export function writeSheetTables(
	edit: { entries: ZipEntry[]; types: XmlDocument },
	sheetPath: string,
	tables: { part: string; ref: string }[] | undefined,
	rows: string[][],
): void {
	if (!tables) {
		return;
	}
	const { entries } = edit;
	const sheet = parseXml(partText(entries, sheetPath) ?? "");
	const { rels, refs } = tableRefs(entries, sheetPath, sheet);
	let removed = false;
	for (const found of refs) {
		const wanted = tables.find((table) => table.part === found.part);
		if (!wanted) {
			removeTable(edit, found, { sheet, rels });
			removed = true;
			continue;
		}
		const doc = parseXml(partText(entries, found.part) ?? "");
		if (updateTable(doc.root, wanted.ref, rows)) {
			setPartText(entries, found.part, serializeXml(doc));
		}
	}
	if (removed) {
		setPartText(entries, sheetPath, serializeXml(sheet));
		if (relList(rels).length > 0) {
			setPartText(entries, rels.path, serializeXml(rels.doc));
		} else {
			removeEntry(entries, rels.path);
		}
	}
}

/** The tables the editor sent, checked: absent leaves the file's. */
export function checkTables(
	value: unknown,
): { part: string; ref: string }[] | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (
		!Array.isArray(value) ||
		value.length > 1000 ||
		!value.every(
			(table) =>
				typeof table?.part === "string" &&
				table.part.length < 512 &&
				typeof table.ref === "string" &&
				parseRange(table.ref) !== null,
		)
	) {
		throw new NotASpreadsheetError("Malformed tables");
	}
	return value.map(({ part, ref }) => ({ part, ref }));
}
