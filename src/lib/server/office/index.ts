import { type DocumentKind, officeKindForName } from "#lib/documents.js";
import { documentXml } from "./docx-package";
import { docxToHtml } from "./docx-read";
import { htmlToDocx } from "./docx-write";
import { pptxToText, textToPptx } from "./pptx";
import { workbookFromText, workbookToText } from "./xlsx";
import { isElement, parseXml, type XmlElement } from "./xml";
import { readZip, writeZip } from "./zip";

/**
 * Word, Excel and PowerPoint files, read into the text the three editors
 * speak and written back into the file they came from.
 *
 * "Back into" is the point. The archive is opened, the one part that holds
 * the text is rewritten and everything else is put back byte for byte, so
 * styles, themes, images, other sheets, headers and footers survive an edit
 * that never had to understand them. What the editors cannot represent —
 * fonts, colours, sizes, anything anchored to text the user rewrote — does
 * not survive, and `docs/documents.md` says so plainly.
 */

export class UnsupportedOfficeFileError extends Error {}

/** Whether this file is one of the Office formats we can edit. */
export function isOfficeFile(name: string): boolean {
	return officeKindForName(name) !== null;
}

function kindOf(name: string): DocumentKind {
	const kind = officeKindForName(name);
	if (!kind) {
		throw new UnsupportedOfficeFileError(`${name} is not an Office document`);
	}
	return kind;
}

/**
 * The file's text, in the format the editor for its kind reads: HTML, the
 * workbook as JSON (every sheet), the deck as JSON (`#lib/slides`).
 */
export function officeToText(name: string, bytes: ArrayBuffer): string {
	const entries = readZip(bytes);
	switch (kindOf(name)) {
		case "document":
			return docxToHtml(entries);
		case "sheet":
			return workbookToText(entries);
		case "presentation":
			return pptxToText(entries);
		default:
			throw new UnsupportedOfficeFileError(`No reader for ${name}`);
	}
}

const UNSUPPORTED_CHANGES = new Set([
	"w:moveFrom",
	"w:moveTo",
	"w:rPrChange",
	"w:pPrChange",
	"w:sectPrChange",
	"w:tblPrChange",
	"w:tblPrExChange",
	"w:tblGridChange",
	"w:trPrChange",
	"w:tcPrChange",
	"w:numberingChange",
	"w:cellIns",
	"w:cellDel",
	"w:cellMerge",
]);

/** Where the editor reads a `w:ins` or `w:del` as a suggestion. */
const SUGGESTION_PARENTS = new Set([
	"w:p",
	"w:hyperlink",
	"w:smartTag",
	"w:ins",
	"w:del",
]);

function unsupportedIn(node: XmlElement, parent: XmlElement | null): boolean {
	if (UNSUPPORTED_CHANGES.has(node.name)) {
		return true;
	}
	if (node.name === "w:ins" || node.name === "w:del") {
		const paragraphMark = parent?.name === "w:rPr";
		if (!(paragraphMark || SUGGESTION_PARENTS.has(parent?.name ?? ""))) {
			return true;
		}
	}
	return node.children.some(
		(child) => isElement(child) && unsupportedIn(child, node),
	);
}

/**
 * Whether a `.docx` holds tracked changes the editor cannot keep: moves,
 * formatting changes, table row and cell changes. Its first save would
 * accept them all, so such a file opens read-only. Insertions and
 * deletions of text and of paragraph marks are suggestions the editor reads
 * and writes back.
 */
export function hasUnsupportedChanges(
	name: string,
	bytes: ArrayBuffer,
): boolean {
	if (officeKindForName(name) !== "document") {
		return false;
	}
	const xml = documentXml(readZip(bytes));
	if (
		!/<w:(ins|del|moveFrom|moveTo|cellIns|cellDel|cellMerge|\w+Change)[\s>/]/.test(
			xml,
		)
	) {
		return false;
	}
	return unsupportedIn(parseXml(xml).root, null);
}

/** The edited text applied to the original file, as its new bytes. */
export function textToOffice(
	name: string,
	bytes: ArrayBuffer,
	content: string,
): Buffer {
	const entries = readZip(bytes);
	switch (kindOf(name)) {
		case "document":
			htmlToDocx(entries, content);
			break;
		case "sheet":
			workbookFromText(entries, content);
			break;
		case "presentation":
			textToPptx(entries, content);
			break;
		default:
			throw new UnsupportedOfficeFileError(`No writer for ${name}`);
	}
	return writeZip(entries);
}
