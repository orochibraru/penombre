import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/** Who else has a file open. Reached like the notes: through the file. */

const driveQuery = {
	drive: z.string().optional(),
	volume: z.string().optional(),
	share: z.string().optional(),
};

export const presentSchema = z.object({
	userId: z.string(),
	name: z.string(),
	mode: z.enum(["viewing", "editing"]),
});

export const beatPresence = defineRoute({
	method: "post",
	path: "/api/v1/files/{fileId}/presence",
	summary: "Say you have a file open",
	description:
		"Call every 15 seconds while the file is on screen. Answers everyone " +
		"else seen on it in the last 40 seconds.",
	tags: ["Notes"],
	params: z.object({ fileId: z.string() }),
	query: z.object(driveQuery),
	body: z.object({ mode: z.enum(["viewing", "editing"]) }),
	response: z.array(presentSchema),
	errors: [404, 500],
	service: storageServiceFor,
});

export const leavePresence = defineRoute({
	method: "delete",
	path: "/api/v1/files/{fileId}/presence",
	summary: "Say you closed a file",
	tags: ["Notes"],
	params: z.object({ fileId: z.string() }),
	response: z.object({ left: z.boolean() }),
	errors: [500],
});
