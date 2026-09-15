import { readZip, writeZip, type ZipEntry } from "./zip";

/**
 * Minimal but real OOXML packages, built here rather than committed as
 * binaries. A fixture you can read is a fixture you can reason about when a
 * test fails, and each one carries exactly the shapes the tests assert on.
 */

export function pack(parts: Record<string, string>): Buffer {
	const entries: ZipEntry[] = Object.entries(parts).map(([name, text]) => ({
		name,
		data: new TextEncoder().encode(text),
		stored: false,
	}));
	return writeZip(entries);
}

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

// =========================================================================
// Spreadsheets
// =========================================================================

interface WorkbookOptions {
	/** Extra `<c>` elements, already serialised, keyed by their row number. */
	rows: string;
	/** Style records, so a test can give a cell a date format. */
	cellXfs?: string;
	numFmts?: string;
	sharedStrings?: string[];
}

export function workbook(options: WorkbookOptions): Buffer {
	const strings = options.sharedStrings ?? [];
	return pack({
		"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>`,
		"_rels/.rels": `${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
		"xl/workbook.xml": `${PROLOG}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="First" sheetId="1" r:id="rId1"/><sheet name="Second" sheetId="2" r:id="rId2"/></sheets></workbook>`,
		"xl/_rels/workbook.xml.rels": `${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`,
		"xl/worksheets/sheet1.xml": `${PROLOG}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:A1"/><sheetData>${options.rows}</sheetData></worksheet>`,
		"xl/worksheets/sheet2.xml": `${PROLOG}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>untouched</t></is></c></row></sheetData></worksheet>`,
		"xl/sharedStrings.xml": `${PROLOG}<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">${strings.map((value) => `<si><t>${value}</t></si>`).join("")}</sst>`,
		"xl/styles.xml": `${PROLOG}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${options.numFmts ?? ""}<cellXfs count="2">${options.cellXfs ?? '<xf numFmtId="0"/><xf numFmtId="14"/>'}</cellXfs></styleSheet>`,
	});
}

// =========================================================================
// Documents
// =========================================================================

interface DocumentOptions {
	/** The body's children, already serialised, without the `w:sectPr`. */
	body: string;
	/** Extra relationships, already serialised. */
	rels?: string;
	/** Extra style definitions, already serialised. */
	styles?: string;
}

/** One pixel of PNG, so a document can carry a real media part. */
export const PIXEL_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
	"base64",
);

export function wordDocument(options: DocumentOptions): Buffer {
	const bytes = pack({
		"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
		"_rels/.rels": `${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
		"word/document.xml": `${PROLOG}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><w:body>${options.body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>`,
		"word/_rels/document.xml.rels": `${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/pic.png"/>${options.rels ?? ""}</Relationships>`,
		"word/styles.xml": `${PROLOG}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style><w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/></w:style><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/></w:style><w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:pPr><w:numPr><w:numId w:val="1"/></w:numPr></w:pPr></w:style><w:style w:type="paragraph" w:styleId="ListNumber"><w:name w:val="List Number"/><w:pPr><w:numPr><w:numId w:val="2"/></w:numPr></w:pPr></w:style>${options.styles ?? ""}</w:styles>`,
		"word/numbering.xml": `${PROLOG}<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`,
	});
	// The image part is binary, so it is appended rather than packed as text.
	return appendBinary(bytes, "word/media/pic.png", PIXEL_PNG);
}

/** A run that draws the package's one image, for the body option above. */
export const DRAWING_RUN =
	'<w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><a:graphic><a:graphicData><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill><a:blip r:embed="rId9"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';

function appendBinary(zip: Buffer, name: string, data: Buffer): Buffer {
	// Re-pack rather than splice: the whole point of readZip/writeZip is that
	// doing so is lossless, and the tests lean on that anyway.
	const entries = readZip(zip);
	entries.push({ name, data: new Uint8Array(data), stored: false });
	return writeZip(entries);
}

// =========================================================================
// Presentations
// =========================================================================

/** A slide with a title placeholder and, optionally, a body placeholder. */
export function slideXml(title: string, body?: string[]): string {
	const bodyShape =
		body === undefined
			? ""
			: `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${body
					.map((line) => `<a:p><a:r><a:t>${line}</a:t></a:r></a:p>`)
					.join("")}</p:txBody></p:sp>`;
	return `${PROLOG}<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${title}</a:t></a:r></a:p></p:txBody></p:sp>${bodyShape}</p:spTree></p:cSld></p:sld>`;
}

export function presentation(slides: string[]): Buffer {
	const parts: Record<string, string> = {
		"[Content_Types].xml": `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>${slides
			.map(
				(_slide, index) =>
					`<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
			)
			.join("")}</Types>`,
		"_rels/.rels": `${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`,
		"ppt/presentation.xml": `${PROLOG}<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>${slides
			.map(
				(_slide, index) =>
					`<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`,
			)
			.join("")}</p:sldIdLst></p:presentation>`,
		"ppt/_rels/presentation.xml.rels": `${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slides
			.map(
				(_slide, index) =>
					`<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`,
			)
			.join("")}</Relationships>`,
	};
	slides.forEach((slide, index) => {
		parts[`ppt/slides/slide${index + 1}.xml`] = slide;
		parts[`ppt/slides/_rels/slide${index + 1}.xml.rels`] =
			`${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
	});
	return pack(parts);
}
