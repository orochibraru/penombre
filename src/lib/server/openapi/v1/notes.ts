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

/** Where a comment on an office file points. */
export const anchorSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("text"),
		quote: z.string().min(1).max(2000),
		prefix: z.string().max(64),
		suffix: z.string().max(64),
		offset: z.number().int().min(0),
	}),
	z.object({
		kind: z.literal("cell"),
		sheet: z.string().min(1).max(64),
		cell: z.string().regex(/^[A-Za-z]{1,3}[1-9]\d{0,6}$/),
	}),
	z.object({
		kind: z.literal("slide"),
		index: z.number().int().min(0),
		id: z.string().max(128).optional(),
	}),
]);

export const noteSchema = z.object({
	id: z.string(),
	fileId: z.string(),
	userId: z.string(),
	authorName: z.string().nullable(),
	body: z.string(),
	/** Seconds into an audio or video track; null means the file as a whole. */
	timestampSeconds: z.number().nullable(),
	/** What a comment points at in an office file; null for everything else. */
	anchor: anchorSchema.nullable(),
	/** The thread's first comment, for a reply. */
	parentId: z.string().nullable(),
	resolvedAt: z.iso.datetime().nullable(),
	resolvedByName: z.string().nullable(),
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
		"A timestamp marks the note as a comment on a moment in an audio or " +
		"video file; an anchor, on a passage, cell or slide of an office file. " +
		"`parentId` replies to a thread. Anyone who can open the file may " +
		"comment, read-only shares included.",
	tags: ["Notes"],
	params: z.object({ fileId: z.string() }),
	query: z.object(driveQuery),
	body: z.object({
		body: z.string().min(1).max(4000),
		timestampSeconds: z.number().min(0).nullable().optional(),
		anchor: anchorSchema.nullable().optional(),
		parentId: z.string().nullable().optional(),
	}),
	response: noteSchema,
	errors: [400, 404, 500],
	service: storageServiceFor,
});

export const updateNote = defineRoute({
	method: "patch",
	path: "/api/v1/files/{fileId}/notes/{noteId}",
	summary: "Edit your own note, or resolve a thread",
	description:
		"`body` changes your own note. `resolved` closes or reopens a " +
		"thread, which anyone who can open the file may do.",
	tags: ["Notes"],
	params: z.object({ fileId: z.string(), noteId: z.string() }),
	query: z.object(driveQuery),
	body: z.object({
		body: z.string().min(1).max(4000).optional(),
		resolved: z.boolean().optional(),
	}),
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
