import {
	type DocumentKind,
	officeKindForName,
	parseCsv,
	toCsv,
} from "#lib/documents.js";
import { docxToHtml } from "./docx-read";
import { htmlToDocx } from "./docx-write";
import { markdownToPptx, pptxToMarkdown } from "./pptx";
import { readSheet, writeSheet } from "./xlsx";
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

/** The file's text, in the format the editor for its kind reads. */
export function officeToText(name: string, bytes: ArrayBuffer): string {
	const entries = readZip(bytes);
	switch (kindOf(name)) {
		case "document":
			return docxToHtml(entries);
		case "sheet":
			return toCsv(readSheet(entries).rows);
		case "presentation":
			return pptxToMarkdown(entries);
		default:
			throw new UnsupportedOfficeFileError(`No reader for ${name}`);
	}
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
			writeSheet(entries, parseCsv(content));
			break;
		case "presentation":
			markdownToPptx(entries, content);
			break;
		default:
			throw new UnsupportedOfficeFileError(`No writer for ${name}`);
	}
	return writeZip(entries);
}
