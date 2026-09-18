import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/**
 * File note route definitions.
 * Importing this module registers all note routes with the OpenAPI registry.
 *
 * Every one of them carries `drive`/`volume`, and reaches the file through the
 * service those build: a note is only readable by someone who can reach the
 * file, and in a shared drive that is a member, not the file's owner.
 */

const driveQuery = {
	drive: z.string().optional(),
	volume: z.string().optional(),
	share: z.string().optional(),
};

export const noteSchema = z.object({
	id: z.string(),
	fileId: z.string(),
	userId: z.string(),
	authorName: z.string().nullable(),
	body: z.string(),
	/** Seconds into an audio or video track; null means the file as a whole. */
	timestampSeconds: z.number().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const listNotes = defineRoute({
	method: "get",
	path: "/api/v1/files/{fileId}/notes",
	summary: "List notes on a file",
	tags: ["Notes"],
	params: z.object({ fileId: z.string() }),
	query: z.object(driveQuery),
	response: z.array(noteSchema),
	errors: [404, 500],
	service: storageServiceFor,
});

export const createNote = defineRoute({
	method: "post",
	path: "/api/v1/files/{fileId}/notes",
	summary: "Attach a note to a file",
	description:
		"A timestamp marks the note as a comment on a moment in an audio or video file.",
	tags: ["Notes"],
	params: z.object({ fileId: z.string() }),
	query: z.object(driveQuery),
	body: z.object({
		body: z.string().min(1).max(4000),
		timestampSeconds: z.number().min(0).nullable().optional(),
	}),
	response: noteSchema,
	errors: [400, 404, 500],
	service: storageServiceFor,
});

export const updateNote = defineRoute({
	method: "patch",
	path: "/api/v1/files/{fileId}/notes/{noteId}",
	summary: "Edit your own note",
	tags: ["Notes"],
	params: z.object({ fileId: z.string(), noteId: z.string() }),
	body: z.object({ body: z.string().min(1).max(4000) }),
	response: noteSchema,
	errors: [400, 403, 404, 500],
});

export const deleteNote = defineRoute({
	method: "delete",
	path: "/api/v1/files/{fileId}/notes/{noteId}",
	summary: "Delete your own note",
	tags: ["Notes"],
	params: z.object({ fileId: z.string(), noteId: z.string() }),
	response: z.object({ deleted: z.boolean() }),
	errors: [403, 404, 500],
});
