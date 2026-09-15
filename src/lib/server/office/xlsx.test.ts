import { describe, expect, it } from "bun:test";
import { workbook } from "./test-utils";
import { columnIndex, columnRef, readSheet, writeSheet } from "./xlsx";
import { partText, readZip } from "./zip";

/** The first worksheet's XML after a write, for asserting on what survived. */
function sheetXml(entries: ReturnType<typeof readZip>): string {
	return partText(entries, "xl/worksheets/sheet1.xml") ?? "";
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

describe("readSheet", () => {
	it("reads shared strings, inline strings, numbers and booleans", () => {
		const entries = readZip(
			workbook({
				sharedStrings: ["Item", "Widget"],
				rows:
					'<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>Qty</t></is></c></row>' +
					'<row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>3</v></c><c r="C2" t="b"><v>1</v></c></row>',
			}),
		);
		expect(readSheet(entries).rows).toEqual([
			["Item", "Qty", ""],
			["Widget", "3", "TRUE"],
		]);
	});

	it("reads a formula's cached result, not the formula", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1"><f>1+1</f><v>2</v></c></row>' }),
		);
		expect(readSheet(entries).rows).toEqual([["2"]]);
	});

	it("leaves a gap where a sheet skips rows and columns", () => {
		const entries = readZip(
			workbook({
				rows: '<row r="1"><c r="A1"><v>1</v></c></row><row r="3"><c r="C3"><v>9</v></c></row>',
			}),
		);
		expect(readSheet(entries).rows).toEqual([
			["1", "", ""],
			["", "", ""],
			["", "", "9"],
		]);
	});

	it("shows a date-formatted number as a date", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c></row>' }),
		);
		const sheet = readSheet(entries);
		expect(sheet.rows[0]?.[0]).toBe("2026-03-14");
		expect(sheet.dateCells.has("A1")).toBe(true);
	});

	it("shows a date-and-time serial with its time", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1" s="1"><v>46095.5</v></c></row>' }),
		);
		expect(readSheet(entries).rows[0]?.[0]).toBe("2026-03-14 12:00:00");
	});

	it("treats a custom format code with y/m/d as a date", () => {
		const entries = readZip(
			workbook({
				numFmts: '<numFmt numFmtId="200" formatCode="dd/mm/yyyy"/>',
				cellXfs: '<xf numFmtId="0"/><xf numFmtId="200"/>',
				rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c></row>',
			}),
		);
		expect(readSheet(entries).rows[0]?.[0]).toBe("2026-03-14");
	});

	it("does not mistake a quoted literal in a format code for a date", () => {
		const entries = readZip(
			workbook({
				numFmts: '<numFmt numFmtId="200" formatCode="0.00&quot; days&quot;"/>',
				cellXfs: '<xf numFmtId="0"/><xf numFmtId="200"/>',
				rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c></row>',
			}),
		);
		expect(readSheet(entries).rows[0]?.[0]).toBe("46095");
	});

	it("gives an empty workbook one empty cell to type into", () => {
		expect(readSheet(readZip(workbook({ rows: "" }))).rows).toEqual([[""]]);
	});
});

describe("writeSheet", () => {
	it("leaves a cell the user did not touch exactly as it was", () => {
		const entries = readZip(
			workbook({
				sharedStrings: ["Widget"],
				rows:
					'<row r="1"><c r="A1" s="1" t="s"><v>0</v></c>' +
					'<c r="B1"><f>1+1</f><v>2</v></c></row>',
			}),
		);
		writeSheet(entries, [["Widget", "2"]]);
		const xml = sheetXml(entries);

		expect(xml).toContain('<c r="A1" s="1" t="s"><v>0</v></c>');
		expect(xml).toContain("<f>1+1</f>");
	});

	it("drops a formula whose value the user overwrote", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1"><f>1+1</f><v>2</v></c></row>' }),
		);
		writeSheet(entries, [["7"]]);
		const xml = sheetXml(entries);

		expect(xml).not.toContain("<f>");
		expect(xml).toContain("<v>7</v>");
	});

	it("writes a number as a number and text as an inline string", () => {
		const entries = readZip(workbook({ rows: "" }));
		writeSheet(entries, [["12.5", "hello", "-3e4"]]);
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
		writeSheet(entries, [[""]]);
		expect(sheetXml(entries)).toContain('<c r="A1" s="1"/>');
	});

	it("writes a date back as a serial, not as text", () => {
		const entries = readZip(
			workbook({ rows: '<row r="1"><c r="A1" s="1"><v>46095</v></c></row>' }),
		);
		writeSheet(entries, [["2026-12-25"]]);
		const xml = sheetXml(entries);

		expect(xml).toContain("<v>46381</v>");
		expect(xml).not.toContain("inlineStr");
	});

	it("updates the sheet's declared dimension", () => {
		const entries = readZip(workbook({ rows: "" }));
		writeSheet(entries, [
			["a", "b", "c"],
			["d", "e", "f"],
		]);
		expect(sheetXml(entries)).toContain('<dimension ref="A1:C2"/>');
	});

	it("never touches another sheet", () => {
		const entries = readZip(workbook({ rows: "" }));
		const before = partText(entries, "xl/worksheets/sheet2.xml");
		writeSheet(entries, [["changed"]]);
		expect(partText(entries, "xl/worksheets/sheet2.xml")).toBe(before);
	});

	it("never rewrites the shared strings, so their counts stay honest", () => {
		const entries = readZip(workbook({ sharedStrings: ["Widget"], rows: "" }));
		const before = partText(entries, "xl/sharedStrings.xml");
		writeSheet(entries, [["a brand new string"]]);
		expect(partText(entries, "xl/sharedStrings.xml")).toBe(before);
	});

	it("round-trips a grid through a write and a read", () => {
		const grid = [
			["Item", "Qty"],
			["Doe, Jane", "1"],
			["", "42"],
		];
		const entries = readZip(workbook({ rows: "" }));
		writeSheet(entries, grid);
		expect(readSheet(entries).rows).toEqual(grid);
	});

	it("drops rows the user deleted", () => {
		const entries = readZip(
			workbook({
				rows: '<row r="1"><c r="A1"><v>1</v></c></row><row r="2"><c r="A2"><v>2</v></c></row>',
			}),
		);
		writeSheet(entries, [["1"]]);
		expect(readSheet(entries).rows).toEqual([["1"]]);
	});
});
