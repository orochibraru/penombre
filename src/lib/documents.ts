import { api } from "$lib/api";

/**
 * The document types Penombre can create and edit in the browser.
 *
 * Every one stores a **portable format** rather than a private one: an HTML
 * document, a CSV sheet, a Markdown deck. Somebody who stops using Penombre
 * keeps files that other software already opens, and the drive stays a folder
 * of ordinary files rather than a database with an export button.
 */
export type DocumentKind = "document" | "sheet" | "presentation";

interface KindSpec {
	extension: string;
	contentType: string;
	/** What a brand-new file of this kind contains. */
	initial: (title: string) => string;
}

/** Slides are separated the way every Markdown deck tool separates them. */
export const SLIDE_SEPARATOR = "\n\n---\n\n";

export const DOCUMENT_KINDS: Record<DocumentKind, KindSpec> = {
	document: {
		extension: "html",
		contentType: "text/html",
		initial: (title) => `<h1>${escapeHtml(title)}</h1>\n<p></p>\n`,
	},
	sheet: {
		extension: "csv",
		contentType: "text/csv",
		// Three empty columns so the grid opens with something to click.
		initial: () => ",,\n,,\n,,\n",
	},
	presentation: {
		extension: "md",
		contentType: "text/markdown",
		initial: (title) => `# ${title}${SLIDE_SEPARATOR}## Next slide\n`,
	},
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/** Which editor a file opens in, or null when it is not an editable document. */
export function kindForName(name: string): DocumentKind | null {
	const extension = name.split(".").pop()?.toLowerCase();
	switch (extension) {
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
 * Create an empty document and return its file id.
 *
 * Two calls on purpose: the API models a file as metadata first and bytes
 * second, and reusing that path means a document behaves like any uploaded
 * file everywhere else — trash, sharing, search, thumbnails.
 */
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

/** Replace a document's contents with `content`. */
export async function saveDocument(
	fileId: string,
	filename: string,
	contentType: string,
	content: string,
): Promise<boolean> {
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

/**
 * Read one field starting at `start`.
 *
 * Returns the value and the index just past it, so the caller only has to
 * decide what the delimiter it stopped on means.
 */
function readField(text: string, start: number): [string, number] {
	if (text[start] !== '"') {
		let end = start;
		while (end < text.length && !",\n\r".includes(text[end] ?? "")) {
			end++;
		}
		return [text.slice(start, end), end];
	}

	// Quoted: commas and newlines are literal, and "" is an escaped quote.
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

/**
 * Parse CSV into a grid.
 *
 * Deliberately small but correct on the things that actually break naive
 * splitting: quoted fields containing commas, newlines and escaped quotes.
 */
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

	// A trailing newline leaves nothing worth keeping; anything else is a row.
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
