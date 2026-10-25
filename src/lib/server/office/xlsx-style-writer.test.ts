import { describe, expect, it } from "bun:test";

import type { CellStyle } from "#lib/sheet/styles.js";

import { pack } from "./test-utils";
import {
	addStylesPart,
	mappedFormats,
	styleTable,
	StyleWriter,
	styleWriterFor,
} from "./xlsx-style-writer";
import { Stylesheet } from "./xlsx-styles";
import { element, parseXml } from "./xml";
import { partText, readZip, type ZipEntry } from "./zip";

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";

/** Calibri 11, one bold font, a bordered xf with a start edge and a protection flag. */
const STYLES = `${PROLOG}<styleSheet xmlns="${MAIN}"><numFmts count="1"><numFmt numFmtId="170" formatCode="0.000%"/></numFmts><fonts count="2"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><start style="thin"/><right/><top/><bottom/><diagonal/></border></borders><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"><alignment horizontal="left"/><protection locked="0"/></xf></cellXfs><dxfs count="0"/></styleSheet>`;

function book(styles: string | null = STYLES): ZipEntry[] {
	return readZip(
		pack(styles === null ? { "x.xml": "<x/>" } : { "xl/styles.xml": styles }),
	);
}

const stylesXml = (entries: ZipEntry[]) =>
	partText(entries, "xl/styles.xml") ?? "";

/** What the saved file's `cellXfs` entry draws as. */
function resolved(entries: ZipEntry[], index: number): CellStyle {
	const sheet = new Stylesheet(entries);
	const xf = sheet.list("cellXfs", "xf")[index];
	if (!xf) {
		throw new Error(`no xf ${index}`);
	}
	return sheet.resolve(xf);
}

/** One new style, saved, and the index it landed at. */
function appendOne(style: CellStyle, entries = book()) {
	const writer = new StyleWriter(entries, [{}, style]);
	const index = writer.xfFor(1);
	writer.save();
	return { entries, index, xml: stylesXml(entries) };
}

describe("mapping the editor's styles onto the file's", () => {
	it("keeps index 0, and an index whose look did not change", () => {
		const entries = book();
		const writer = new StyleWriter(entries, [{}, { bold: true }]);
		expect(writer.xfFor(0)).toBe(0);
		expect(writer.xfFor(1)).toBe(1);
		writer.save();
		expect(stylesXml(entries)).toBe(STYLES);
	});

	it("keeps a file index the table does not name, else the default", () => {
		const writer = new StyleWriter(book());
		expect(writer.xfFor(2)).toBe(2);
		expect(writer.xfFor(9)).toBe(0);
	});

	it("reuses an equal entry elsewhere in the file", () => {
		const writer = new StyleWriter(book(), [{}, {}, { bold: true }]);
		expect(writer.xfFor(2)).toBe(1);
	});

	it("appends a new look once, however often it is asked for", () => {
		const entries = book();
		const writer = new StyleWriter(entries, [
			{},
			{ italic: true },
			{ italic: true },
		]);
		expect(writer.xfFor(1)).toBe(3);
		expect(writer.xfFor(2)).toBe(3);
		writer.save();
		expect(stylesXml(entries)).toContain('<cellXfs count="4">');
		expect(resolved(entries, 3)).toEqual({ italic: true });
	});

	it("maps a sheet's whole grid", () => {
		const writer = new StyleWriter(book(), [
			{},
			{ bold: true },
			{ strike: true },
		]);
		expect(
			mappedFormats(writer, { styleIds: [[0, 1], [2]], merges: ["A1:B1"] }),
		).toEqual({ styleIds: [[0, 1], [3]], merges: ["A1:B1"] });
		expect(mappedFormats(writer, {})).toEqual({
			styleIds: undefined,
			merges: undefined,
		});
	});
});

describe("appended entries", () => {
	it("write every font property, dropping the theme scheme with the name", () => {
		const style: CellStyle = {
			bold: true,
			italic: true,
			strike: true,
			underline: true,
			size: 14,
			color: "#FF0000",
			font: "Georgia",
		};
		const { entries, index, xml } = appendOne(style);
		expect(xml).toContain(
			'<font><b/><i/><strike/><u/><sz val="14"/><color rgb="FFFF0000"/><name val="Georgia"/></font>',
		);
		expect(resolved(entries, index)).toEqual(style);
	});

	it("take a font away from its base without touching the rest", () => {
		const { entries, index, xml } = appendOne({ size: 9, base: 1 });
		expect(xml).toContain('<font><sz val="9"/><name val="Calibri"/></font>');
		expect(resolved(entries, index)).toEqual({ size: 9 });
	});

	it("go back to the default size and font when cleared", () => {
		const entries = book(
			STYLES.replace(
				'<font><b/><sz val="11"/><name val="Calibri"/></font>',
				'<font><sz val="20"/><color rgb="FF00FF00"/><name val="Arial"/></font>',
			),
		);
		const { index, xml } = appendOne({ bold: true, base: 1 }, entries);
		expect(xml).toContain(
			'<font><b/><sz val="11"/><name val="Calibri"/></font>',
		);
		expect(resolved(entries, index)).toEqual({ bold: true });
	});

	it("fill solid, sharing an identical fill", () => {
		const entries = book();
		const writer = new StyleWriter(entries, [
			{},
			{ fill: "#00FF00" },
			{ fill: "#00FF00", bold: true },
		]);
		expect(writer.xfFor(1)).toBe(3);
		expect(writer.xfFor(2)).toBe(4);
		writer.save();
		const xml = stylesXml(entries);
		expect(xml.match(/fgColor rgb="FF00FF00"/g)).toHaveLength(1);
		expect(xml).toContain('<fills count="3">');
		expect(resolved(entries, 4)).toEqual({ bold: true, fill: "#00FF00" });
	});

	it("clear a fill back to none", () => {
		const entries = book(
			STYLES.replace(
				'<patternFill patternType="gray125"/></fill></fills>',
				'<patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF0000"/></patternFill></fill></fills>',
			).replace(
				'<xf numFmtId="0" fontId="1" fillId="0"',
				'<xf numFmtId="0" fontId="1" fillId="2"',
			),
		);
		expect(resolved(entries, 1)).toEqual({ bold: true, fill: "#FF0000" });
		const { index, xml } = appendOne({ bold: true, base: 1 }, entries);
		expect(index).toBe(3);
		expect(xml).toContain(
			'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyFill="1"/></cellXfs>',
		);
		expect(resolved(entries, index)).toEqual({ bold: true });
	});

	it("rewrite only the border sides that changed, in one spelling", () => {
		const style: CellStyle = {
			align: "left",
			borders: {
				left: { style: "medium", color: "#0000FF" },
				bottom: { style: "dashed" },
			},
			base: 2,
		};
		const { entries, index, xml } = appendOne(style);
		expect(xml).toContain(
			'<border><left style="medium"><color rgb="FF0000FF"/></left><right/><top/><bottom style="dashed"/><diagonal/></border>',
		);
		expect(xml).toContain('<protection locked="0"/>');
		const { base: _base, ...look } = style;
		expect(resolved(entries, index)).toEqual(look);
	});

	it("remove a border side", () => {
		const { entries, index, xml } = appendOne({ align: "left", base: 2 });
		expect(xml).toContain(
			"<border><left/><right/><top/><bottom/><diagonal/></border>",
		);
		expect(resolved(entries, index)).toEqual({ align: "left" });
	});

	it("use a built-in format id, a file's own, or a new one", () => {
		const entries = book();
		const writer = new StyleWriter(entries, [
			{},
			{ format: "0.00" },
			{ format: "0.000%" },
			{ format: '#,##0.0 "kg"' },
			{ format: '0.0 "g"' },
		]);
		[1, 2, 3, 4].forEach((index) => writer.xfFor(index));
		writer.save();
		const xml = stylesXml(entries);
		expect(xml).toContain(
			'<xf numFmtId="2" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>',
		);
		expect(xml).toContain('<xf numFmtId="170"');
		expect(xml).toContain(
			'<numFmts count="3"><numFmt numFmtId="170" formatCode="0.000%"/><numFmt numFmtId="171" formatCode="#,##0.0 &quot;kg&quot;"/><numFmt numFmtId="172" formatCode="0.0 &quot;g&quot;"/></numFmts>',
		);
		expect(resolved(entries, 6)).toEqual({ format: '0.0 "g"' });
	});

	it("align, with middle written as center, and drop an emptied alignment", () => {
		const { entries, index, xml } = appendOne({
			align: "right",
			valign: "middle",
			wrap: true,
		});
		expect(xml).toContain(
			'<alignment horizontal="right" vertical="center" wrapText="1"/>',
		);
		expect(resolved(entries, index)).toEqual({
			align: "right",
			valign: "middle",
			wrap: true,
		});
		const emptied = appendOne({
			borders: { left: { style: "thin" } },
			base: 2,
		});
		expect(emptied.xml).toMatch(
			/<xf numFmtId="0" fontId="0" fillId="0" borderId="\d" applyBorder="1" applyAlignment="1"><protection locked="0"\/><\/xf><\/cellXfs>/,
		);
	});

	it("start from the default when the base is not the file's", () => {
		const { entries, index } = appendOne({ italic: true, base: 40 });
		expect(resolved(entries, index)).toEqual({ italic: true });
	});
});

describe("a styles part missing its lists", () => {
	it("gets each list with its default entry first", () => {
		const entries = book(`${PROLOG}<styleSheet xmlns="${MAIN}"/>`);
		const writer = new StyleWriter(entries, [
			{},
			{
				bold: true,
				fill: "#123456",
				borders: { top: { style: "thin" } },
				format: '0.0 "x"',
			},
		]);
		expect(writer.xfFor(1)).toBe(1);
		writer.save();
		expect(stylesXml(entries)).toBe(
			`${PROLOG}<styleSheet xmlns="${MAIN}"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0 &quot;x&quot;"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF123456"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top style="thin"/><bottom/><diagonal/></border></borders><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="164" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/></cellXfs></styleSheet>`,
		);
	});

	it("an unstyled look needs no entry without a styles part", () => {
		const writer = new StyleWriter(book(null), [{}, {}]);
		expect(writer.present).toBe(false);
		expect(writer.xfFor(1)).toBe(0);
		expect(() => writer.dxf(element("dxf"))).toThrow("No styles part");
		expect(() =>
			new StyleWriter(book(null), [{}, { bold: true }]).xfFor(1),
		).toThrow("No styles part");
	});
});

describe("conditional formats", () => {
	it("append a dxf unless an identical one is there", () => {
		const entries = book();
		const writer = new StyleWriter(entries);
		const red = () =>
			element("dxf", {}, [
				element("font", {}, [element("color", { rgb: "FFFF0000" })]),
			]);
		expect(writer.dxf(red())).toBe(0);
		expect(writer.dxf(red())).toBe(0);
		writer.save();
		expect(stylesXml(entries)).toContain(
			'<dxfs count="1"><dxf><font><color rgb="FFFF0000"/></font></dxf></dxfs>',
		);
	});

	it("an existing dxf changes nothing", () => {
		const styles = STYLES.replace(
			'<dxfs count="0"/>',
			'<dxfs count="1"><dxf><fill/></dxf></dxfs>',
		);
		const entries = book(styles);
		const writer = new StyleWriter(entries);
		expect(writer.dxf(element("dxf", {}, [element("fill")]))).toBe(0);
		writer.save();
		expect(stylesXml(entries)).toBe(styles);
	});
});

describe("a package with no styles part", () => {
	const rels = () =>
		parseXml(
			`<Relationships xmlns="${RELS}"><Relationship Id="rId1" Target="a"/><Relationship Id="rId2" Target="b"/></Relationships>`,
		);
	const types = () => parseXml("<Types/>");

	it("gets one with a free relationship id and a content type", () => {
		const entries = book(null);
		const workbookRels = rels();
		const contentTypes = types();
		addStylesPart(entries, workbookRels, contentTypes);
		expect(stylesXml(entries)).toContain('<cellStyle name="Normal"');
		expect(workbookRels.root.children.at(-1)).toMatchObject({
			attrs: { Id: "rId3", Target: "styles.xml" },
		});
		expect(contentTypes.root.children.at(-1)).toMatchObject({
			attrs: { PartName: "/xl/styles.xml" },
		});
	});

	it("is left alone when it already has one", () => {
		const entries = book();
		const workbookRels = rels();
		addStylesPart(entries, workbookRels, types());
		expect(stylesXml(entries)).toBe(STYLES);
		expect(workbookRels.root.children).toHaveLength(2);
	});

	it("gets one for a save only when a cell or a chip needs a style", () => {
		const pkg = () => ({ rels: rels(), types: types() });
		const plain = book(null);
		expect(
			styleWriterFor(plain, [{}], [{ styleIds: [[0]] }], pkg()).present,
		).toBe(false);
		const styled = book(null);
		const writer = styleWriterFor(
			styled,
			[{}, { bold: true }],
			[{ styleIds: [[0, 1]] }],
			pkg(),
		);
		expect(writer.present).toBe(true);
		expect(writer.xfFor(1)).toBe(1);
		const chips = book(null);
		expect(
			styleWriterFor(
				chips,
				[{}],
				[{ dropdowns: [{ colors: ["#FF0000"] }] }],
				pkg(),
			).present,
		).toBe(true);
	});
});

describe("styleTable", () => {
	it("normalises what the editor sent", () => {
		expect(
			styleTable({ styles: [{}, { bold: true, fill: "#00ff00", junk: 1 }] }),
		).toEqual([{}, { bold: true, fill: "#00FF00" }]);
	});

	it("refuses anything but a reasonable array", () => {
		expect(styleTable(null)).toEqual([]);
		expect(styleTable({ styles: "bold" })).toEqual([]);
		expect(
			styleTable({ styles: Array.from({ length: 65_001 }, () => ({})) }),
		).toEqual([]);
	});
});
