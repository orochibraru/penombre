import { describe, expect, it } from "bun:test";

import type { ConditionalFormat } from "#lib/sheet/conditional.js";
import type { Dropdown } from "#lib/sheet/dropdowns.js";

import { pack } from "./test-utils";
import { workbookFromText, workbookToText } from "./xlsx";
import { partText, readZip, type ZipEntry } from "./zip";

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOC =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const SHEET = "application/vnd.openxmlformats-officedocument.spreadsheetml";

const DXFS =
	'<dxfs count="2"><dxf><font><b/><color rgb="FFFF0000"/></font></dxf><dxf><fill><patternFill><bgColor rgb="FFBFE1F6"/></patternFill></fill></dxf></dxfs>';

const STYLES = `${PROLOG}<styleSheet xmlns="${MAIN}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>${DXFS}</styleSheet>`;

const VALIDATIONS =
	'<dataValidations count="4">' +
	'<dataValidation type="list" allowBlank="1" sqref="A2:A10"><formula1>&quot;Amazon,Driftshop,GL Racing&quot;</formula1></dataValidation>' +
	'<dataValidation type="list" allowBlank="1" showDropDown="1" showErrorMessage="1" sqref="B2:B10"><formula1>&quot;FALSE,TRUE&quot;</formula1></dataValidation>' +
	'<dataValidation type="custom" allowBlank="1" sqref="C2:C10"><formula1>AND(ISNUMBER(C2),C2&gt;0,LEFT(&quot;x&quot;)=&quot;x&quot;)</formula1></dataValidation>' +
	'<dataValidation type="list" sqref="D2:D10"><formula1>Lists!$A$1:$A$3</formula1></dataValidation>' +
	"</dataValidations>";

const CHIPS =
	'<conditionalFormatting sqref="A2:A10"><cfRule type="cellIs" dxfId="1" priority="1" operator="equal"><formula>&quot;Amazon&quot;</formula></cfRule></conditionalFormatting>';
const FOREIGN =
	'<conditionalFormatting sqref="C2:C10"><cfRule type="cellIs" dxfId="0" priority="2" operator="greaterThan"><formula>20</formula></cfRule><cfRule type="colorScale" priority="3"><colorScale><cfvo type="min"/><cfvo type="max"/><color rgb="FFFFFFFF"/><color rgb="FF63BE7B"/></colorScale></cfRule></conditionalFormatting>';
const X14 =
	'<extLst><ext uri="{CCE6A557-97BC-4b89-ADB6-D9C93CAAB3DF}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><x14:dataValidations count="1" xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"><x14:dataValidation type="list" allowBlank="1"><x14:formula1><xm:f>Lists!$A$1:$A$3</xm:f></x14:formula1><xm:sqref>E2:E5</xm:sqref></x14:dataValidation></x14:dataValidations></ext></extLst>';

const cell = (ref: string, value: string) =>
	`<c r="${ref}" t="inlineStr"><is><t>${value}</t></is></c>`;
const flag = (ref: string, on: boolean) =>
	`<c r="${ref}" t="b"><v>${on ? 1 : 0}</v></c>`;

const SHEET1 = `${PROLOG}<worksheet xmlns="${MAIN}" xmlns:r="${DOC}"><dimension ref="A1:C5"/><sheetData><row r="1">${cell("A1", "Shop")}${cell("B1", "Bought")}${cell("C1", "Amount")}</row><row r="2">${cell("A2", "Amazon")}${flag("B2", true)}<c r="C2"><v>10</v></c></row><row r="3">${cell("A3", "Driftshop")}${flag("B3", false)}<c r="C3"><v>40</v></c></row><row r="4">${cell("A4", "amazon")}${flag("B4", true)}<c r="C4"><v>5</v></c></row><row r="5">${cell("A5", "Other")}${flag("B5", false)}<c r="C5"><v>0</v></c></row></sheetData>${CHIPS}${FOREIGN}${VALIDATIONS}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>${X14}</worksheet>`;
const LISTS = `${PROLOG}<worksheet xmlns="${MAIN}"><sheetData><row r="1">${cell("A1", "Red")}</row><row r="2">${cell("A2", "Green")}</row><row r="3">${cell("A3", "Blue")}</row></sheetData></worksheet>`;

function book(sheet = SHEET1): ZipEntry[] {
	return readZip(
		pack({
			"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${SHEET}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${SHEET}.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="${SHEET}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${SHEET}.styles+xml"/></Types>`,
			"_rels/.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${DOC}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
			"xl/workbook.xml": `${PROLOG}<workbook xmlns="${MAIN}" xmlns:r="${DOC}"><sheets><sheet name="Mods" sheetId="1" r:id="rId1"/><sheet name="Lists" sheetId="2" r:id="rId2"/></sheets></workbook>`,
			"xl/_rels/workbook.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${DOC}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${DOC}/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="${DOC}/styles" Target="styles.xml"/></Relationships>`,
			"xl/worksheets/sheet1.xml": sheet,
			"xl/worksheets/sheet2.xml": LISTS,
			"xl/styles.xml": STYLES,
		}),
	);
}

interface Book {
	sheets: {
		id: number;
		name: string;
		rows: string[][];
		dropdowns?: Dropdown[];
		conditional?: ConditionalFormat[];
	}[];
}

const open = (entries: ZipEntry[]): Book => JSON.parse(workbookToText(entries));
const save = (entries: ZipEntry[], value: Book) =>
	workbookFromText(entries, JSON.stringify(value));
const sheetXml = (entries: ZipEntry[]) =>
	partText(entries, "xl/worksheets/sheet1.xml") ?? "";
const stylesXml = (entries: ZipEntry[]) =>
	partText(entries, "xl/styles.xml") ?? "";
const first = (value: Book) => value.sheets[0] as Book["sheets"][number];

describe("reading dropdowns", () => {
	it("reads inline and referenced lists, with chip colours from cellIs rules", () => {
		expect(first(open(book())).dropdowns).toEqual([
			{
				range: "A2:A10",
				values: ["Amazon", "Driftshop", "GL Racing"],
				colors: [{ value: "Amazon", fill: "#BFE1F6" }],
			},
			{
				range: "B2:B10",
				values: ["FALSE", "TRUE"],
				strict: true,
				hideArrow: true,
			},
			{ range: "D2:D10", source: "Lists!$A$1:$A$3" },
			{ range: "E2:E5", source: "Lists!$A$1:$A$3" },
		]);
	});

	it("hands the grid every other conditional format, the chips' left out", () => {
		expect(first(open(book())).conditional).toEqual([
			{
				range: "C2:C10",
				rules: [
					{
						type: "cellIs",
						operator: "greaterThan",
						formulas: ["20"],
						style: { bold: true, color: "#FF0000" },
						priority: 2,
					},
					{
						type: "colorScale",
						priority: 3,
						scale: {
							points: [{ type: "min" }, { type: "max" }],
							colors: ["#FFFFFF", "#63BE7B"],
						},
					},
				],
			},
		]);
	});

	it("keeps booleans as booleans", () => {
		expect(first(open(book())).rows[1]?.[1]).toBe("TRUE");
	});
});

describe("writing dropdowns", () => {
	it("leaves an untouched sheet byte for byte", () => {
		const entries = book();
		save(entries, open(entries));
		expect(sheetXml(entries)).toBe(SHEET1);
		expect(stylesXml(entries)).toBe(STYLES);
	});

	it("keeps every validation and format as written when only a cell changes", () => {
		const entries = book();
		const value = open(entries);
		const row = first(value).rows[4] as string[];
		row[0] = "Driftshop";
		save(entries, value);
		const xml = sheetXml(entries);
		expect(xml).toContain(VALIDATIONS);
		expect(xml).toContain(CHIPS + FOREIGN);
		expect(xml).toContain(
			'<c r="A5" t="inlineStr"><is><t xml:space="preserve">Driftshop</t></is></c>',
		);
	});

	it("writes a picked boolean as a boolean", () => {
		const entries = book();
		const value = open(entries);
		const row = first(value).rows[1] as string[];
		row[1] = "FALSE";
		save(entries, value);
		expect(sheetXml(entries)).toContain('<c r="B2" t="b"><v>0</v></c>');
		expect(first(open(entries)).rows[1]?.[1]).toBe("FALSE");
	});

	it("appends a new dropdown with its colour rules and formats, and reads it back", () => {
		const entries = book();
		const value = open(entries);
		const added: Dropdown = {
			range: "F2:F20",
			values: ["Performance", "Sound", 'Say "hi"'],
			colors: [
				{ value: "Performance", fill: "#D4EDBC", text: "#11734B" },
				{ value: 'Say "hi"', fill: "#FFCFC9" },
			],
			strict: true,
		};
		first(value).dropdowns?.push(added);
		save(entries, value);
		const xml = sheetXml(entries);
		expect(xml).toContain(
			'<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="F2:F20"><formula1>"Performance,Sound,Say ""hi"""</formula1></dataValidation></dataValidations>',
		);
		expect(xml).toContain('<dataValidations count="5">');
		expect(xml).toContain(
			'<conditionalFormatting sqref="F2:F20"><cfRule type="cellIs" dxfId="2" priority="4" operator="equal"><formula>"Performance"</formula></cfRule><cfRule type="cellIs" dxfId="3" priority="5" operator="equal"><formula>"Say ""hi"""</formula></cfRule><extLst>',
		);
		expect(stylesXml(entries)).toContain(
			`${DXFS.slice(0, -"</dxfs>".length).replace('count="2"', 'count="4"')}<dxf><font><color rgb="FF11734B"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFD4EDBC"/><bgColor rgb="FFD4EDBC"/></patternFill></fill></dxf>`,
		);
		expect(first(open(entries)).dropdowns?.[3]).toEqual(added);

		// The editor autosaves the same list again: nothing more is written.
		const sheet = sheetXml(entries);
		const styles = stylesXml(entries);
		save(entries, value);
		expect(sheetXml(entries)).toBe(sheet);
		expect(stylesXml(entries)).toBe(styles);

		const before = stylesXml(entries);
		save(entries, open(entries));
		expect(stylesXml(entries)).toBe(before);
	});

	it("rewrites a changed dropdown's colours, leaving the other formats", () => {
		const entries = book();
		const value = open(entries);
		const shops = first(value).dropdowns?.[0] as Dropdown;
		shops.colors = [
			{ value: "Amazon", fill: "#FFE5A0" },
			{ value: "Driftshop", fill: "#E6CFF2" },
		];
		save(entries, value);
		const xml = sheetXml(entries);
		expect(xml).not.toContain(CHIPS);
		expect(xml).toContain(FOREIGN);
		expect(xml).toContain(VALIDATIONS);
		expect(first(open(entries)).dropdowns?.[0]?.colors).toEqual(shops.colors);
	});

	it("removes a dropdown with its colours, and the holders it empties", () => {
		const entries = book();
		const value = open(entries);
		first(value).dropdowns = [];
		save(entries, value);
		const xml = sheetXml(entries);
		expect(xml).not.toContain("A2:A10");
		expect(xml).not.toContain("x14:dataValidations");
		expect(xml).not.toContain("<extLst>");
		expect(xml).toContain(
			'<dataValidations count="1"><dataValidation type="custom" allowBlank="1" sqref="C2:C10"><formula1>AND(ISNUMBER(C2),C2&gt;0,LEFT(&quot;x&quot;)=&quot;x&quot;)</formula1></dataValidation></dataValidations>',
		);
		expect(xml).toContain(FOREIGN);
	});

	it("moves an Excel 2010 validation in place", () => {
		const entries = book();
		const value = open(entries);
		const colours = first(value).dropdowns?.[3] as Dropdown;
		colours.range = "E3:E6";
		save(entries, value);
		expect(sheetXml(entries)).toContain(
			'<x14:dataValidation type="list" allowBlank="1"><x14:formula1><xm:f>Lists!$A$1:$A$3</xm:f></x14:formula1><xm:sqref>E3:E6</xm:sqref></x14:dataValidation>',
		);
	});

	it("refuses a malformed dropdown", () => {
		const entries = book();
		const value = open(entries);
		first(value).dropdowns = [{ range: "not a range", values: ["a"] }];
		expect(() => save(entries, value)).toThrow("Malformed formatting");
	});
});
