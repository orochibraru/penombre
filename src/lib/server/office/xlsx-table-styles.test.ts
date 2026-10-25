import { describe, expect, it } from "bun:test";

import { pack } from "./test-utils";
import { tint } from "./xlsx-colours";
import { Stylesheet } from "./xlsx-styles";
import { tableStyle } from "./xlsx-table-styles";
import { readZip } from "./zip";

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";

const ACCENTS = ["4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"];

const THEME = (accent1: string) =>
	`${PROLOG}<a:theme xmlns:a="${A}"><a:themeElements><a:clrScheme name="Mine"><a:dk1><a:srgbClr val="111111"/></a:dk1><a:lt1><a:srgbClr val="EEEEEE"/></a:lt1><a:dk2><a:srgbClr val="222222"/></a:dk2><a:lt2><a:srgbClr val="DDDDDD"/></a:lt2><a:accent1><a:srgbClr val="${accent1}"/></a:accent1><a:accent2><a:srgbClr val="00AA00"/></a:accent2><a:accent3><a:srgbClr val="0000AA"/></a:accent3><a:accent4><a:srgbClr val="AAAA00"/></a:accent4><a:accent5><a:srgbClr val="00AAAA"/></a:accent5><a:accent6><a:srgbClr val="AA00AA"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`;

const DXFS =
	'<dxfs count="4">' +
	'<dxf><font><b/><i val="0"/><u/><strike val="false"/><color rgb="FF112233"/></font><fill><patternFill><bgColor rgb="FFAABBCC"/><fgColor rgb="FF000000"/></patternFill></fill></dxf>' +
	'<dxf><fill><patternFill patternType="solid"><fgColor rgb="FF445566"/></patternFill></fill><border><top style="thin"><color rgb="FF0000FF"/></top><bottom style="medium"/><left style="squiggle"/><horizontal style="dashed"/></border></dxf>' +
	'<dxf><font><i/><strike/></font><fill><patternFill patternType="none"><bgColor rgb="FFFF0000"/></patternFill></fill></dxf>' +
	'<dxf><patternFill><bgColor rgb="FF00FF00"/></patternFill></dxf>' +
	"</dxfs>";

const TABLE_STYLES =
	'<tableStyles count="1"><tableStyle name="Mine" count="6">' +
	'<tableStyleElement type="wholeTable" dxfId="0"/>' +
	'<tableStyleElement type="headerRow" dxfId="1"/>' +
	'<tableStyleElement type="firstRowStripe" dxfId="2" size="2"/>' +
	'<tableStyleElement type="secondRowStripe" dxfId="3" size="1"/>' +
	'<tableStyleElement type="totalRow" dxfId="9"/>' +
	'<tableStyleElement type="pageBreak" dxfId="0"/>' +
	"</tableStyle></tableStyles>";

function sheet(options: { theme?: string; styles?: string } = {}): Stylesheet {
	return new Stylesheet(
		readZip(
			pack({
				"xl/styles.xml": `${PROLOG}<styleSheet xmlns="${MAIN}">${options.styles ?? ""}</styleSheet>`,
				...(options.theme ? { "xl/theme/theme1.xml": options.theme } : {}),
			}),
		),
	);
}

const shade = (hex: string, amount: number) => `#${tint(hex, amount)}`;

describe("tableStyle", () => {
	it("is null for no name or an unknown one", () => {
		const styles = sheet();
		for (const name of [
			undefined,
			"",
			"Fancy",
			"TableStyleLight0",
			"TableStyleLight22",
			"TableStyleMedium29",
			"TableStyleDark12",
			"TableStyleDark0",
			"TableStyleLightX",
		]) {
			expect(tableStyle(styles, name)).toBeNull();
		}
	});

	it("reads a custom style's elements from its differential formats", () => {
		const style = tableStyle(sheet({ styles: DXFS + TABLE_STYLES }), "Mine");
		expect(style).toEqual({
			wholeTable: {
				bold: true,
				underline: true,
				color: "#112233",
				fill: "#AABBCC",
			},
			headerRow: {
				fill: "#445566",
				borders: {
					top: { style: "thin", color: "#0000FF" },
					bottom: { style: "medium" },
					horizontal: { style: "dashed" },
				},
			},
			firstRowStripe: { italic: true, strike: true, size: 2 },
			secondRowStripe: { fill: "#00FF00" },
			totalRow: {},
		});
	});

	it("prefers a custom style over a built-in of the same name", () => {
		const custom = TABLE_STYLES.replace(
			'name="Mine"',
			'name="TableStyleMedium2"',
		);
		const style = tableStyle(
			sheet({ styles: DXFS + custom }),
			"TableStyleMedium2",
		);
		expect(style?.headerRow?.fill).toBe("#445566");
	});

	it("falls back to a built-in when the file has no such custom style", () => {
		const style = tableStyle(
			sheet({ styles: TABLE_STYLES }),
			"TableStyleLight1",
		);
		expect(style?.headerRow).toEqual({
			bold: true,
			borders: { bottom: { style: "thin", color: "#000000" } },
		});
	});
});

describe("built-in styles", () => {
	const office = sheet();

	it("draw the first of each seven in the neutral dark colour", () => {
		expect(tableStyle(office, "TableStyleLight1")).toEqual({
			wholeTable: {
				borders: {
					top: { style: "thin", color: "#000000" },
					bottom: { style: "thin", color: "#000000" },
				},
			},
			headerRow: {
				bold: true,
				borders: { bottom: { style: "thin", color: "#000000" } },
			},
			totalRow: {
				bold: true,
				borders: { top: { style: "double", color: "#000000" } },
			},
			firstColumn: { bold: true },
			lastColumn: { bold: true },
			firstRowStripe: { fill: shade("000000", 0.8) },
			firstColumnStripe: { fill: shade("000000", 0.8) },
		});
	});

	it("take accents one to six for the rest of each seven", () => {
		ACCENTS.forEach((accent, index) => {
			const style = tableStyle(office, `TableStyleMedium${index + 2}`);
			expect(style?.headerRow).toEqual({
				bold: true,
				fill: `#${accent}`,
				color: "#FFFFFF",
			});
		});
	});

	it("follow the workbook's own theme", () => {
		const themed = sheet({ theme: THEME("123456") });
		expect(tableStyle(themed, "TableStyleMedium2")?.headerRow?.fill).toBe(
			"#123456",
		);
		expect(tableStyle(themed, "TableStyleMedium1")?.headerRow?.fill).toBe(
			"#111111",
		);
	});

	it("shape each family its own way", () => {
		const accent = ACCENTS[0] as string;
		const blue = `#${accent}`;
		expect(tableStyle(office, "TableStyleLight9")).toMatchObject({
			wholeTable: {
				borders: {
					top: { color: blue },
					right: { color: blue },
					bottom: { color: blue },
					left: { color: blue },
				},
			},
			headerRow: { fill: blue, color: "#FFFFFF" },
			firstRowStripe: { borders: { top: { color: blue } } },
		});
		expect(
			tableStyle(office, "TableStyleLight16")?.wholeTable?.borders,
		).toMatchObject({
			horizontal: { color: blue },
			vertical: { color: blue },
		});
		expect(tableStyle(office, "TableStyleMedium9")).toMatchObject({
			wholeTable: {
				fill: shade(accent, 0.8),
				borders: { horizontal: { color: "#FFFFFF" } },
			},
			firstColumn: { fill: blue },
			firstRowStripe: { fill: shade(accent, 0.6) },
		});
		expect(tableStyle(office, "TableStyleMedium16")).toMatchObject({
			wholeTable: { borders: { top: { color: "#000000" } } },
			headerRow: { fill: blue },
			totalRow: { borders: { top: { style: "double", color: "#000000" } } },
		});
		expect(tableStyle(office, "TableStyleMedium23")).toMatchObject({
			wholeTable: {
				fill: shade(accent, 0.8),
				borders: { vertical: { color: shade(accent, 0.4) } },
			},
			headerRow: { bold: true },
		});
		expect(tableStyle(office, "TableStyleDark2")).toMatchObject({
			wholeTable: { fill: shade(accent, -0.25), color: "#FFFFFF" },
			headerRow: {
				fill: "#000000",
				borders: { bottom: { style: "medium", color: "#FFFFFF" } },
			},
			firstColumn: { fill: shade(accent, -0.5) },
		});
	});

	it("pair dark 8 to 11 with the neutral colour and accents 1, 3 and 5", () => {
		const fills = [8, 9, 10, 11].map(
			(n) => tableStyle(office, `TableStyleDark${n}`)?.wholeTable?.fill,
		);
		expect(fills).toEqual([
			shade("000000", 0.8),
			shade("4472C4", 0.8),
			shade("A5A5A5", 0.8),
			shade("5B9BD5", 0.8),
		]);
		expect(tableStyle(office, "TableStyleDark8")?.headerRow).toEqual({
			bold: true,
			fill: "#000000",
			color: "#FFFFFF",
		});
	});
});
