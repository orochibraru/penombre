import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { driveQuery } from "#lib/server/openapi/v1/storage.js";
import { uploadResultSchema } from "#lib/server/schema.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

export const createDocumentFile = defineRoute({
	method: "post",
	path: "/api/v1/documents",
	summary: "Create a document or spreadsheet",
	description:
		"Creates an empty Word document (`.docx`, A4) or Excel workbook " +
		"(`.xlsx`, one sheet) in `folder`, built on the server. `name` is " +
		"given without its extension; a name already taken gets a ` (1)` " +
		"suffix, as any new file does.",
	tags: ["Documents"],
	query: z.object({ ...driveQuery, folder: z.string().optional() }),
	body: z.object({
		kind: z.enum(["document", "sheet"]),
		name: z.string().trim().min(1).max(200).optional(),
	}),
	response: uploadResultSchema,
	errors: [400, 403, 404, 500],
	service: storageServiceFor,
});

export const exportFormatSchema = z.enum([
	"pdf",
	"docx",
	"html",
	"md",
	"txt",
	"xlsx",
	"csv",
	"pptx",
]);

export const exportFile = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/{id}/export",
	summary: "Export a document, sheet or presentation",
	description:
		"The file's saved bytes in another format, as an attachment. A " +
		"document (`.docx`, `.html`) exports as `pdf`, `docx`, `html`, `md` " +
		"or `txt`; a sheet (`.xlsx`, `.csv`) as `xlsx`, `csv` (its first " +
		"sheet, as shown) or `pdf` (every sheet); a presentation as `pptx` " +
		"or `pdf`. The file's own format is its bytes unchanged. 501 for an " +
		"export this server cannot produce yet.",
	tags: ["Documents"],
	params: z.object({ id: z.string() }),
	query: z.object({ ...driveQuery, format: exportFormatSchema }),
	response: z.any().describe("The exported file"),
	errors: [400, 404, 422, 501],
	service: storageServiceFor,
});
