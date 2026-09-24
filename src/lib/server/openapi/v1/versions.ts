import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/**
 * File version and folder settings route definitions. Every route reaches its
 * file or folder through `storageServiceFor`, so drive, volume and share
 * scoping apply as they do to any storage route.
 */

const driveQuery = {
	drive: z.string().optional(),
	volume: z.string().optional(),
	share: z.string().optional(),
};

export const versionSchema = z.object({
	id: z.string(),
	/** Stable per file: pruning the oldest never renumbers the rest. */
	seq: z.number(),
	size: z.number(),
	contentType: z.string(),
	/** The file it came from, when merged in from a separate file. */
	name: z.string().nullable(),
	authorName: z.string().nullable(),
	createdAt: z.iso.datetime(),
});

const versioningSchema = z.object({
	enabled: z.boolean(),
	max: z.number(),
});

export const versionListSchema = z.object({
	/** The current bytes, labelled `v{nextSeq}` in sequential naming. */
	current: z.object({
		size: z.number(),
		updatedAt: z.iso.datetime(),
		nextSeq: z.number(),
	}),
	versions: z.array(versionSchema),
	versioning: versioningSchema,
});

const fileVersionParams = z.object({ id: z.string(), versionId: z.string() });

export const listFileVersions = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/{id}/versions",
	summary: "List a file's versions",
	tags: ["Storage - Versions"],
	params: z.object({ id: z.string() }),
	query: z.object(driveQuery),
	response: versionListSchema,
	errors: [404, 500],
	service: storageServiceFor,
});

export const createFileVersion = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/versions",
	summary: "Keep the current bytes as a version",
	tags: ["Storage - Versions"],
	params: z.object({ id: z.string() }),
	query: z.object(driveQuery),
	response: versionSchema,
	errors: [403, 404, 500],
	service: storageServiceFor,
});

export const mergeFileVersions = defineRoute({
	method: "post",
	path: "/api/v1/storage/versions/merge",
	summary: "Merge files into one file's versions",
	description:
		"`ids` are oldest first: the last stays, every other one becomes one of " +
		"its versions in that order, keeping its name and date, and is deleted. " +
		"Its notes move to the kept file. 409 when a merged file already has " +
		"versions or the folder keeps fewer versions than the merge would make.",
	tags: ["Storage - Versions"],
	query: z.object(driveQuery),
	body: z.object({
		/** Oldest first; the last one stays. */
		ids: z.array(z.string()).min(2).max(1000),
		/** Renames the kept file; absent keeps its name. */
		name: z.string().trim().min(1).max(255).optional(),
	}),
	response: z.object({ id: z.string() }),
	errors: [403, 404, 409, 500],
	service: storageServiceFor,
});

export const restoreFileVersion = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/versions/{versionId}/restore",
	summary: "Restore a version",
	description:
		"The current bytes are kept as a new version first, so a restore " +
		"never loses anything. The restored version stays listed.",
	tags: ["Storage - Versions"],
	params: fileVersionParams,
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [403, 404, 500],
	service: storageServiceFor,
});

export const deleteFileVersion = defineRoute({
	method: "delete",
	path: "/api/v1/storage/file/{id}/versions/{versionId}",
	summary: "Delete a version",
	tags: ["Storage - Versions"],
	params: fileVersionParams,
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [403, 404, 500],
	service: storageServiceFor,
});

export const downloadFileVersion = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/{id}/versions/{versionId}/raw",
	summary: "Download a version",
	description:
		"The version's bytes, with Range support. Served inline so it can be " +
		"previewed; `download=1` asks for an attachment.",
	tags: ["Storage - Versions"],
	params: fileVersionParams,
	query: z.object({ ...driveQuery, download: z.enum(["1"]).optional() }),
	response: z.any(),
	errors: [404, 500],
	service: storageServiceFor,
});

export const getFileVersionThumbnail = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/{id}/versions/{versionId}/thumbnail",
	summary: "A version's thumbnail",
	description:
		"A webp thumbnail, or JSON waveform peaks for audio. 404 when the " +
		"version's type has no preview; never the bytes themselves.",
	tags: ["Storage - Versions"],
	params: fileVersionParams,
	query: z.object({
		...driveQuery,
		size: z.enum(["small", "medium", "large"]).optional(),
	}),
	response: z.any(),
	errors: [404, 500],
	service: storageServiceFor,
});

export const folderSettingsSchema = z.object({
	versioning: z.boolean().optional(),
	maxVersions: z.number().int().min(1).max(1000).optional(),
});

export const getFolderSettings = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/{path}/settings",
	summary: "Get a folder's settings",
	description:
		"`path` is the folder's id or its path. Returns what the folder sets, what applies " +
		"inside it, and what it would inherit if it set nothing.",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	query: z.object(driveQuery),
	response: z.object({
		settings: folderSettingsSchema,
		effective: versioningSchema,
		inherited: versioningSchema,
		adminEnabled: z.boolean(),
		adminMax: z.number(),
	}),
	errors: [404, 500],
	service: storageServiceFor,
});

export const updateFolderSettings = defineRoute({
	method: "put",
	path: "/api/v1/storage/folder/{path}/settings",
	summary: "Save a folder's settings",
	description: "An absent key inherits from the nearest ancestor that sets it.",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	query: z.object(driveQuery),
	body: folderSettingsSchema,
	response: z.object({ message: z.string() }),
	errors: [403, 404, 500],
	service: storageServiceFor,
});
