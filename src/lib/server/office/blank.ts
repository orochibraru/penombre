import { blankDocument } from "./docx-package";
import { htmlToDocx } from "./docx-write";
import { writeZip, type ZipEntry } from "./zip";

/**
 * The files **New** creates: a Word document and an Excel workbook, empty,
 * built here rather than shipped as templates so every part is readable in
 * the diff that changes it.
 */

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const REL =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const SHEET = "application/vnd.openxmlformats-officedocument.spreadsheetml";

/** One sheet, `Sheet1`, and the minimal styles Excel expects to find. */
export function blankWorkbook(): ZipEntry[] {
	const parts: Record<string, string> = {
		"[Content_Types].xml": `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${SHEET}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${SHEET}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${SHEET}.styles+xml"/></Types>`,
		"_rels/.rels": `${XML}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
		"xl/workbook.xml": `${XML}<workbook xmlns="${MAIN}" xmlns:r="${REL}"><bookViews><workbookView/></bookViews><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
		"xl/_rels/workbook.xml.rels": `${XML}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
		"xl/worksheets/sheet1.xml": `${XML}<worksheet xmlns="${MAIN}" xmlns:r="${REL}"><dimension ref="A1"/><sheetData/></worksheet>`,
		"xl/styles.xml": `${XML}<styleSheet xmlns="${MAIN}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
	};
	return Object.entries(parts).map(([name, source]) => ({
		name,
		data: new TextEncoder().encode(source),
		stored: false,
	}));
}

/**
 * The bytes of a new, empty document or sheet. A document opens on an empty
 * heading: its title, which the file's name then follows.
 */
export function blankFile(kind: "document" | "sheet"): Buffer {
	if (kind === "sheet") {
		return writeZip(blankWorkbook());
	}
	const entries = blankDocument();
	htmlToDocx(entries, "<h1></h1><p></p>");
	return writeZip(entries);
}
