import { describe, expect, it } from "bun:test";
import { chartData, sourceOf } from "#lib/chart/data.js";
import type { Chart } from "#lib/chart/model.js";
import { createWorkbook } from "#lib/formula.js";
import { renderPdf } from "./export/pdf";
import { sheetsPdf } from "./export/sheet-pdf";
import { pack } from "./test-utils";
import { workbookFromText, workbookToText } from "./xlsx";
import { chartXml, readChartXml, workbookPalette } from "./xlsx-charts/index";
import { partText, readZip, setPartText, writeZip, type ZipEntry } from "./zip";

/**
 * Charts as Excel and Google Sheets write them, built by hand from the spec
 * and from what each producer is known to emit; see the comments on each.
 */

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const C = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const XDR =
	"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
const MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
const CT = "application/vnd.openxmlformats-officedocument";

const inline = (ref: string, text: string) =>
	`<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
const num = (ref: string, value: number) => `<c r="${ref}"><v>${value}</v></c>`;

const SHEET1 = `<row r="1">${inline("A1", "Region")}${inline("B1", "North")}${inline("C1", "South")}</row><row r="2">${inline("A2", "Q1")}${num("B2", 10)}${num("C2", 4)}</row><row r="3">${inline("A3", "Q2")}${num("B3", 20)}${num("C3", 8)}</row><row r="4">${inline("A4", "Q3")}${num("B4", 30)}${num("C4", 12)}</row>`;

const strCache = (values: string[]) =>
	`<c:strCache><c:ptCount val="${values.length}"/>${values.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join("")}</c:strCache>`;
const numCache = (values: number[]) =>
	`<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${values.length}"/>${values.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join("")}</c:numCache>`;

/**
 * Excel 2016+: a clustered column chart with theme colours, a `c14:style`
 * alternate, `c16` unique ids on each series, an embedded-workbook link,
 * axis ids from a random-looking range, gridlines, a bottom legend.
 */
const EXCEL_CHART = `${PROLOG}<c:chartSpace xmlns:c="${C}" xmlns:a="${A}" xmlns:r="${R}" xmlns:c16r2="http://schemas.microsoft.com/office/drawing/2015/06/chart"><c:date1904 val="0"/><c:lang val="en-US"/><c:roundedCorners val="0"/><mc:AlternateContent xmlns:mc="${MC}"><mc:Choice Requires="c14" xmlns:c14="http://schemas.microsoft.com/office/drawing/2007/8/2/chart"><c14:style val="102"/></mc:Choice><mc:Fallback><c:style val="2"/></mc:Fallback></mc:AlternateContent><c:chart><c:title><c:tx><c:rich><a:bodyPr rot="0" spcFirstLastPara="1" vertOverflow="ellipsis"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="0"/></a:pPr><a:r><a:rPr lang="en-US"/><a:t>Sales</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>Sheet1!$B$1</c:f>${strCache(["North"])}</c:strRef></c:tx><c:spPr><a:solidFill><a:schemeClr val="accent1"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr><c:invertIfNegative val="0"/><c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f>${strCache(["Q1", "Q2", "Q3"])}</c:strRef></c:cat><c:val><c:numRef><c:f>Sheet1!$B$2:$B$4</c:f>${numCache([10, 20, 30])}</c:numRef></c:val><c:extLst><c:ext uri="{C3380CC4-5D6E-409C-BE32-E72D297353CC}" xmlns:c16="http://schemas.microsoft.com/office/drawing/2014/chart"><c16:uniqueId val="{00000000-0001}"/></c:ext></c:extLst></c:ser><c:ser><c:idx val="1"/><c:order val="1"/><c:tx><c:strRef><c:f>Sheet1!$C$1</c:f>${strCache(["South"])}</c:strRef></c:tx><c:spPr><a:solidFill><a:schemeClr val="accent2"><a:lumMod val="75000"/></a:schemeClr></a:solidFill></c:spPr><c:invertIfNegative val="0"/><c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f>${strCache(["Q1", "Q2", "Q3"])}</c:strRef></c:cat><c:val><c:numRef><c:f>Sheet1!$C$2:$C$4</c:f>${numCache([4, 8, 12])}</c:numRef></c:val></c:ser><c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls><c:gapWidth val="219"/><c:overlap val="-27"/><c:axId val="1415152016"/><c:axId val="1415154512"/></c:barChart><c:catAx><c:axId val="1415152016"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="1415154512"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="1415154512"/><c:scaling><c:orientation val="minMax"/><c:max val="40"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Units</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="1415152016"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:externalData r:id="rId3"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`;

/**
 * Google Sheets' "Download → Microsoft Excel": explicit `srgbClr` colours,
 * a quoted sheet name in every reference, a literal-free line chart with
 * markers, a one-cell anchor, and absolute relationship targets (written by
 * some exports; resolving both forms is the point).
 */
const GOOGLE_CHART = `${PROLOG}<c:chartSpace xmlns:c="${C}" xmlns:a="${A}" xmlns:r="${R}"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:latin typeface="Roboto"/></a:defRPr></a:pPr><a:r><a:rPr b="0"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:latin typeface="Roboto"/></a:rPr><a:t>Trend</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:plotArea><c:layout/><c:lineChart><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>'Data Sheet'!B1</c:f></c:strRef></c:tx><c:spPr><a:ln cmpd="sng" w="28575"><a:solidFill><a:srgbClr val="4285F4"/></a:solidFill><a:prstDash val="solid"/></a:ln></c:spPr><c:marker><c:symbol val="circle"/><c:size val="7"/><c:spPr><a:solidFill><a:srgbClr val="4285F4"/></a:solidFill><a:ln cmpd="sng"><a:solidFill><a:srgbClr val="4285F4"/></a:solidFill></a:ln></c:spPr></c:marker><c:cat><c:strRef><c:f>'Data Sheet'!A2:A4</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>'Data Sheet'!B2:B4</c:f></c:numRef></c:val><c:smooth val="0"/></c:ser><c:axId val="1"/><c:axId val="2"/></c:lineChart><c:catAx><c:axId val="1"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0"/></a:pPr><a:r><a:t>Month</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr/><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0"/></a:pPr></a:p></c:txPr><c:crossAx val="2"/></c:catAx><c:valAx><c:axId val="2"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln><a:solidFill><a:srgbClr val="B7B7B7"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="1"/><c:crosses val="max"/></c:valAx></c:plotArea><c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;

const THEME = `${PROLOG}<a:theme xmlns:a="${A}" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme></a:themeElements></a:theme>`;

/** Excel: a two-cell anchor holding the chart, and a picture beside it. */
const EXCEL_DRAWING = `${PROLOG}<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>4</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>5</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>3</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="3" name="Picture 2"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="${R}" r:embed="rId2"/></xdr:blipFill><xdr:spPr/></xdr:pic><xdr:clientData/></xdr:twoCellAnchor><xdr:twoCellAnchor><xdr:from><xdr:col>4</xdr:col><xdr:colOff>95250</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>11</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>19</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Chart 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${C}"><c:chart xmlns:c="${C}" xmlns:r="${R}" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`;

const GOOGLE_DRAWING = `${PROLOG}<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:c="${C}"><xdr:oneCellAnchor><xdr:from><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="5715000" cy="3533775"/><xdr:graphicFrame><xdr:nvGraphicFramePr><xdr:cNvPr id="1" name="Chart 1" title="Chart"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${C}"><c:chart r:id="rId1" xmlns:r="${R}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData fLocksWithSheet="0"/></xdr:oneCellAnchor></xdr:wsDr>`;

function book(): ZipEntry[] {
	const entries = readZip(
		pack({
			"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="${CT}.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${CT}.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="${CT}.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="${CT}.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="${CT}.drawing+xml"/><Override PartName="/xl/drawings/drawing2.xml" ContentType="${CT}.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="${CT}.drawingml.chart+xml"/><Override PartName="/xl/charts/chart2.xml" ContentType="${CT}.drawingml.chart+xml"/><Override PartName="/xl/theme/theme1.xml" ContentType="${CT}.theme+xml"/></Types>`,
			"_rels/.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
			"xl/workbook.xml": `${PROLOG}<workbook xmlns="${MAIN}" xmlns:r="${R}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/><sheet name="Data Sheet" sheetId="2" r:id="rId2"/><sheet name="Empty" sheetId="3" r:id="rId3"/></sheets></workbook>`,
			"xl/_rels/workbook.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="${R}/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="${R}/theme" Target="theme/theme1.xml"/></Relationships>`,
			"xl/theme/theme1.xml": THEME,
			"xl/worksheets/sheet1.xml": `${PROLOG}<worksheet xmlns="${MAIN}" xmlns:r="${R}"><sheetFormatPr defaultRowHeight="15"/><sheetData>${SHEET1}</sheetData><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/><drawing r:id="rId1"/></worksheet>`,
			"xl/worksheets/_rels/sheet1.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`,
			"xl/drawings/drawing1.xml": EXCEL_DRAWING,
			"xl/drawings/_rels/drawing1.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/chart" Target="../charts/chart1.xml"/><Relationship Id="rId2" Type="${R}/image" Target="../media/image1.png"/></Relationships>`,
			"xl/charts/chart1.xml": EXCEL_CHART,
			"xl/charts/_rels/chart1.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId3" Type="${R}/package" Target="../embeddings/Microsoft_Excel_Worksheet.xlsx"/></Relationships>`,
			"xl/worksheets/sheet2.xml": `${PROLOG}<worksheet xmlns="${MAIN}" xmlns:r="${R}"><sheetData><row r="1">${inline("A1", "Month")}${inline("B1", "Visits")}</row><row r="2">${inline("A2", "Jan")}${num("B2", 5)}</row><row r="3">${inline("A3", "Feb")}${num("B3", 7)}</row><row r="4">${inline("A4", "Mar")}${num("B4", 6)}</row></sheetData><drawing r:id="rId1"/></worksheet>`,
			"xl/worksheets/_rels/sheet2.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/drawing" Target="/xl/drawings/drawing2.xml"/></Relationships>`,
			"xl/drawings/drawing2.xml": GOOGLE_DRAWING,
			"xl/drawings/_rels/drawing2.xml.rels": `${PROLOG}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${R}/chart" Target="/xl/charts/chart2.xml"/></Relationships>`,
			"xl/charts/chart2.xml": GOOGLE_CHART,
			"xl/worksheets/sheet3.xml": `${PROLOG}<worksheet xmlns="${MAIN}"><sheetData><row r="1">${num("A1", 1)}${num("B1", 2)}</row><row r="2">${num("A2", 3)}${num("B2", 4)}</row></sheetData><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/><tableParts count="0"/></worksheet>`,
			"xl/embeddings/Microsoft_Excel_Worksheet.xlsx": "not really a workbook",
		}),
	);
	entries.push({
		name: "xl/media/image1.png",
		data: new Uint8Array([137, 80, 78, 71]),
		stored: false,
	});
	return entries;
}

interface Json {
	nextId: number;
	sheets: { id: number; name: string; rows: string[][]; charts?: Chart[] }[];
}

const open = (entries: ZipEntry[]): Json =>
	JSON.parse(workbookToText(entries)) as Json;

/** A save, through the same text the editor sends. */
function save(entries: ZipEntry[], json: Json): ZipEntry[] {
	const copy = readZip(writeZip(entries));
	workbookFromText(copy, JSON.stringify(json));
	return readZip(writeZip(copy));
}

const bytes = (entries: ZipEntry[], name: string) =>
	entries.find((entry) => entry.name === name)?.data;

describe("reading charts", () => {
	it("reads an Excel column chart, colours through the theme", () => {
		const [chart] = open(book()).sheets[0]?.charts ?? [];
		expect(chart).toMatchObject({
			id: "xl/charts/chart1.xml",
			origin: "xl/charts/chart1.xml",
			type: "column",
			title: "Sales",
			legend: "b",
			x: {},
			y: { title: "Units", max: 40, gridlines: true },
		});
		expect(chart?.grouping).toBeUndefined();
		expect(chart?.unsupported).toBeUndefined();
		expect(chart?.series[0]).toMatchObject({
			nameRef: "Sheet1!$B$1",
			categories: "Sheet1!$A$2:$A$4",
			values: "Sheet1!$B$2:$B$4",
			color: "#4472c4",
			cache: {
				name: "North",
				categories: ["Q1", "Q2", "Q3"],
				values: [10, 20, 30],
			},
		});
		// accent2 at 75% luminance.
		expect(chart?.series[1]?.color).toMatch(/^#[0-9a-f]{6}$/);
		expect(chart?.series[1]?.color).not.toBe("#ed7d31");
		// Column E starts 4 Excel columns in, offset 10px; 15 rows of 20px.
		expect(chart?.anchor).toEqual({
			row: 4,
			col: 4,
			x: 10,
			y: 0,
			width: 7 * 64 - 10,
			height: 15 * 20,
		});
	});

	it("reads a Google Sheets line chart: quoted sheets, srgb, one-cell anchor", () => {
		const [chart] = open(book()).sheets[1]?.charts ?? [];
		expect(chart).toMatchObject({
			type: "line",
			markers: true,
			title: "Trend",
			legend: "r",
			x: { title: "Month" },
			y: { gridlines: true },
			anchor: { row: 0, col: 3, x: 0, y: 0, width: 600, height: 371 },
		});
		expect(chart?.series[0]).toMatchObject({
			nameRef: "'Data Sheet'!B1",
			categories: "'Data Sheet'!A2:A4",
			values: "'Data Sheet'!B2:B4",
			color: "#4285f4",
		});
	});

	it("resolves references against the grid, quoted sheet names included", () => {
		const json = open(book());
		const sheets = json.sheets;
		const source = sourceOf(createWorkbook(sheets), sheets);
		const chart = sheets[1]?.charts?.[0] as Chart;
		expect(chartData(chart, source, 1)).toEqual({
			categories: ["Jan", "Feb", "Mar"],
			series: [{ name: "Visits", values: [5, 7, 6], color: "#4285f4" }],
		});
	});

	it("marks what it cannot edit, and still reads the series", () => {
		const combo = EXCEL_CHART.replace(
			"</c:barChart>",
			`</c:barChart><c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/><c:ser><c:idx val="2"/><c:order val="2"/><c:val><c:numRef><c:f>Sheet1!$C$2:$C$4</c:f></c:numRef></c:val><c:trendline><c:trendlineType val="linear"/></c:trendline></c:ser><c:axId val="1415152016"/><c:axId val="1415154512"/></c:lineChart>`,
		);
		const chart = readChartXml(combo, workbookPalette(book()));
		expect(chart.unsupported).toEqual(["combo", "trendline"]);
		expect(chart.series).toHaveLength(3);
		const pie3d = readChartXml(
			`<c:chartSpace xmlns:c="${C}"><c:chart><c:plotArea><c:pie3DChart><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/><c:val><c:numLit><c:ptCount val="2"/><c:pt idx="0"><c:v>1</c:v></c:pt><c:pt idx="1"><c:v>3</c:v></c:pt></c:numLit></c:val></c:ser></c:pie3DChart></c:plotArea></c:chart></c:chartSpace>`,
			workbookPalette(book()),
		);
		expect(pie3d).toMatchObject({
			type: "pie",
			legend: "none",
			unsupported: ["3d"],
			series: [
				{
					values: "",
					cache: { values: [1, 3] },
					points: ["#4472c4", "#ed7d31"],
				},
			],
		});
	});
});

describe("writing charts", () => {
	it("keeps every chart part byte for byte when only cells change", () => {
		const entries = book();
		const json = open(entries);
		const first = json.sheets[0];
		if (first?.rows[1]) {
			first.rows[1][1] = "11";
		}
		const saved = save(entries, json);
		for (const part of [
			"xl/charts/chart1.xml",
			"xl/charts/chart2.xml",
			"xl/drawings/drawing1.xml",
			"xl/drawings/drawing2.xml",
			"xl/worksheets/sheet2.xml",
		]) {
			expect(bytes(saved, part)).toEqual(bytes(entries, part));
		}
		expect(partText(saved, "xl/worksheets/sheet1.xml")).toContain("<v>11</v>");
	});

	it("moves a chart by rewriting its anchor and keeping its frame", () => {
		const entries = book();
		const json = open(entries);
		const chart = json.sheets[0]?.charts?.[0] as Chart;
		chart.anchor = { ...chart.anchor, row: 6, col: 1, x: 0, y: 0 };
		const saved = save(entries, json);
		expect(bytes(saved, "xl/charts/chart1.xml")).toEqual(
			bytes(entries, "xl/charts/chart1.xml"),
		);
		const drawing = partText(saved, "xl/drawings/drawing1.xml") ?? "";
		expect(drawing).toContain(
			"<xdr:oneCellAnchor><xdr:from><xdr:col>1</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>6</xdr:row>",
		);
		expect(drawing).toContain('name="Chart 1"');
		expect(drawing).toContain("<xdr:pic>");
		expect(open(saved).sheets[0]?.charts?.[0]?.anchor).toEqual(chart.anchor);
	});

	it("patches only the references when rows moved under a chart", () => {
		const entries = book();
		const json = open(entries);
		const chart = json.sheets[0]?.charts?.[0] as Chart;
		chart.series = chart.series.map((s) => ({
			...s,
			values: s.values.replace("$4", "$5"),
		}));
		const saved = save(entries, json);
		const xml = partText(saved, "xl/charts/chart1.xml") ?? "";
		expect(xml).toContain("<c:f>Sheet1!$B$2:$B$5</c:f>");
		expect(xml).toContain("c14:style");
		expect(xml).toContain("c16:uniqueId");
	});

	it("rewrites an edited chart, and reads back what was written", () => {
		const entries = book();
		const json = open(entries);
		const chart = json.sheets[0]?.charts?.[0] as Chart;
		chart.type = "bar";
		chart.grouping = "stacked";
		chart.title = "Sales <by> region";
		chart.labels = true;
		const saved = save(entries, json);
		const again = open(saved).sheets[0]?.charts?.[0];
		expect(again).toMatchObject({
			type: "bar",
			grouping: "stacked",
			title: "Sales <by> region",
			labels: true,
			legend: "b",
			y: { title: "Units", max: 40, gridlines: true },
		});
		expect(again?.series.map((s) => s.values)).toEqual([
			"Sheet1!$B$2:$B$4",
			"Sheet1!$C$2:$C$4",
		]);
		expect(again?.series[0]?.cache?.values).toEqual([10, 20, 30]);
		expect(again?.series[0]?.color).toBe(chart.series[0]?.color);
		// Read-back is stable: a second save keeps the part as it is.
		const twice = save(saved, open(saved));
		expect(bytes(twice, "xl/charts/chart1.xml")).toEqual(
			bytes(saved, "xl/charts/chart1.xml"),
		);
	});

	it("adds a chart to a sheet with no drawing", () => {
		const entries = book();
		const json = open(entries);
		const empty = json.sheets[2];
		if (!empty) {
			throw new Error("no sheet");
		}
		const chart: Chart = {
			id: "new-1",
			anchor: { row: 3, col: 0, x: 0, y: 0, width: 480, height: 300 },
			type: "pie",
			legend: "r",
			x: {},
			y: {},
			series: [{ values: "Empty!$A$1:$B$1", points: ["#112233", null] }],
		};
		empty.charts = [chart];
		const saved = save(entries, json);
		const sheet = partText(saved, "xl/worksheets/sheet3.xml") ?? "";
		// After pageMargins, before tableParts, as the schema orders them.
		expect(sheet).toMatch(
			/<pageMargins[^>]*\/><drawing r:id="rId1"\/><tableParts/,
		);
		expect(sheet).toContain(`xmlns:r="${R}"`);
		expect(partText(saved, "xl/worksheets/_rels/sheet3.xml.rels")).toContain(
			'Target="../drawings/drawing3.xml"',
		);
		expect(partText(saved, "xl/drawings/_rels/drawing3.xml.rels")).toContain(
			'Target="../charts/chart3.xml"',
		);
		const types = partText(saved, "[Content_Types].xml") ?? "";
		expect(types).toContain('PartName="/xl/drawings/drawing3.xml"');
		expect(types).toContain('PartName="/xl/charts/chart3.xml"');
		const read = open(saved).sheets[2]?.charts?.[0];
		expect(read).toMatchObject({
			origin: "xl/charts/chart3.xml",
			type: "pie",
			anchor: chart.anchor,
			series: [{ values: "Empty!$A$1:$B$1", cache: { values: [1, 2] } }],
		});
		expect(read?.series[0]?.points?.[0]).toBe("#112233");
		// Other sheets were not reserialised.
		expect(bytes(saved, "xl/worksheets/sheet1.xml")).toEqual(
			bytes(entries, "xl/worksheets/sheet1.xml"),
		);
	});

	it("deletes the last chart of a drawing and the drawing with it", () => {
		const entries = book();
		const json = open(entries);
		const google = json.sheets[1];
		if (google) {
			google.charts = [];
		}
		const saved = save(entries, json);
		const names = saved.map((entry) => entry.name);
		expect(names).not.toContain("xl/charts/chart2.xml");
		expect(names).not.toContain("xl/drawings/drawing2.xml");
		expect(names).not.toContain("xl/drawings/_rels/drawing2.xml.rels");
		expect(names).not.toContain("xl/worksheets/_rels/sheet2.xml.rels");
		expect(partText(saved, "xl/worksheets/sheet2.xml")).not.toContain(
			"<drawing",
		);
		const types = partText(saved, "[Content_Types].xml") ?? "";
		expect(types).not.toContain("chart2.xml");
		expect(types).not.toContain("drawing2.xml");
	});

	it("deletes a chart beside a picture and keeps the picture", () => {
		const entries = book();
		const json = open(entries);
		const excel = json.sheets[0];
		if (excel) {
			excel.charts = [];
		}
		const saved = save(entries, json);
		const names = saved.map((entry) => entry.name);
		expect(names).not.toContain("xl/charts/chart1.xml");
		expect(names).not.toContain("xl/charts/_rels/chart1.xml.rels");
		expect(names).not.toContain("xl/embeddings/Microsoft_Excel_Worksheet.xlsx");
		expect(names).toContain("xl/media/image1.png");
		const drawing = partText(saved, "xl/drawings/drawing1.xml") ?? "";
		expect(drawing).toContain("<xdr:pic>");
		expect(drawing).not.toContain("graphicFrame");
		const rels = partText(saved, "xl/drawings/_rels/drawing1.xml.rels") ?? "";
		expect(rels).toContain("image1.png");
		expect(rels).not.toContain("chart1.xml");
	});

	it("leaves charts alone when the editor sends none (an older client)", () => {
		const entries = book();
		const json = open(entries);
		for (const sheet of json.sheets) {
			delete sheet.charts;
		}
		const saved = save(entries, json);
		expect(bytes(saved, "xl/drawings/drawing1.xml")).toEqual(
			bytes(entries, "xl/drawings/drawing1.xml"),
		);
		expect(saved.map((e) => e.name)).toContain("xl/charts/chart2.xml");
	});

	it("writes a chart part that reads back as the same model", () => {
		const palette = workbookPalette(book());
		for (const type of [
			"column",
			"line",
			"area",
			"scatter",
			"doughnut",
		] as const) {
			const chart: Chart = {
				id: "x",
				anchor: { row: 0, col: 0, x: 0, y: 0, width: 400, height: 300 },
				type,
				legend: "t",
				title: "T",
				x: { title: "X", min: 1 },
				y: { title: "Y", max: 9, gridlines: true },
				series: [
					{
						name: "One",
						values: "Sheet1!$B$2:$B$4",
						categories: "Sheet1!$A$2:$A$4",
						color: "#aa0000",
					},
				],
			};
			if (type === "doughnut") {
				chart.series = [
					{
						values: "Sheet1!$B$2:$B$4",
						points: ["#aa0000", "#00aa00", "#0000aa"],
					},
				];
				chart.x = {};
				chart.y = {};
			}
			if (type === "line") {
				chart.markers = true;
			}
			const data = {
				categories: ["a", "b", "c"],
				series: [{ name: "One", values: [1, 2, 3], xs: [1, 2, 3] }],
			};
			const { series, ...rest } = readChartXml(chartXml(chart, data), palette);
			const { id: _id, anchor: _anchor, series: wanted, ...expected } = chart;
			expect(rest).toEqual(expected);
			expect(series.map(({ cache: _cache, ...s }) => s)).toEqual(wanted);
		}
	});
});

describe("the PDF export", () => {
	it("draws each sheet's charts under its table, through pdfmake's SVG", async () => {
		const sheets = open(book()).sheets;
		const definition = sheetsPdf(sheets, "Charts");
		const content = definition.content as { svg?: string; width?: number }[];
		const svgs = content.filter((block) => block.svg);
		expect(svgs).toHaveLength(2);
		expect(svgs[0]?.svg).toContain('data-tip="North · Q1: 10"');
		expect(svgs[0]?.width).toBeLessThanOrEqual(770);
		const pdf = await renderPdf(definition);
		expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
	});
});

describe("patching an edited chart", () => {
	/** Excel's chart dressed up: a shadow, a font on the title and the chart. */
	const FANCY = EXCEL_CHART.replace(
		'<a:rPr lang="en-US"/><a:t>Sales</a:t>',
		'<a:rPr lang="en-US" b="1"><a:latin typeface="Georgia"/></a:rPr><a:t>Sales</a:t>',
	)
		.replace(
			"<a:ln><a:noFill/></a:ln></c:spPr>",
			'<a:ln><a:noFill/></a:ln><a:effectLst><a:outerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="35000"/></a:srgbClr></a:outerShdw></a:effectLst></c:spPr>',
		)
		.replace(
			"<c:externalData",
			'<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"><a:latin typeface="Georgia"/></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr><c:externalData',
		);
	const SOUTH_FILL =
		'<a:solidFill><a:schemeClr val="accent2"><a:lumMod val="75000"/></a:schemeClr></a:solidFill>';

	function fancyBook(): ZipEntry[] {
		const entries = book();
		setPartText(entries, "xl/charts/chart1.xml", FANCY);
		return entries;
	}

	it("changes the title and one colour, every other byte as it was", () => {
		const entries = fancyBook();
		const json = open(entries);
		const chart = json.sheets[0]?.charts?.[0] as Chart;
		chart.title = "Revenue";
		(chart.series[1] as Chart["series"][number]).color = "#123456";
		const saved = save(entries, json);
		expect(FANCY).toContain(SOUTH_FILL);
		expect(partText(saved, "xl/charts/chart1.xml")).toBe(
			FANCY.replace("<a:t>Sales</a:t>", "<a:t>Revenue</a:t>").replace(
				SOUTH_FILL,
				'<a:solidFill><a:srgbClr val="123456"/></a:solidFill>',
			),
		);
	});

	it("patches legend, axes, labels, stacking and direction in place", () => {
		const entries = fancyBook();
		const json = open(entries);
		const chart = json.sheets[0]?.charts?.[0] as Chart;
		Object.assign(chart, {
			type: "bar",
			grouping: "stacked",
			legend: "t",
			labels: true,
			x: { title: "Quarter" },
			y: { title: "Units", min: 5 },
		});
		const saved = save(entries, json);
		const xml = partText(saved, "xl/charts/chart1.xml") ?? "";
		expect(xml).toContain('typeface="Georgia"');
		expect(xml).toContain("<a:outerShdw");
		expect(xml).toContain("c14:style");
		expect(xml).toContain('<c:overlap val="100"/>');
		expect(open(saved).sheets[0]?.charts?.[0]).toMatchObject({
			type: "bar",
			grouping: "stacked",
			legend: "t",
			labels: true,
			title: "Sales",
			x: { title: "Quarter" },
			y: { title: "Units", min: 5 },
		});
		expect(open(saved).sheets[0]?.charts?.[0]?.y.gridlines).toBeUndefined();
	});

	it("adds a series by cloning the last, and writes a new type family anew", () => {
		const entries = fancyBook();
		const json = open(entries);
		const chart = json.sheets[0]?.charts?.[0] as Chart;
		chart.series.push({
			values: "Sheet1!$B$2:$B$4",
			name: "Extra",
			color: "#00aa00",
		});
		const saved = save(entries, json);
		const again = open(saved).sheets[0]?.charts?.[0];
		expect(again?.series.map((s) => s.color)).toEqual([
			chart.series[0]?.color,
			chart.series[1]?.color,
			"#00aa00",
		]);
		expect(again?.series[2]?.name).toBe("Extra");
		expect(partText(saved, "xl/charts/chart1.xml")).toContain(
			'typeface="Georgia"',
		);

		const json2 = open(entries);
		const pie = json2.sheets[0]?.charts?.[0] as Chart;
		pie.type = "line";
		const lined = save(entries, json2);
		expect(partText(lined, "xl/charts/chart1.xml")).toContain("<c:lineChart>");
		expect(partText(lined, "xl/charts/chart1.xml")).not.toContain("Georgia");
	});
});
