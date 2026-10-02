import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pack, workbook } from "./test-utils";
import {
	columnIndex,
	columnRef,
	readWorkbook,
	type SheetInput,
	workbookFromText,
	workbookToText,
	writeWorkbook,
} from "./xlsx";
import { partText, readZip, type ZipEntry } from "./zip";

/** The first worksheet's XML after a write, for asserting on what survived. */
function sheetXml(entries: ZipEntry[], n = 1): string {
	return partText(entries, `xl/worksheets/sheet${n}.xml`) ?? "";
}

const rowsOf = (entries: ZipEntry[], index = 0) =>
	readWorkbook(entries)[index]?.rows;

/** Writes `rows` into the first sheet, every other sheet as it was. */
function writeFirst(entries: ZipEntry[], rows: string[][]): void {
	writeWorkbook(
		entries,
		readWorkbook(entries).map((sheet, i) => ({
			id: sheet.id,
			name: sheet.name,
			rows: i === 0 ? rows : sheet.rows,
		})),
	);
}

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOC_RELS =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/**
 * A three-sheet workbook with the parts a real one grows: defined names, a
 * calculation chain, a chartsheet, and a sheet-level name on the second.
 */
function richWorkbook(sheet1: string): ZipEntry[] {
	return readZip(
		pack({
			"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/calcChain.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml"/></Types>`,
			"xl/workbook.xml": `${PROLOG}<workbook xmlns="${MAIN}" xmlns:r="${DOC_RELS}"><bookViews><workbookView activeTab="2"/></bookViews><sheets><sheet name="Main" sheetId="1" r:id="rId1"/><sheet name="Data" sheetId="4" r:id="rId2"/><sheet name="Chart" sheetId="9" r:id="rId3"/></sheets><definedNames><definedName name="Rate">Data!$A$1</definedName><definedName name="Local" localSheetId="1">Data!$B$1</definedName><definedName name="Last" localSheetId="2">Main!$A$1</definedName></definedNames><calcPr calcId="191029"/></workbook>`,
			"xl/_rels/workbook.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${DOC_RELS}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${DOC_RELS}/worksheet" Target="/xl/worksheets/sheet2.xml"/><Relationship Id="rId3" Type="${DOC_RELS}/chartsheet" Target="chartsheets/sheet1.xml"/><Relationship Id="rId9" Type="${DOC_RELS}/calcChain" Target="calcChain.xml"/></Relationships>`,
			"xl/worksheets/sheet1.xml": `${PROLOG}<worksheet xmlns="${MAIN}"><sheetData>${sheet1}</sheetData></worksheet>`,
			"xl/worksheets/sheet2.xml": `${PROLOG}<worksheet xmlns="${MAIN}"><sheetData><row r="1"><c r="A1"><v>0.2</v></c></row></sheetData></worksheet>`,
			"xl/worksheets/_rels/sheet2.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"/>`,
			"xl/chartsheets/sheet1.xml": `${PROLOG}<chartsheet xmlns="${MAIN}"/>`,
			"xl/calcChain.xml": `${PROLOG}<calcChain xmlns="${MAIN}"><c r="A1" i="1"/></calcChain>`,
		}),
	);
}

describe("column references", () => {
	it("maps letters to indices and back", () => {
		for (const [ref, index] of [
			["A", 0],
			["Z", 25],
			["AA", 26],
			["AB", 27],
			["ZZ", 701],
			["AAA", 702],
		] as const) {
			expect(columnIndex(ref)).toBe(index);
			expect(columnRef(index)).toBe(ref);
		}
	});
});

describe("reading", () => {
	it("reads shared strings, inline strings, numbers and booleans", () => {
		const entries = readZip(
			workbook({
				sharedStrings: ["Item", "Widget"],
				rows:
					'<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>Qty</t></is></c></row>' +
					'<row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>3</v></c><c r="C2" t="b"><v>1</v></c></row>',
			}),
		);
		expect(rowsOf(entries)).toEqual([
			["Item", "Qty", ""],
			["Widget", "3", "TRUE"],
		]);
	});

	it("reads every worksheet with its name and id", () => {
		const sheets = readWorkbook(readZip(workbook({ rows: "" })));
		expect(sheets.map(({ id, name, rows }) => ({ id, name, rows }))).toEqual([
			{ id: 1, name: "First", rows: [[""]] },
			{ id: 2, name: "Second", rows: [["untouched"]] },
		]);
	});

	it("leaves chartsheets out, but counts their ids", () => {
		const entries = richWorkbook("");
		expect(readWorkbook(entries).map((sheet) => sheet.name)).toEqual([
			"Main",
			"Data",
		]);
		expect(JSON.parse(workbookToText(entries)).nextId).toBe(10);
	});

	it("reads a formula as typed and keeps the value the file recorded", () => {
		const entries = readZip(
			workbook({
				rows: '<row r="1"><c r="A1"><f>1+1</f><v>2</v></c><c r="B1"><f>_xlfn.CONCAT("a","b")</f></c></row>',
			}),
		);
		const [sheet] = readWorkbook(entries);
		expect(sheet?.rows).toEqual([["=1+1", '=CONCAT("a","b")']]);
		expect(sheet?.cached).toEqual({ "0:0": ["=1+1", "2"] });
	});

	it("expands a shared formula into each of its cells", () => {
		const entries = readZip(
			workbook({
				rows:
					'<row r="1"><c r="A1"><v>1</v></c><c r="B1"><f t="shared" ref="B1:B3" si="0">A1*2</f><v>2</v></c></row>' +
					'<row r="2"><c r="A2"><v>2</v></c><c r="B2"><f t="shared" si="0"/><v>4</v></c></row>' +
					'<row r="3"><c r="A3"><v>3</v></c><c r="B3"><f t="shared" si="0"/><v>6</v></c></row>',
			}),
		);
		expect(rowsOf(entries)).toEqual([
			["1", "=A1*2"],
			["2", "=A2*2"],
			["3", "=A3*2"],
		]);
	});

	it("shows an array formula's value, not the formula", () => {
		const entries = readZip(
			workbook({
				rows: '<row r="1"><c r="A1"><f t="array" ref="A1">SUM(B1:B2*C1:C2)</f><v>11</v></c></row>',
			}),
		);
		expect(rowsOf(entries)).toEqual([["11"]]);
	});

	it("leaves a gap where a sheet skips rows and columns", () => {
		const entries = readZip(
			workbook({
				rows: '<row r="1"><c r="A1"><v>1</v></c></row><row r="3"><c r="C3"><v>9</v></c></row>',
			}),
		);
		expect(rowsOf(entries)).toEqual([
			["1", "", ""],
			["", "", ""],
			["", "", "9"],
		]);
	});

	it("shows a date-formatted number as a date, with its time", () => {
		const entries = readZip(
			workbook({
				rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c><c r="B1" s="1"><v>46095.5</v></c></row>',
			}),
		);
		expect(rowsOf(entries)).toEqual([["2026-03-14", "2026-03-14 12:00:00"]]);
	});

	it("treats a custom format code with y/m/d as a date", () => {
		const entries = readZip(
			workbook({
				numFmts: '<numFmt numFmtId="200" formatCode="dd/mm/yyyy"/>',
				cellXfs: '<xf numFmtId="0"/><xf numFmtId="200"/>',
				rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c></row>',
			}),
		);
		expect(rowsOf(entries)?.[0]?.[0]).toBe("2026-03-14");
	});

	it("does not mistake a quoted literal in a format code for a date", () => {
		const entries = readZip(
			workbook({
				numFmts: '<numFmt numFmtId="200" formatCode="0.00&quot; days&quot;"/>',
				cellXfs: '<xf numFmtId="0"/><xf numFmtId="200"/>',
				rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c></row>',
			}),
		);
		expect(rowsOf(entries)?.[0]?.[0]).toBe("46095");
	});

	it("gives an empty workbook one empty cell to type into", () => {
		expect(rowsOf(readZip(workbook({ rows: "" })))).toEqual([[""]]);
	});
});

describe("writing cells", () => {
	it("leaves a cell the user did not touch exactly as it was", () => {
		const entries = readZip(
			workbook({
				sharedStrings: ["Widget"],
				rows:
					'<row r="1"><c r="A1" s="1" t="s"><v>0</v></c>' +
					'<c r="B1"><f>1+1</f><v>2</v></c><c r="C1"><v>1</v></c></row>',
			}),
		);
		writeFirst(entries, [["Widget", "=1+1", "2"]]);
		const xml = sheetXml(entries);

		expect(xml).toContain('<c r="A1" s="1" t="s"><v>0</v></c>');
		expect(xml).toContain('<c r="B1"><f>1+1</f><v>2</v></c>');
		expect(xml).toContain('<c r="C1"><v>2</v></c>');
	});

	it("drops a formula whose value the user overwrote", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1"><f>1+1</f><v>2</v></c></row>' }),
		);
		writeFirst(entries, [["7"]]);
		const xml = sheetXml(entries);

		expect(xml).not.toContain("<f>");
		expect(xml).toContain("<v>7</v>");
	});

	it("writes a typed formula as <f>, newer functions prefixed, and reads it back", () => {
		const entries = readZip(workbook({ rows: "" }));
		writeFirst(entries, [["2", "=A1*3", '=TEXTJOIN(",",TRUE,A1:B1)']]);
		const xml = sheetXml(entries);

		expect(xml).toContain("<f>A1*3</f>");
		expect(xml).toContain('<f>_xlfn.TEXTJOIN(",",TRUE,A1:B1)</f>');
		expect(xml).not.toContain("inlineStr");
		expect(rowsOf(entries)).toEqual([
			["2", "=A1*3", '=TEXTJOIN(",",TRUE,A1:B1)'],
		]);
	});

	it("writes a number as a number and text as an inline string", () => {
		const entries = readZip(workbook({ rows: "" }));
		writeFirst(entries, [["12.5", "hello", "-3e4"]]);
		const xml = sheetXml(entries);

		expect(xml).toContain('<c r="A1"><v>12.5</v></c>');
		expect(xml).toContain('t="inlineStr"');
		expect(xml).toContain('<t xml:space="preserve">hello</t>');
		expect(xml).toContain("<v>-3e4</v>");
	});

	it("keeps a cell's style when its value is cleared", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1" s="1"><v>1</v></c></row>' }),
		);
		writeFirst(entries, [[""]]);
		expect(sheetXml(entries)).toContain('<c r="A1" s="1"/>');
	});

	it("writes a date back as a serial, not as text", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c></row>' }),
		);
		writeFirst(entries, [["2026-12-25"]]);
		const xml = sheetXml(entries);

		expect(xml).toContain("<v>46381</v>");
		expect(xml).not.toContain("inlineStr");
	});

	it("updates the sheet's declared dimension", () => {
		const entries = readZip(workbook({ rows: "" }));
		writeFirst(entries, [
			["a", "b", "c"],
			["d", "e", "f"],
		]);
		expect(sheetXml(entries)).toContain('<dimension ref="A1:C2"/>');
	});

	it("never touches a sheet the user did not change", () => {
		const entries = readZip(workbook({ rows: "" }));
		const before = sheetXml(entries, 2);
		writeFirst(entries, [["changed"]]);
		expect(sheetXml(entries, 2)).toBe(before);
	});

	it("never rewrites the shared strings, so their counts stay honest", () => {
		const entries = readZip(workbook({ sharedStrings: ["Widget"], rows: "" }));
		const before = partText(entries, "xl/sharedStrings.xml");
		writeFirst(entries, [["a brand new string"]]);
		expect(partText(entries, "xl/sharedStrings.xml")).toBe(before);
	});

	it("round-trips a grid through a write and a read", () => {
		const grid = [
			["Item", "Qty"],
			["Doe, Jane", "1"],
			["", "42"],
		];
		const entries = readZip(workbook({ rows: "" }));
		writeFirst(entries, grid);
		expect(rowsOf(entries)).toEqual(grid);
	});

	it("drops rows the user deleted", () => {
		const entries = readZip(
			workbook({
				rows: '<row r="1"><c r="A1"><v>1</v></c></row><row r="2"><c r="A2"><v>2</v></c></row>',
			}),
		);
		writeFirst(entries, [["1"]]);
		expect(rowsOf(entries)).toEqual([["1"]]);
	});

	it("writes out a shared formula's cells when their master is overwritten", () => {
		const entries = readZip(
			workbook({
				rows:
					'<row r="1"><c r="A1"><v>1</v></c><c r="B1"><f t="shared" ref="B1:B2" si="0">A1*2</f><v>2</v></c></row>' +
					'<row r="2"><c r="A2"><v>2</v></c><c r="B2"><f t="shared" si="0"/><v>4</v></c></row>',
			}),
		);
		writeFirst(entries, [
			["1", "5"],
			["2", "=A2*2"],
		]);
		const xml = sheetXml(entries);
		expect(xml).not.toContain('t="shared"');
		expect(xml).toContain('<c r="B2"><f>A2*2</f><v>4</v></c>');
		expect(rowsOf(entries)).toEqual([
			["1", "5"],
			["2", "=A2*2"],
		]);
	});
});

describe("writing sheets", () => {
	const inputs = (entries: ZipEntry[]): SheetInput[] =>
		readWorkbook(entries).map(({ id, name, rows }) => ({ id, name, rows }));

	it("renames a sheet in place, and the defined names that point at it", () => {
		const entries = richWorkbook(
			'<row r="1"><c r="A1"><f>Data!A1*2</f></c></row>',
		);
		const [main, data] = inputs(entries);
		if (!(main && data)) {
			throw new Error("fixture");
		}
		writeWorkbook(entries, [
			{ ...main, rows: [["=Rates!A1*2"]] },
			{ ...data, name: "Rates" },
		]);
		const book = partText(entries, "xl/workbook.xml") ?? "";
		expect(book).toContain('<sheet name="Rates" sheetId="4" r:id="rId2"/>');
		expect(book).toContain('<definedName name="Rate">Rates!$A$1</definedName>');
		expect(readWorkbook(entries).map((s) => s.name)).toEqual(["Main", "Rates"]);
		expect(sheetXml(entries)).toContain("<f>Rates!A1*2</f>");
	});

	it("adds a sheet as a new part, related and typed", () => {
		const entries = richWorkbook("");
		writeWorkbook(entries, [
			...inputs(entries),
			{ id: 10, name: "New one", rows: [["hello", "=1+1"]] },
		]);
		const book = partText(entries, "xl/workbook.xml") ?? "";
		expect(book).toContain('<sheet name="New one" sheetId="10" r:id="rId4"/>');
		expect(partText(entries, "xl/_rels/workbook.xml.rels")).toContain(
			'Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"',
		);
		expect(partText(entries, "[Content_Types].xml")).toContain(
			'<Override PartName="/xl/worksheets/sheet3.xml"',
		);
		expect(readWorkbook(entries).at(-1)).toEqual({
			id: 10,
			name: "New one",
			rows: [["hello", "=1+1"]],
		});
	});

	it("declares the relationships prefix on a new sheet when the root does not", () => {
		// openpyxl declares it on each <sheet> instead of the root.
		const entries = readZip(
			readFileSync(path.resolve("tests/e2e/fixtures/office-report.xlsx")),
		);
		expect(partText(entries, "xl/workbook.xml")).not.toContain(
			"<workbook xmlns:r=",
		);
		writeWorkbook(entries, [
			...inputs(entries),
			{ id: 3, name: "Third", rows: [["x"]] },
		]);
		expect(partText(entries, "xl/workbook.xml")).toContain(
			`<sheet name="Third" sheetId="3" xmlns:r="${DOC_RELS}" r:id="rId5"/>`,
		);
		expect(readWorkbook(entries).map((s) => s.name)).toEqual([
			"Budget",
			"Notes",
			"Third",
		]);
		expect(rowsOf(entries)?.[1]).toEqual(["Widget", "3", "4.5", "=B2*C2"]);
	});

	it("deletes a sheet with its part, and fixes what pointed at it", () => {
		const entries = richWorkbook("");
		const [main] = inputs(entries);
		if (!main) {
			throw new Error("fixture");
		}
		writeWorkbook(entries, [main]);
		const book = partText(entries, "xl/workbook.xml") ?? "";
		expect(book).not.toContain('name="Data"');
		expect(book).toContain('<definedName name="Rate">#REF!</definedName>');
		expect(book).not.toContain('name="Local"');
		// The chartsheet was third and is now second.
		expect(book).toContain('<definedName name="Last" localSheetId="1">');
		expect(book).toContain('activeTab="0"');
		expect(partText(entries, "xl/worksheets/sheet2.xml")).toBeNull();
		expect(partText(entries, "xl/worksheets/_rels/sheet2.xml.rels")).toBeNull();
		expect(partText(entries, "[Content_Types].xml")).not.toContain(
			"sheet2.xml",
		);
		expect(partText(entries, "xl/_rels/workbook.xml.rels")).not.toContain(
			"sheet2.xml",
		);
	});

	it("drops the calculation chain and asks for a recalculation on open", () => {
		const entries = richWorkbook("");
		writeWorkbook(entries, inputs(entries));
		expect(partText(entries, "xl/calcChain.xml")).toBeNull();
		expect(partText(entries, "[Content_Types].xml")).not.toContain("calcChain");
		expect(partText(entries, "xl/workbook.xml")).toContain(
			'<calcPr calcId="191029" fullCalcOnLoad="1"/>',
		);
		const plain = readZip(workbook({ rows: "" }));
		writeWorkbook(plain, inputs(plain));
		expect(partText(plain, "xl/workbook.xml")).toContain(
			'</sheets><calcPr fullCalcOnLoad="1"/>',
		);
	});

	it("refuses what would make a broken file", () => {
		const entries = richWorkbook("");
		const [main, data] = inputs(entries);
		if (!(main && data)) {
			throw new Error("fixture");
		}
		expect(() => writeWorkbook(entries, [])).toThrow();
		expect(() =>
			writeWorkbook(entries, [main, { ...data, name: "main" }]),
		).toThrow();
		expect(() => writeWorkbook(entries, [{ ...main, name: "a/b" }])).toThrow();
		expect(() =>
			writeWorkbook(entries, [main, { id: 9, name: "X", rows: [] }]),
		).toThrow();
	});
});

describe("the editor's text", () => {
	it("round-trips the workbook as JSON", () => {
		const entries = readZip(workbook({ rows: "" }));
		const text = JSON.parse(workbookToText(entries));
		text.sheets[0].rows = [["a", "=1+2"]];
		text.sheets[1].name = "Renamed";
		workbookFromText(entries, JSON.stringify(text));
		expect(
			readWorkbook(entries).map(({ name, rows }) => ({ name, rows })),
		).toEqual([
			{ name: "First", rows: [["a", "=1+2"]] },
			{ name: "Renamed", rows: [["untouched"]] },
		]);
	});

	it("still takes a CSV, into the first sheet", () => {
		const entries = readZip(workbook({ rows: "" }));
		workbookFromText(entries, "x,y\n1,2\n");
		expect(rowsOf(entries)).toEqual([
			["x", "y"],
			["1", "2"],
		]);
		expect(rowsOf(entries, 1)).toEqual([["untouched"]]);
	});

	it("refuses a malformed sheet", () => {
		const entries = readZip(workbook({ rows: "" }));
		expect(() =>
			workbookFromText(
				entries,
				JSON.stringify({ sheets: [{ id: 1, name: "x", rows: [[1]] }] }),
			),
		).toThrow();
		expect(() =>
			workbookFromText(
				entries,
				JSON.stringify({ sheets: [{ id: "1", name: "x", rows: [] }] }),
			),
		).toThrow();
	});
});
