import { api } from "#lib/api/index.js";
import { type DocumentKind, officeKindForName } from "#lib/documents.js";

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
