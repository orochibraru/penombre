import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { formatted } from "#lib/sheet/number-formats.js";
import type { CellStyle } from "#lib/sheet/styles.js";

import { blankWorkbook } from "./blank";
import { pack } from "./test-utils";
import { workbookFromText, workbookToText } from "./xlsx";
import { partText, readZip, type ZipEntry } from "./zip";

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOC =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const SHEET = "application/vnd.openxmlformats-officedocument.spreadsheetml";

/** Excel's shapes: theme colours with a tint, indexed ones, a custom format. */
const STYLES = `${PROLOG}<styleSheet xmlns="${MAIN}"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00\\ [$€-40C]"/></numFmts><fonts count="3"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><sz val="11"/><color rgb="FFFF0000"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><i/><sz val="14"/><color theme="4" tint="-0.249977111117893"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor theme="5" tint="0.79998168889431442"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="medium"><color rgb="FF0000FF"/></top><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyFill="1" applyBorder="1"><protection locked="0"/></xf><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/></styleSheet>`;

const THEME = `${PROLOG}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme></a:themeElements></a:theme>`;

const SHEET1 = `${PROLOG}<worksheet xmlns="${MAIN}" xmlns:r="${DOC}"><dimension ref="A1:D3"/><sheetData><row r="1"><c r="A1" s="1" t="inlineStr"><is><t>Title</t></is></c><c r="B1" s="1"/><c r="C1" s="2"/></row><row r="2"><c r="A2" s="3"><v>1234.5</v></c><c r="B2" s="4"><v>0.25</v></c><c r="C2" s="5"><v>46096</v></c><c r="D2" s="6"><v>99.5</v></c></row><row r="3"><c r="A3" s="7" t="inlineStr"><is><t>wrapped</t></is></c></row></sheetData><mergeCells count="1"><mergeCell ref="A1:B1"/></mergeCells><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;

function excelBook(): ZipEntry[] {
	return readZip(
		pack({
			"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${SHEET}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${SHEET}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${SHEET}.styles+xml"/><Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>`,
			"_rels/.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${DOC}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
			"xl/workbook.xml": `${PROLOG}<workbook xmlns="${MAIN}" xmlns:r="${DOC}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
			"xl/_rels/workbook.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${DOC}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${DOC}/styles" Target="styles.xml"/><Relationship Id="rId3" Type="${DOC}/theme" Target="theme/theme1.xml"/></Relationships>`,
			"xl/worksheets/sheet1.xml": SHEET1,
			"xl/styles.xml": STYLES,
			"xl/theme/theme1.xml": THEME,
		}),
	);
}

interface Book {
	nextId: number;
	styles: CellStyle[];
	sheets: {
		id: number;
		name: string;
		rows: string[][];
		styleIds?: number[][];
		merges?: string[];
	}[];
}

const open = (entries: ZipEntry[]): Book => JSON.parse(workbookToText(entries));

const save = (entries: ZipEntry[], book: Book) =>
	workbookFromText(entries, JSON.stringify(book));

const stylesXml = (entries: ZipEntry[]) =>
	partText(entries, "xl/styles.xml") ?? "";
const sheetXml = (entries: ZipEntry[]) =>
	partText(entries, "xl/worksheets/sheet1.xml") ?? "";

/** What a cell shows: its value through its style's number format. */
function shown(book: Book, row: number, col: number): string {
	const sheet = book.sheets[0];
	const raw = sheet?.rows[row]?.[col] ?? "";
	const format = book.styles[sheet?.styleIds?.[row]?.[col] ?? 0]?.format;
	return formatted(Number(raw), format) ?? raw;
}

describe("reading styles", () => {
	it("resolves fonts, fills, borders, alignment and number formats", () => {
		const { styles } = open(excelBook());
		expect(styles).toHaveLength(8);
		expect(styles[0]).toEqual({});
		expect(styles[1]).toEqual({ bold: true, color: "#FF0000" });
		expect(styles[2]).toEqual({
			fill: "#FBE5D6",
			borders: {
				top: { style: "medium", color: "#0000FF" },
				right: { style: "thin" },
				bottom: { style: "thin" },
				left: { style: "thin" },
			},
		});
		expect(styles[3]).toEqual({ format: "#,##0.00" });
		expect(styles[4]).toEqual({ format: "0%" });
		expect(styles[6]).toEqual({
			italic: true,
			size: 14,
			font: "Arial",
			color: "#2F5597",
			format: "#,##0.00\\ [$€-40C]",
		});
		expect(styles[7]).toEqual({ align: "center", valign: "top", wrap: true });
	});

	it("gives each cell its style index, and reads the merges", () => {
		const sheet = open(excelBook()).sheets[0];
		expect(sheet?.styleIds).toEqual([[1, 1, 2], [3, 4, 5, 6], [7]]);
		expect(sheet?.merges).toEqual(["A1:B1"]);
	});

	it("shows numbers through their formats", () => {
		const book = open(excelBook());
		expect(shown(book, 1, 0)).toBe("1,234.50");
		expect(shown(book, 1, 1)).toBe("25%");
		expect(shown(book, 1, 3)).toBe("99.50 €");
		expect(formatted(1234.5, '"$"#,##0.00')).toBe("$1,234.50");
		expect(book.sheets[0]?.rows[1]?.[2]).toBe("2026-03-15");
	});
});

describe("writing styles", () => {
	it("leaves an unchanged workbook byte for byte", () => {
		const entries = excelBook();
		save(entries, open(entries));
		expect(stylesXml(entries)).toBe(STYLES);
		expect(sheetXml(entries)).toBe(SHEET1);
	});

	it("appends a new combination and never renumbers the old ones", () => {
		const entries = excelBook();
		const book = open(entries);
		book.styles.push({
			bold: true,
			color: "#FF0000",
			fill: "#FFFF00",
			base: 1,
		});
		book.sheets[0]?.styleIds?.[0]?.splice(0, 1, 8);
		save(entries, book);

		const xml = stylesXml(entries);
		const before = STYLES.slice(
			STYLES.indexOf("<cellXfs"),
			STYLES.indexOf("</cellXfs>"),
		);
		expect(xml).toContain(before.replace('count="8"', 'count="9"'));
		expect(xml).toContain(
			'<fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills>',
		);
		expect(sheetXml(entries)).toContain('<c r="A1" s="8" t="inlineStr">');

		const reopened = open(entries);
		expect(reopened.styles[8]).toEqual({
			bold: true,
			color: "#FF0000",
			fill: "#FFFF00",
		});
		expect(reopened.styles.slice(0, 8)).toEqual(open(excelBook()).styles);

		// The next autosave finds it rather than adding it again.
		const again = {
			...reopened,
			styles: [...reopened.styles, { ...book.styles[8] } as CellStyle],
		};
		again.sheets[0]?.styleIds?.[0]?.splice(1, 1, 9);
		save(entries, again);
		expect(stylesXml(entries).match(/<xf /g)).toHaveLength(9 + 1);
		expect(sheetXml(entries)).toContain('<c r="B1" s="8"/>');
	});

	it("keeps what it does not model from the style it started from", () => {
		const entries = excelBook();
		const book = open(entries);
		book.styles.push({ ...book.styles[2], italic: true, base: 2 } as CellStyle);
		book.sheets[0]?.styleIds?.[0]?.splice(2, 1, 8);
		save(entries, book);
		const xml = stylesXml(entries);
		// Same fill and border ids, the protection kept, a font with the theme colour.
		expect(xml).toContain(
			'<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyFont="1"><protection locked="0"/></xf></cellXfs>',
		);
		expect(xml).toContain(
			'<font><i/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font></fonts>',
		);
	});

	it("writes number formats, reusing built-in ids and adding custom ones", () => {
		const entries = excelBook();
		const book = open(entries);
		book.styles.push(
			{ format: "0.00%", base: 0 },
			{ format: '"$"#,##0.00', base: 0 },
		);
		book.sheets[0]?.styleIds?.[1]?.splice(0, 2, 9, 8);
		save(entries, book);
		const xml = stylesXml(entries);
		expect(xml).toContain(
			'<numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0.00"/>',
		);
		expect(xml).toContain('<xf numFmtId="10" fontId="0"');
		const reopened = open(entries);
		expect(shown(reopened, 1, 0)).toBe("$1,234.50");
		expect(shown(reopened, 1, 1)).toBe("25.00%");
	});

	it("writes a formatted empty cell, and a date typed into a date cell as a serial", () => {
		const entries = excelBook();
		const book = open(entries);
		const sheet = book.sheets[0];
		sheet?.rows.push(["", "", "2026-01-31"]);
		sheet?.styleIds?.push([0, 1, 5]);
		save(entries, book);
		expect(sheetXml(entries)).toContain(
			'<row r="4" spans="1:4"><c r="B4" s="1"/><c r="C4" s="5"><v>46053</v></c></row>',
		);
	});

	it("round-trips merges, in the place the schema wants them", () => {
		const entries = excelBook();
		const book = open(entries);
		if (book.sheets[0]) {
			book.sheets[0].merges = ["A1:B1", "A3:C4"];
		}
		save(entries, book);
		expect(sheetXml(entries)).toContain(
			'</sheetData><mergeCells count="2"><mergeCell ref="A1:B1"/><mergeCell ref="A3:C4"/></mergeCells><pageMargins',
		);
		expect(open(entries).sheets[0]?.merges).toEqual(["A1:B1", "A3:C4"]);
		const unmerged = open(entries);
		if (unmerged.sheets[0]) {
			unmerged.sheets[0].merges = [];
		}
		save(entries, unmerged);
		expect(sheetXml(entries)).not.toContain("mergeCells");
	});

	it("leaves the file's formatting alone when the editor sent none", () => {
		const entries = excelBook();
		const book = open(entries);
		const sheet = book.sheets[0];
		if (sheet) {
			sheet.rows[0] = ["Renamed"];
			sheet.styleIds = undefined;
			sheet.merges = undefined;
		}
		save(entries, { ...book, styles: [] });
		expect(sheetXml(entries)).toContain(
			'<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Renamed</t>',
		);
		expect(sheetXml(entries)).toContain('<mergeCell ref="A1:B1"/>');
	});

	it("refuses style indices that are not indices", () => {
		const entries = excelBook();
		const book = open(entries);
		const bad = JSON.parse(JSON.stringify(book));
		bad.sheets[0].styleIds = [[-1]];
		expect(() => save(entries, bad)).toThrow();
		bad.sheets[0].styleIds = [[0]];
		bad.sheets[0].merges = ["A1:B1;x"];
		expect(() => save(entries, bad)).toThrow();
	});

	it("gives a package with no styles part one when a cell needs a style", () => {
		const entries = blankWorkbook().filter(
			(entry) => entry.name !== "xl/styles.xml",
		);
		const rels = partText(entries, "xl/_rels/workbook.xml.rels") ?? "";
		entries.splice(
			entries.findIndex((entry) => entry.name === "xl/_rels/workbook.xml.rels"),
			1,
			{
				name: "xl/_rels/workbook.xml.rels",
				data: new TextEncoder().encode(
					rels.replace(/<Relationship Id="rId2"[^>]*\/>/, ""),
				),
				stored: false,
			},
		);
		const book = open(entries);
		expect(book.styles).toEqual([{}]);
		book.styles.push({ bold: true, base: 0 });
		const sheet = book.sheets[0];
		if (sheet) {
			sheet.rows = [["bold"]];
			sheet.styleIds = [[1]];
		}
		save(entries, book);
		expect(stylesXml(entries)).toContain("<cellXfs");
		expect(partText(entries, "xl/_rels/workbook.xml.rels")).toContain(
			'Target="styles.xml"',
		);
		expect(partText(entries, "[Content_Types].xml")).toContain(
			'PartName="/xl/styles.xml"',
		);
		expect(open(entries).styles[1]).toEqual({ bold: true });
	});

	it("keeps an openpyxl file's styles through an edit", () => {
		const entries = readZip(
			readFileSync(path.resolve("tests/e2e/fixtures/office-report.xlsx")),
		);
		const book = open(entries);
		expect(book.styles[1]).toEqual({ bold: true });
		expect(book.sheets[0]?.styleIds?.[0]).toEqual([1, 1, 1, 1]);
		book.styles.push({ fill: "#FEF08A", base: 0 });
		book.sheets[0]?.styleIds?.push([], [], [2]);
		book.sheets[0]?.rows.push([""], ["total"]);
		save(entries, book);
		const reopened = open(entries);
		expect(reopened.styles[1]).toEqual({ bold: true });
		expect(reopened.sheets[0]?.styleIds?.[0]).toEqual([1, 1, 1, 1]);
		expect(
			reopened.styles[reopened.sheets[0]?.styleIds?.[3]?.[0] ?? 0],
		).toEqual({
			fill: "#FEF08A",
		});
	});
});
