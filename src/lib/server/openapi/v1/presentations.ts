import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";
import { TEMPLATE_IDS } from "#lib/slides/templates/index.js";

const location = {
	drive: z.string().optional(),
	volume: z.string().optional(),
	share: z.string().optional(),
};

export const createPresentation = defineRoute({
	method: "post",
	path: "/api/v1/documents/presentation",
	summary: "Create a presentation from a template",
	description:
		"Writes a new .pptx built on one of the slide editor's templates — its " +
		"theme, master and eleven layouts — with a title slide carrying the " +
		"name, and answers with the new file's id.",
	tags: ["Documents"],
	query: z.object(location),
	body: z.object({
		template: z.enum(TEMPLATE_IDS as [string, ...string[]]),
		name: z.string().trim().min(1).max(200).describe("Without the extension"),
		folder: z.string().optional().describe("Folder path; the root when absent"),
	}),
	response: z.object({ id: z.string(), name: z.string() }),
	errors: [400, 500],
	service: storageServiceFor,
});

export const presentationMedia = defineRoute({
	method: "get",
	path: "/api/v1/documents/presentation/{id}/media",
	summary: "A picture inside a presentation",
	description:
		"Serves one media part of a .pptx (`ppt/media/…`), so the slide editor " +
		"can show the pictures a deck carries without downloading all of it.",
	tags: ["Documents"],
	params: z.object({ id: z.string() }),
	query: z.object({ ...location, part: z.string() }),
	response: z.any().describe("The picture's bytes"),
	errors: [400, 404],
	service: storageServiceFor,
});
