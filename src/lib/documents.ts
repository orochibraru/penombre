import { api } from "$lib/api";

/** Editable document types. Each stores a portable format, not a private one. */
export type DocumentKind = "document" | "sheet" | "presentation";

interface KindSpec {
	extension: string;
	contentType: string;
	/**
	 * Identity colour, as a Tailwind text utility. The three editable kinds are
	 * told apart by colour everywhere they appear — icon, menu, editor — so the
	 * mapping lives here rather than being re-picked per component.
	 */
	color: string;
	/** What a brand-new file of this kind contains. */
	initial: (title: string) => string;
}

/** The separator every Markdown deck tool uses. */
export const SLIDE_SEPARATOR = "\n\n---\n\n";

export const DOCUMENT_KINDS: Record<DocumentKind, KindSpec> = {
	document: {
		extension: "html",
		contentType: "text/html",
		color: "text-blue-500",
		initial: (title) => `<h1>${escapeHtml(title)}</h1>\n<p></p>\n`,
	},
	sheet: {
		extension: "csv",
		contentType: "text/csv",
		color: "text-green-500",
		// Three empty columns so the grid opens with something to click.
		initial: () => ",,\n,,\n,,\n",
	},
	presentation: {
		extension: "md",
		contentType: "text/markdown",
		color: "text-orange-500",
		initial: (title) => `# ${title}${SLIDE_SEPARATOR}## Next slide\n`,
	},
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/** The extension of a file name, lowercased, or "" when it has none. */
function extensionOf(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * Which editor a file opens in, or null when it is not one of the three
 * kinds Penombre stores natively. This is the "is it one of ours" question —
 * the icon and the colour follow from it — not "can it be edited".
 */
export function kindForName(name: string): DocumentKind | null {
	switch (extensionOf(name)) {
		case "html":
		case "htm":
			return "document";
		case "csv":
			return "sheet";
		case "md":
		case "markdown":
			return "presentation";
		default:
			return null;
	}
}

/**
 * Office formats that open in the same three editors. They are converted on
 * the way in and written back into the original file on the way out — see
 * `$lib/server/office` — so they stay Word, Excel and PowerPoint files and
 * keep their own icons in a listing.
 */
export const OFFICE_KINDS: Record<string, DocumentKind> = {
	docx: "document",
	xlsx: "sheet",
	pptx: "presentation",
};

export function officeKindForName(name: string): DocumentKind | null {
	return OFFICE_KINDS[extensionOf(name)] ?? null;
}

/** Whether a file opens in an editor at all, native or converted. */
export function editorKindForName(name: string): DocumentKind | null {
	return kindForName(name) ?? officeKindForName(name);
}

/** Identity colour of the document a file is, or null when it is not one. */
export function documentColor(name: string): string | null {
	const kind = kindForName(name);
	return kind ? DOCUMENT_KINDS[kind].color : null;
}

/** Create an empty document, returning its file id. */
export async function createDocument(
	kind: DocumentKind,
	title: string,
	folder?: string,
): Promise<string | null> {
	const spec = DOCUMENT_KINDS[kind];
	const filename = `${title}.${spec.extension}`;
	const content = spec.initial(title);

	const created = await api.POST("/api/v1/storage/file", {
		params: { query: folder ? { folder } : {} },
		body: { name: filename, size: new Blob([content]).size },
	});
	const id = created.data?.data?.id;
	if (created.error || !id) {
		return null;
	}

	const form = new FormData();
	form.set("file", new File([content], filename, { type: spec.contentType }));
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
 * Replace a document's contents with `content`.
 *
 * A native document is uploaded whole, because the text *is* the file. An
 * Office file is not: the server has to splice the text into the archive it
 * already has, so only the text is sent and the browser never assembles a
 * `.docx` it could get wrong.
 */
export async function saveDocument(
	fileId: string,
	filename: string,
	contentType: string,
	content: string,
): Promise<boolean> {
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
		params: { path: { id: fileId } },
		body: form as never,
	});
	return !error;
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

/** Split a Markdown deck into slides. */
export function parseSlides(text: string): string[] {
	const slides = text
		.split(/^\s*---\s*$/m)
		.map((slide) => slide.trim())
		.filter((slide, _index, all) => slide !== "" || all.length === 1);
	return slides.length > 0 ? slides : [""];
}

export function toDeck(slides: string[]): string {
	return `${slides.map((slide) => slide.trim()).join(SLIDE_SEPARATOR)}\n`;
}
