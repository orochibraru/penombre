import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";

export const placesSchema = z.object({
	drives: z.array(
		z.object({ id: z.string(), name: z.string(), role: z.string() }),
	),
	volumes: z.array(
		z.object({ name: z.string(), label: z.string(), readOnly: z.boolean() }),
	),
	sharedWithMe: z.array(
		z.object({
			/** The grant's id: `?share=` on storage routes. */
			id: z.string(),
			resourceType: z.enum(["file", "folder"]),
			resourceId: z.string(),
			name: z.string(),
			category: z.string(),
			/** Where browsing starts, in the owner's tree: the folder, or a file's parent. */
			root: z.string(),
			ownerName: z.string(),
			permission: z.enum(["read", "write", "admin"]),
		}),
	),
	counts: z.object({ trash: z.number(), starred: z.number() }),
	simpleMode: z.boolean(),
	driveOnly: z.boolean(),
});

export const listPlaces = defineRoute({
	method: "get",
	path: "/api/v1/places",
	summary: "Everywhere you can browse",
	description:
		"Shared drives, mounted volumes and what others shared with you, plus the trash and starred counts: what the web sidebar lists, for clients without it.",
	tags: ["Storage"],
	response: placesSchema,
	errors: [500],
});
