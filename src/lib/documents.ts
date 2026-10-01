import { api } from "#lib/api/index.js";
import { readSlide, SLIDE_SEPARATOR, slideTexts } from "#lib/deck/format.js";

export { SLIDE_SEPARATOR };

/** Editable document types. Each stores a portable format, not a private one. */
export type DocumentKind = "document" | "sheet" | "presentation";

interface KindSpec {
	/** The format **New** creates. */
	extension: string;
	/**
	 * Identity colour, as a Tailwind text utility. The three editable kinds are
	 * told apart by colour everywhere they appear — icon, menu, editor — so the
	 * mapping lives here rather than being re-picked per component.
	 */
	color: string;
}

export const DOCUMENT_KINDS: Record<DocumentKind, KindSpec> = {
	document: { extension: "docx", color: "text-blue-500" },
	sheet: { extension: "xlsx", color: "text-green-500" },
	presentation: { extension: "pptx", color: "text-orange-500" },
};

/** The extension of a file name, lowercased, or "" when it has none. */
function extensionOf(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

const KINDS: Record<string, DocumentKind> = {
	docx: "document",
	html: "document",
	htm: "document",
	xlsx: "sheet",
	csv: "sheet",
	pptx: "presentation",
	md: "presentation",
	markdown: "presentation",
};

/**
 * Which of the three kinds a file is, or null. A `.docx` Penombre made and
 * one uploaded from Word are the same thing, so both carry the document's
 * colour and icon; `.html`, `.csv` and `.md` are the older native formats,
 * still opened as they always were.
 */
export function kindForName(name: string): DocumentKind | null {
	return KINDS[extensionOf(name)] ?? null;
}

/**
 * The kinds stored as Office packages. They are converted on the way in and
 * written back into the original file on the way out — see
 * `#lib/server/office/index.js` — so they stay Word, Excel and PowerPoint
 * files.
 */
export const OFFICE_KINDS: Record<string, DocumentKind> = {
	docx: "document",
	xlsx: "sheet",
	pptx: "presentation",
};

export function officeKindForName(name: string): DocumentKind | null {
	return OFFICE_KINDS[extensionOf(name)] ?? null;
}

/** Whether a file opens in an editor at all: every kind does. */
export function editorKindForName(name: string): DocumentKind | null {
	return kindForName(name);
}

/** Identity colour of the document a file is, or null when it is not one. */
export function documentColor(name: string): string | null {
	const kind = kindForName(name);
	return kind ? DOCUMENT_KINDS[kind].color : null;
}

/**
 * Create an empty document, returning its file id. A document or a sheet is
 * built by the server as a `.docx` or `.xlsx`, so its bytes never make the
 * round trip through the browser.
 */
/** A presentation starts from a template instead: `new-presentation-dialog`. */
export async function createDocument(
	kind: Exclude<DocumentKind, "presentation">,
	title: string,
	folder?: string,
): Promise<string | null> {
	const { data, error } = await api.POST("/api/v1/documents", {
		params: { query: folder ? { folder } : {} },
		body: { kind, name: title },
	});
	return error ? null : (data?.data?.id ?? null);
}

/** Create a file holding `content`, returning its id. */
export async function createTextFile(
	filename: string,
	content: string,
	contentType = "text/plain",
	folder?: string,
): Promise<string | null> {
	const created = await api.POST("/api/v1/storage/file", {
		params: { query: folder ? { folder } : {} },
		body: { name: filename, size: new Blob([content]).size },
	});
	const id = created.data?.data?.id;
	if (created.error || !id) {
		return null;
	}

	// Uploaded even when empty: the editor opens bytes, not a row.
	const form = new FormData();
	form.set("file", new File([content], filename, { type: contentType }));
	const uploaded = await api.POST("/api/v1/storage/file/{id}/upload", {
		params: { path: { id } },
		body: form as never,
	});
	if (uploaded.error) {
		return null;
	}
	return id;
}

/**
 * The title a document carries inside it: the `<h1>` of a document, the
 * heading of a deck's first slide. A sheet has none: a grid's first cell is
 * a value, not a name.
 */
export function titleFromContent(
	kind: DocumentKind | null,
	content: string,
): string | null {
	let raw: string | undefined;
	if (kind === "document") {
		raw = headingText(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(content)?.[1] ?? "");
	} else if (kind === "presentation") {
		raw = /^\s{0,3}#{1,6}\s+(.+)$/m.exec(parseSlides(content)[0] ?? "")?.[1];
	}
	return raw ? sanitizeName(raw) || null : null;
}

/** Longer than this and the name stops being readable in a file list. */
const NAME_MAX = 120;

/** Strip whatever a title may contain that a file name may not. */
function sanitizeName(title: string): string {
	return title
		.replace(/[\p{Cc}\\/:*?"<>|]/gu, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, NAME_MAX)
		.replace(/[\s.]+$/, "");
}

/**
 * The text of an HTML heading. Tags are dropped by splitting on `<` rather
 * than matching them, so a malformed one cannot leave a `<` behind, and the
 * bracket entities decode to spaces rather than reintroducing one.
 */
function headingText(html: string): string {
	const parts = html.split("<");
	return parts
		.map((part, index) =>
			index === 0 ? part : part.slice(part.indexOf(">") + 1),
		)
		.join("")
		.replace(/&(?:lt|gt|nbsp);/g, " ")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, "&");
}

/** The part of a file name before its extension. */
export function baseName(filename: string): string {
	const dot = filename.lastIndexOf(".");
	return dot > 0 ? filename.slice(0, dot) : filename;
}

/**
 * Rename a document's file to `title`, keeping its extension. Returns the new
 * name, or null when the rename failed.
 */
export async function renameDocument(
	fileId: string,
	currentName: string,
	title: string,
): Promise<string | null> {
	const dot = currentName.lastIndexOf(".");
	const name = dot > 0 ? `${title}${currentName.slice(dot)}` : title;
	if (name === currentName) {
		return currentName;
	}
	const { error } = await api.PUT("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
		body: { key: name },
	});
	return error ? null : name;
}

/**
 * Replace a document's contents with `content`. Never a version: an editor
 * saves every few seconds, and a version is kept only when asked for.
 *
 * A native document is uploaded whole, because the text *is* the file. An
 * Office file is not: the server has to splice the text into the archive it
 * already has, so only the text is sent and the browser never assembles a
 * `.docx` it could get wrong.
 */
export async function saveDocument(
	file: { id: string; name: string; contentType: string },
	content: string,
): Promise<boolean> {
	const { id: fileId, name: filename, contentType } = file;
	if (officeKindForName(filename)) {
		const { error } = await api.POST("/api/v1/storage/file/{id}/office", {
			params: { path: { id: fileId } },
			body: { content },
		});
		return !error;
	}

	const form = new FormData();
	form.set("file", new File([content], filename, { type: contentType }));
	const { error } = await api.POST("/api/v1/storage/file/{id}/upload", {
		params: { path: { id: fileId }, query: { snapshot: "0" } },
		body: form as never,
	});
	return !error;
}

/** What each kind exports as, in menu order. The server reads this too. */
export const EXPORT_FORMATS = {
	document: ["pdf", "docx", "html", "md", "txt"],
	sheet: ["xlsx", "csv", "pdf"],
	presentation: ["pptx", "pdf"],
} as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[DocumentKind][number];

/** What a file can be exported as: a Markdown deck has no slide renderer. */
export function exportFormatsFor(name: string): readonly ExportFormat[] {
	const kind = kindForName(name);
	if (!kind || (kind === "presentation" && !officeKindForName(name))) {
		return [];
	}
	return EXPORT_FORMATS[kind];
}

// =========================================================================
// CSV
// =========================================================================

/** Read one field; returns its value and the index just past it. */
function readField(text: string, start: number): [string, number] {
	if (text[start] !== '"') {
		let end = start;
		while (end < text.length && !",\n\r".includes(text[end] ?? "")) {
			end++;
		}
		return [text.slice(start, end), end];
	}

	let value = "";
	let i = start + 1;
	while (i < text.length) {
		if (text[i] === '"') {
			if (text[i + 1] === '"') {
				value += '"';
				i += 2;
				continue;
			}
			return [value, i + 1];
		}
		value += text[i];
		i++;
	}
	return [value, i];
}

/** Parse CSV, handling quoted commas, newlines and escaped quotes. */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let i = 0;

	while (i < text.length) {
		const [value, next] = readField(text, i);
		row.push(value);
		i = next;

		if (text[i] === ",") {
			i++;
			continue;
		}
		if (text[i] === "\n" || text[i] === "\r") {
			i += text.startsWith("\r\n", i) ? 2 : 1;
			rows.push(row);
			row = [];
			continue;
		}
		break;
	}

	if (row.length > 0) {
		rows.push(row);
	}

	return rows.length > 0 ? rows : [[""]];
}

/** Serialise a grid back to CSV, quoting only what needs it. */
export function toCsv(rows: string[][]): string {
	return `${rows
		.map((row) =>
			row
				.map((cell) =>
					/[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell,
				)
				.join(","),
		)
		.join("\n")}\n`;
}

// =========================================================================
// Slides
// =========================================================================

/**
 * Each slide's Markdown, without its notes and directives. Front matter is
 * not a slide, and a ruler inside fenced code does not split one.
 */
export function parseSlides(text: string): string[] {
	return slideTexts(text).map((slide) => readSlide(slide).body);
}

export function toDeck(slides: string[]): string {
	return `${slides.map((slide) => slide.trim()).join(SLIDE_SEPARATOR)}\n`;
}
