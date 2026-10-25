import { describe, expect, it } from "bun:test";

import type { Chart } from "#lib/chart/model.js";
import { restructure, type SheetData } from "#lib/sheet/book.js";
import { CellLooks } from "#lib/sheet/layers.js";
import { lookOf, normalizeStyle } from "#lib/sheet/styles.js";

import { pack, PIXEL_PNG } from "./test-utils";
import { workbookFromText, workbookToText } from "./xlsx";
import { pxToWidth, widthToPx } from "./xlsx-view";
import { partText, readZip, writeZip, type ZipEntry } from "./zip";

/**
 * Column widths, frozen panes, tables and pictures, on a package shaped like
 * Google Sheets' "Download → Microsoft Excel" of a table with two charts:
 * charts as PNG pictures in one-cell anchors, a custom table style through
 * `dxfs`, a frozen header row, widths on every column.
 */

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const XDR =
	"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
const CT = "application/vnd.openxmlformats-officedocument";

const str = (ref: string, text: string, s = 0) =>
	`<c r="${ref}" s="${s}" t="inlineStr"><is><t>${text}</t></is></c>`;
const num = (ref: string, value: number, s = 0) =>
	`<c r="${ref}" s="${s}"><v>${value}</v></c>`;

const ROWS = [
	`<row r="1" ht="22.5" customHeight="1">${str("A1", "Item", 1)}${str("B1", "Price", 1)}${str("C1", "Link", 1)}</row>`,
	`<row r="2">${str("A2", "Pump")}${num("B2", 30)}${str("C2", "https://example.com/a", 2)}</row>`,
	`<row r="3">${str("A3", "Hose")}${num("B3", 12)}${str("C3", "plain", 0)}</row>`,
	`<row r="4">${str("A4", "Valve")}${num("B4", 8)}${str("C4", "https://example.com/c", 0)}</row>`,
].join("");

const GOOGLE_SHEET = `${PROLOG}<worksheet xmlns="${MAIN}" xmlns:r="${R}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1.0" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection activeCell="B3" sqref="B3" pane="bottomLeft"/></sheetView></sheetViews><sheetFormatPr customHeight="1" defaultColWidth="12.63" defaultRowHeight="15.75"/><cols><col customWidth="1" min="1" max="1" width="28.75"/><col customWidth="1" min="2" max="4" width="14.88"/></cols><sheetData>${ROWS}</sheetData><hyperlinks><hyperlink r:id="rId1" ref="C2"/><hyperlink r:id="rId2" ref="C4"/></hyperlinks><drawing r:id="rId3"/><tableParts count="1"><tablePart r:id="rId4"/></tableParts></worksheet>`;

const pic = (id: number, rel: string, anchor: string) =>
	`${anchor}<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="Chart${id}" title="Chart"><a:extLst><a:ext uri="GoogleSheetsCustomDataVersion1"><go:sheetsCustomData xmlns:go="http://customooxmlschemas.google.com/" pictureOfChart="1"/></a:ext></a:extLst></xdr:cNvPr><xdr:cNvPicPr preferRelativeResize="0"/></xdr:nvPicPr><xdr:blipFill><a:blip cstate="print" r:embed="${rel}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></xdr:spPr></xdr:pic><xdr:clientData fLocksWithSheet="0"/>`;

const DRAWING = `${PROLOG}<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:r="${R}"><xdr:oneCellAnchor>${pic(11, "rId1", `<xdr:from><xdr:col>4</xdr:col><xdr:colOff>95250</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="4762500" cy="2857500"/>`)}</xdr:oneCellAnchor><xdr:twoCellAnchor>${pic(12, "rId2", `<xdr:from><xdr:col>1</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>5</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>2</xdr:col><xdr:colOff>9525</xdr:colOff><xdr:row>6</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>`)}</xdr:twoCellAnchor><xdr:absoluteAnchor>${pic(13, "rId3", `<xdr:pos x="952500" y="476250"/><xdr:ext cx="952500" cy="952500"/>`)}</xdr:absoluteAnchor></xdr:wsDr>`;

const TABLE = `${PROLOG}<table xmlns="${MAIN}" ref="A1:C4" displayName="Parts" name="Parts" id="1"><tableColumns count="3"><tableColumn name="Item" id="1"/><tableColumn name="Price" id="2"/><tableColumn name="Link" id="3"/></tableColumns><tableStyleInfo name="Parts-style" showColumnStripes="0" showFirstColumn="1" showLastColumn="1" showRowStripes="1"/></table>`;

const STYLES = `${PROLOG}<styleSheet xmlns="${MAIN}"><fonts count="3"><font><sz val="10.0"/><color rgb="FF000000"/><name val="Arial"/></font><font><color theme="1"/><name val="Arial"/></font><font><u/><color rgb="FF0000FF"/><name val="Roboto"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="lightGray"/></fill></fills><borders count="1"><border/></borders><cellXfs count="3"><xf fontId="0"/><xf fontId="1" applyFont="1"><alignment horizontal="left" vertical="center"/></xf><xf fontId="2" applyFont="1"/></cellXfs><dxfs count="4"><dxf><font/><fill><patternFill patternType="solid"><fgColor rgb="FF356854"/><bgColor rgb="FF356854"/></patternFill></fill><border/></dxf><dxf><font/><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor rgb="FFFFFFFF"/></patternFill></fill><border/></dxf><dxf><font/><fill><patternFill patternType="solid"><fgColor rgb="FFF6F8F9"/><bgColor rgb="FFF6F8F9"/></patternFill></fill><border/></dxf><dxf><border><left style="thin"><color rgb="FF356854"/></left><right style="thin"><color rgb="FF356854"/></right><top style="thin"><color rgb="FF356854"/></top><bottom style="thin"><color rgb="FF356854"/></bottom></border></dxf></dxfs><tableStyles count="1"><tableStyle count="4" pivot="0" name="Parts-style"><tableStyleElement dxfId="0" type="headerRow"/><tableStyleElement dxfId="1" type="firstRowStripe"/><tableStyleElement dxfId="2" type="secondRowStripe"/><tableStyleElement dxfId="3" size="0" type="wholeTable"/></tableStyle></tableStyles></styleSheet>`;

const THEME = `${PROLOG}<a:theme xmlns:a="${A}" name="Sheets"><a:themeElements><a:clrScheme name="Sheets"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="000000"/></a:dk2><a:lt2><a:srgbClr val="FFFFFF"/></a:lt2><a:accent1><a:srgbClr val="4285F4"/></a:accent1><a:accent2><a:srgbClr val="EA4335"/></a:accent2><a:accent3><a:srgbClr val="FBBC04"/></a:accent3><a:accent4><a:srgbClr val="34A853"/></a:accent4><a:accent5><a:srgbClr val="FF6D01"/></a:accent5><a:accent6><a:srgbClr val="46BDC6"/></a:accent6><a:hlink><a:srgbClr val="1155CC"/></a:hlink><a:folHlink><a:srgbClr val="1155CC"/></a:folHlink></a:clrScheme></a:themeElements></a:theme>`;

/** A plain sheet whose table uses Excel's default style. */
const EXCEL_SHEET = `${PROLOG}<worksheet xmlns="${MAIN}" xmlns:r="${R}"><sheetData><row r="1">${str("A1", "Q")}${str("B1", "Sales")}</row><row r="2">${str("A2", "Q1")}${num("B2", 4)}</row><row r="3">${str("A3", "Q2")}${num("B3", 5)}</row></sheetData><tableParts count="1"><tablePart r:id="rId1"/></tableParts></worksheet>`;
const EXCEL_TABLE = `${PROLOG}<table xmlns="${MAIN}" id="2" name="Sales" displayName="Sales" ref="A1:B3" totalsRowShown="0"><autoFilter ref="A1:B3"/><tableColumns count="2"><tableColumn id="1" name="Q"/><tableColumn id="2" name="Sales"/></tableColumns><tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`;

function book(): ZipEntry[] {
	const entries = readZip(
		pack({
			"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="${CT}.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${CT}.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="${CT}.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="${CT}.drawing+xml"/><Override PartName="/xl/tables/table1.xml" ContentType="${CT}.spreadsheetml.table+xml"/><Override PartName="/xl/tables/table2.xml" ContentType="${CT}.spreadsheetml.table+xml"/><Override PartName="/xl/styles.xml" ContentType="${CT}.spreadsheetml.styles+xml"/><Override PartName="/xl/theme/theme1.xml" ContentType="${CT}.theme+xml"/></Types>`,
			"_rels/.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
			"xl/workbook.xml": `${PROLOG}<workbook xmlns="${MAIN}" xmlns:r="${R}"><sheets><sheet state="visible" name="Parts" sheetId="1" r:id="rId5"/><sheet name="Sales" sheetId="2" r:id="rId6"/></sheets><definedNames/><calcPr/></workbook>`,
			"xl/_rels/workbook.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/theme" Target="theme/theme1.xml"/><Relationship Id="rId2" Type="${R}/styles" Target="styles.xml"/><Relationship Id="rId5" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId6" Type="${R}/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`,
			"xl/theme/theme1.xml": THEME,
			"xl/styles.xml": STYLES,
			"xl/worksheets/sheet1.xml": GOOGLE_SHEET,
			"xl/worksheets/_rels/sheet1.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/hyperlink" Target="https://example.com/a" TargetMode="External"/><Relationship Id="rId2" Type="${R}/hyperlink" Target="https://example.com/c" TargetMode="External"/><Relationship Id="rId3" Type="${R}/drawing" Target="../drawings/drawing1.xml"/><Relationship Id="rId4" Type="${R}/table" Target="../tables/table1.xml"/></Relationships>`,
			"xl/drawings/drawing1.xml": DRAWING,
			"xl/drawings/_rels/drawing1.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/image" Target="../media/Chart1.png"/><Relationship Id="rId2" Type="${R}/image" Target="../media/Chart2.png"/><Relationship Id="rId3" Type="${R}/image" Target="../media/Chart1.png"/></Relationships>`,
			"xl/tables/table1.xml": TABLE,
			"xl/worksheets/sheet2.xml": EXCEL_SHEET,
			"xl/worksheets/_rels/sheet2.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/table" Target="../tables/table2.xml"/></Relationships>`,
			"xl/tables/table2.xml": EXCEL_TABLE,
		}),
	);
	for (const name of ["xl/media/Chart1.png", "xl/media/Chart2.png"]) {
		entries.push({ name, data: new Uint8Array(PIXEL_PNG), stored: false });
	}
	return entries;
}

interface Json {
	nextId: number;
	styles: unknown[];
	sheets: SheetData[];
}

const open = (entries: ZipEntry[]): Json =>
	JSON.parse(workbookToText(entries)) as Json;

/** A save through the editor's own JSON, as `serializeBook` sends it. */
function save(entries: ZipEntry[], json: Json): ZipEntry[] {
	const copy = readZip(writeZip(entries));
	const sheets = json.sheets.map(
		({ pictures: _p, links: _l, defaultWidth: _d, tables, ...sheet }) => ({
			...sheet,
			...(tables
				? { tables: tables.map(({ part, ref }) => ({ part, ref })) }
				: {}),
		}),
	);
	workbookFromText(copy, JSON.stringify({ ...json, sheets }));
	return readZip(writeZip(copy));
}

const bytes = (entries: ZipEntry[], name: string) =>
	entries.find((entry) => entry.name === name)?.data;

const sheetXml = (entries: ZipEntry[]) =>
	partText(entries, "xl/worksheets/sheet1.xml") ?? "";

function looksOf(json: Json, index = 0) {
	const styles = json.styles.map((style) => normalizeStyle(style));
	const looks = new CellLooks(styles, styles.map(lookOf), json.sheets[index]);
	const sheet = json.sheets[index];
	return (row: number, col: number) =>
		looks.look(sheet?.styleIds?.[row]?.[col] ?? 0, row, col).cell;
}

describe("pictures", () => {
	it("reads every picture with its anchor and size", () => {
		const pictures = open(book()).sheets[0]?.pictures ?? [];
		expect(pictures.map(({ src: _src, ...rest }) => rest)).toEqual([
			{
				id: "xl/drawings/drawing1.xml#11",
				name: "Chart",
				anchor: { col: 4, row: 2, x: 10, y: 0, width: 500, height: 300 },
			},
			{
				id: "xl/drawings/drawing1.xml#12",
				name: "Chart",
				// One column (B, 14.88 characters) plus one pixel, one 21px row.
				anchor: { col: 1, row: 5, x: 0, y: 0, width: 105, height: 21 },
			},
			{
				id: "xl/drawings/drawing1.xml#13",
				name: "Chart",
				anchor: { col: 0, row: 0, x: 100, y: 50, width: 100, height: 100 },
			},
		]);
		expect(pictures[0]?.src).toBe(
			`data:image/png;base64,${PIXEL_PNG.toString("base64")}`,
		);
	});

	it("keeps pictures byte for byte when the sheet's charts change", () => {
		const entries = book();
		const json = open(entries);
		const sheet = json.sheets[0] as SheetData;
		const chart: Chart = {
			id: "new-1",
			anchor: { row: 8, col: 0, x: 0, y: 0, width: 480, height: 300 },
			type: "column",
			legend: "r",
			x: {},
			y: {},
			series: [{ values: "Parts!$B$2:$B$4" }],
		};
		sheet.charts = [chart];
		const saved = save(entries, json);
		const drawing = partText(saved, "xl/drawings/drawing1.xml") ?? "";
		expect(drawing.match(/<xdr:pic>/g)).toHaveLength(3);
		expect(drawing).toContain("<xdr:graphicFrame");
		expect(drawing).toContain('pictureOfChart="1"');
		expect(bytes(saved, "xl/media/Chart1.png")).toEqual(
			bytes(entries, "xl/media/Chart1.png"),
		);
		expect(partText(saved, "xl/drawings/_rels/drawing1.xml.rels")).toContain(
			"../media/Chart2.png",
		);
		// The editor never sends pictures, and they never come back changed.
		expect(open(saved).sheets[0]?.pictures).toEqual(sheet.pictures);
	});
});

describe("column widths", () => {
	it("reads widths in pixels by Excel's formula", () => {
		const sheet = open(book()).sheets[0];
		expect(sheet?.widths).toEqual([201, 104, 104, 104]);
		expect(sheet?.defaultWidth).toBe(88);
		expect(open(book()).sheets[1]?.defaultWidth).toBeUndefined();
		for (const px of [1, 7, 64, 88, 201, 488]) {
			expect(widthToPx(pxToWidth(px))).toBe(px);
		}
	});

	it("writes back only the column the editor resized", () => {
		const entries = book();
		const untouched = save(entries, open(entries));
		expect(sheetXml(untouched)).toBe(sheetXml(entries));

		const json = open(entries);
		const sheet = json.sheets[0] as SheetData;
		sheet.widths = [201, 104, 150, 104, 0, 0, 90];
		const xml = sheetXml(save(entries, json));
		expect(xml).toContain(
			'<cols><col customWidth="1" min="1" max="1" width="28.75"/><col customWidth="1" min="2" max="2" width="14.88"/><col customWidth="1" min="3" max="3" width="21.42578125"/><col customWidth="1" min="4" max="4" width="14.88"/><col min="7" max="7" width="12.85546875" customWidth="1"/></cols>',
		);
		const reopened = open(save(entries, json)).sheets[0];
		expect(reopened?.widths).toEqual([201, 104, 150, 104, 0, 0, 90]);
	});
});

describe("frozen panes", () => {
	it("reads the frozen header row, and writes a toggle back", () => {
		const entries = book();
		const json = open(entries);
		expect(json.sheets[0]?.freeze).toEqual({ rows: 1, cols: 0 });
		expect(json.sheets[1]?.freeze).toBeUndefined();

		(json.sheets[0] as SheetData).freeze = { rows: 1, cols: 1 };
		(json.sheets[1] as SheetData).freeze = { rows: 1, cols: 0 };
		const saved = save(entries, json);
		expect(sheetXml(saved)).toContain(
			'<sheetView workbookViewId="0"><pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/><selection activeCell="B3" sqref="B3" pane="bottomRight"/></sheetView>',
		);
		expect(partText(saved, "xl/worksheets/sheet2.xml")).toContain(
			'<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>',
		);

		const back = open(saved);
		(back.sheets[0] as SheetData).freeze = { rows: 0, cols: 0 };
		expect(sheetXml(save(saved, back))).toContain(
			'<sheetView workbookViewId="0"><selection activeCell="B3" sqref="B3"/></sheetView>',
		);
	});
});

describe("tables", () => {
	it("resolves a custom table style under the cells' own styles", () => {
		const json = open(book());
		expect(json.sheets[0]?.tables?.[0]).toMatchObject({
			part: "xl/tables/table1.xml",
			ref: "A1:C4",
			headerRows: 1,
			rowStripes: true,
			firstColumn: true,
		});
		const look = looksOf(json);
		// The header: the style's green, automatic text turned white on it.
		expect(look(0, 0)).toContain("background-color: #356854; color: #FFFFFF");
		expect(look(0, 0)).toContain("box-shadow: 0 -1px 0 0 #356854");
		// Stripes alternate, and the outline closes on the last column.
		expect(look(1, 1)).toContain("background-color: #FFFFFF");
		expect(look(2, 1)).toContain("background-color: #F6F8F9");
		expect(look(2, 2)).toContain("border-right: 1px solid #356854");
		expect(look(3, 0)).toContain("border-bottom: 1px solid #356854");
		// A styled hyperlink keeps its own font and colour, underlined.
		expect(look(1, 2)).toContain(
			"color: #0000FF; text-decoration-line: underline",
		);
		expect(look(1, 2)).toContain('font-family: "Roboto", var(--app-font');
		expect(look(1, 2)).not.toContain("font-weight");
		// An unstyled one is underlined in the cell's own colour on a fill.
		expect(look(3, 2)).toContain("text-decoration-line: underline");
		// Outside the table nothing changes.
		expect(look(6, 6)).toBe("");
	});

	it("approximates Excel's default style from the theme", () => {
		const json = open(book());
		const style = json.sheets[1]?.tables?.[0]?.style;
		expect(style?.headerRow).toEqual({
			bold: true,
			fill: "#4285F4",
			color: "#FFFFFF",
		});
		expect(style?.firstRowStripe?.fill).toMatch(/^#[0-9A-F]{6}$/);
		const look = looksOf(json, 1);
		expect(look(0, 0)).toContain(
			"background-color: #4285F4; color: #FFFFFF; font-weight: 700",
		);
		expect(look(1, 0)).toContain(
			`background-color: ${style?.firstRowStripe?.fill}`,
		);
		expect(look(2, 0)).not.toContain("background-color");
	});

	it("keeps the table's range right when rows are inserted and deleted", () => {
		const entries = book();
		const json = open(entries);
		const grown = restructure(json, 0, { axis: "row", at: 2, count: 2 });
		expect(grown.sheets[0]?.tables?.[0]?.ref).toBe("A1:C6");
		const saved = save(entries, { ...json, sheets: grown.sheets });
		expect(partText(saved, "xl/tables/table1.xml")).toContain('ref="A1:C6"');

		// Rows above move it; a renamed header renames its column.
		const back = open(saved);
		const moved = restructure(back, 0, { axis: "row", at: 0, count: 1 });
		const sheet = moved.sheets[0] as SheetData;
		sheet.rows[1] = ["Part", "Price", "Link"];
		const again = save(saved, { ...back, sheets: moved.sheets });
		const table = partText(again, "xl/tables/table1.xml") ?? "";
		expect(table).toContain('ref="A2:C7"');
		expect(table).toContain('<tableColumn name="Part" id="1"/>');

		// Excel's own tables carry an autoFilter over the same range.
		const excel = open(entries);
		const longer = restructure(excel, 1, { axis: "row", at: 1, count: 1 });
		const written = partText(
			save(entries, { ...excel, sheets: longer.sheets }),
			"xl/tables/table2.xml",
		);
		expect(written).toContain(
			'ref="A1:B4" totalsRowShown="0"><autoFilter ref="A1:B4"/>',
		);
	});

	it("drops a table whose rows were all deleted", () => {
		const entries = book();
		const json = open(entries);
		const gone = restructure(json, 1, { axis: "row", at: 0, count: -3 });
		expect(gone.sheets[1]?.tables).toEqual([]);
		const saved = save(entries, { ...json, sheets: gone.sheets });
		expect(saved.some((entry) => entry.name === "xl/tables/table2.xml")).toBe(
			false,
		);
		expect(partText(saved, "xl/worksheets/sheet2.xml")).not.toContain(
			"tableParts",
		);
		expect(partText(saved, "[Content_Types].xml")).not.toContain("table2.xml");
		expect(partText(saved, "xl/tables/table1.xml")).toBe(TABLE);
	});
});
