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
