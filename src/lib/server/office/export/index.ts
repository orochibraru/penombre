import {
	baseName,
	EXPORT_FORMATS,
	type ExportFormat,
	kindForName,
	officeKindForName,
	parseCsv,
	toCsv,
} from "#lib/documents.js";
import type { SheetSource } from "#lib/formula.js";
import { blankWorkbook } from "../blank";
import { blankDocument } from "../docx-package";
import { docxToHtml } from "../docx-read";
import { htmlToDocx } from "../docx-write";
import { readWorkbook, workbookFromText } from "../xlsx";
import { readZip, writeZip } from "../zip";
import { readHtml } from "./model";
import { renderPdf } from "./pdf";
import { documentPdf } from "./pdf-document";
import { sheetsPdf, shownValues } from "./sheet-pdf";
import { exportSlides } from "./slides";
import { toHtmlPage, toMarkdown, toText } from "./text";

export { SheetTooLargeError } from "./sheet-pdf";
export { ExportUnavailableError } from "./slides";

/**
 * A document, sheet or presentation in another format, from its saved bytes.
 * A format that is the file's own is its bytes, untouched.
 */

const OOXML = "application/vnd.openxmlformats-officedocument";

export const EXPORT_TYPES: Record<ExportFormat, string> = {
	pdf: "application/pdf",
	docx: `${OOXML}.wordprocessingml.document`,
	html: "text/html; charset=utf-8",
	md: "text/markdown; charset=utf-8",
	txt: "text/plain; charset=utf-8",
	xlsx: `${OOXML}.spreadsheetml.sheet`,
	csv: "text/csv; charset=utf-8",
	pptx: `${OOXML}.presentationml.presentation`,
};

export class ExportFormatError extends Error {}

export interface Exported {
	data: Uint8Array;
	contentType: string;
	filename: string;
}

const encode = (text: string) => new TextEncoder().encode(text);
const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase();

function exportDocument(
	name: string,
	bytes: ArrayBuffer,
	format: ExportFormat,
): Uint8Array | Promise<Uint8Array> {
	const html = officeKindForName(name)
		? docxToHtml(readZip(bytes))
		: new TextDecoder().decode(bytes);
	if (format === "docx") {
		const entries = blankDocument();
		htmlToDocx(entries, html);
		return writeZip(entries);
	}
	const blocks = readHtml(html);
	const title = baseName(name);
	switch (format) {
		case "pdf":
			return renderPdf(documentPdf(blocks, title));
		case "html":
			return encode(toHtmlPage(blocks, title));
		case "md":
			return encode(toMarkdown(blocks));
		default:
			return encode(toText(blocks));
	}
}

function exportSheet(
	name: string,
	bytes: ArrayBuffer,
	format: ExportFormat,
): Uint8Array | Promise<Uint8Array> {
	const office = officeKindForName(name) !== null;
	const text = office ? "" : new TextDecoder().decode(bytes);
	if (format === "xlsx") {
		const entries = blankWorkbook();
		workbookFromText(entries, text);
		return writeZip(entries);
	}
	const sheets: SheetSource[] = office
		? readWorkbook(readZip(bytes))
		: [{ name: "Sheet1", rows: parseCsv(text) }];
	if (format === "csv") {
		return encode(toCsv(shownValues(sheets, 1)[0] ?? []));
	}
	return renderPdf(sheetsPdf(sheets, baseName(name)));
}

export async function exportFile(
	name: string,
	bytes: ArrayBuffer,
	format: ExportFormat,
): Promise<Exported> {
	const kind = kindForName(name);
	const formats: readonly string[] = kind ? EXPORT_FORMATS[kind] : [];
	if (!(kind && formats.includes(format))) {
		throw new ExportFormatError(`${name} cannot be exported as ${format}`);
	}
	let data: Uint8Array;
	// A legacy `.html` is the editor's fragment; as a page it gets a head.
	if (extensionOf(name) === format && format !== "html") {
		data = new Uint8Array(bytes);
	} else if (kind === "document") {
		data = await exportDocument(name, bytes, format);
	} else if (kind === "sheet") {
		data = await exportSheet(name, bytes, format);
	} else {
		data = await exportSlides(format as "pdf" | "pptx", name, bytes);
	}
	return {
		data,
		contentType: EXPORT_TYPES[format],
		filename: `${baseName(name)}.${format}`,
	};
}
