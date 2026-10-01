import { api } from "#lib/api/index.js";
import { baseName, type ExportFormat } from "#lib/documents.js";
import { m } from "#lib/paraglide/messages.js";

/** A format as a menu entry names it. */
export function exportLabel(format: ExportFormat): string {
	const labels: Record<ExportFormat, () => string> = {
		pdf: m.office_export_pdf,
		docx: m.office_export_docx,
		html: m.office_export_html,
		md: m.office_export_md,
		txt: m.office_export_txt,
		xlsx: m.office_export_xlsx,
		csv: m.office_export_csv,
		pptx: m.office_export_pptx,
	};
	return labels[format]();
}

/** Hands a blob to the browser's download manager. */
function saveBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.append(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

/** The server's reason for a refusal ("" when it gave none). */
function reason(error: unknown): string {
	return (error as { message?: string } | undefined)?.message ?? "";
}

/**
 * Download a file's saved bytes in another format, converted by the server.
 * Resolves to null once the browser has the file, or to the server's reason
 * ("" when it gave none) when it refused.
 */
export async function downloadExport(
	fileId: string,
	name: string,
	format: ExportFormat,
): Promise<string | null> {
	const answer = await api
		.GET("/api/v1/storage/file/{id}/export", {
			params: { path: { id: fileId }, query: { format } },
			parseAs: "blob",
		})
		.catch(() => null);
	if (!answer?.data) {
		return reason(answer?.error);
	}
	saveBlob(answer.data, `${baseName(name)}.${format}`);
	return null;
}

/** Download the file as it is saved; same answer as `downloadExport`. */
export async function downloadOriginal(
	fileId: string,
	name: string,
): Promise<string | null> {
	const answer = await api
		.GET("/api/v1/storage/file/{id}", {
			params: { path: { id: fileId }, query: { raw: "true" } },
			parseAs: "blob",
		})
		.catch(() => null);
	if (!answer?.data) {
		return reason(answer?.error);
	}
	saveBlob(answer.data as unknown as Blob, name);
	return null;
}
