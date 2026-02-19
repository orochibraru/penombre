import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";
import {
	folderItemSchema,
	newFileSchema,
	objectItemSchema,
	objectListSchema,
	updateFileSchema,
	uploadResultSchema,
} from "$lib/server/schema";

/**
 * Storage route definitions.
 * Importing this module registers all storage routes with the OpenAPI registry.
 * Route handlers in +server.ts files import these and call .handler().
 */

// ============================================================================
// LIST / BROWSE
// ============================================================================

export const listFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/list",
	summary: "List all files",
	description: "Returns a list of all files in the root directory",
	tags: ["Storage"],
	response: objectListSchema,
	errors: [500],
});

export const listFilesInFolder = defineRoute({
	method: "get",
	path: "/api/v1/storage/list/{path}",
	summary: "List files in folder",
	description: "Returns a list of files within a specific folder path",
	tags: ["Storage"],
	params: z.object({ path: z.string() }),
	response: objectListSchema,
	errors: [400, 500],
});

export const listRecentFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/list/recent",
	summary: "List recent files",
	description: "Returns a list of recently accessed or modified files",
	tags: ["Storage"],
	response: objectListSchema,
	errors: [500],
});

// ============================================================================
// FILES – CRUD
// ============================================================================

export const createFile = defineRoute({
	method: "post",
	path: "/api/v1/storage/file",
	summary: "Create a file",
	description: "Creates a new file entry (metadata only, no body yet)",
	tags: ["Storage - Files"],
	query: z.object({ folder: z.string().optional() }),
	body: newFileSchema,
	response: uploadResultSchema,
	errors: [400, 500],
});

export const createBatchFiles = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/batch",
	summary: "Create files in batch",
	description: "Creates multiple file entries at once (metadata only)",
	tags: ["Storage - Files"],
	query: z.object({ folder: z.string().optional() }),
	body: z.object({
		files: z.array(z.object({ name: z.string(), size: z.number() })),
	}),
	response: z.array(uploadResultSchema),
	errors: [400, 500],
});

export const searchFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/search",
	summary: "Search files",
	description: "Searches files by name",
	tags: ["Storage - Files"],
	query: z.object({
		q: z.string(),
		limit: z.string().optional(),
	}),
	response: objectListSchema,
	errors: [400, 500],
});

export const listTrashFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/trash",
	summary: "List trashed files",
	description: "Returns files currently in the trash",
	tags: ["Storage - Files"],
	response: objectListSchema,
	errors: [500],
});

export const listStarredFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/starred",
	summary: "List starred files",
	description: "Returns files marked as starred",
	tags: ["Storage - Files"],
	response: objectListSchema,
	errors: [500],
});

export const getFileCounts = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/counts",
	summary: "Get trash and starred counts",
	description: "Returns the count of trashed and starred items",
	tags: ["Storage - Files"],
	response: z.object({ trash: z.number(), starred: z.number() }),
	errors: [500],
});

export const listFilesByCategory = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/category/{category}",
	summary: "List files by category",
	description: "Returns files matching the specified category",
	tags: ["Storage - Files"],
	params: z.object({ category: z.string() }),
	response: objectListSchema,
	errors: [400, 500],
});

export const getFile = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/{id}",
	summary: "Get file metadata or raw content",
	description:
		"Returns file metadata as JSON. Pass raw=true or thumbnail=true for binary content.",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	query: z.object({
		raw: z.string().optional(),
		thumbnail: z.string().optional(),
		size: z.enum(["small", "medium", "large"]).optional(),
	}),
	response: objectItemSchema,
	errors: [404, 500],
});

export const uploadFile = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/upload",
	summary: "Upload file content",
	description:
		"Uploads or replaces the binary content of an existing file entry",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	body: z.object({
		file: z.any().describe("The file to upload"),
	}),
	isFormData: true,
	response: z.object({ message: z.string() }),
	errors: [400, 500],
});

export const moveFile = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/move",
	summary: "Move a file",
	description: "Moves a file to a different folder",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	body: z.object({ destination: z.string() }),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
});

export const duplicateFile = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/duplicate",
	summary: "Duplicate a file",
	description: "Creates a copy of the file in the same folder",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	response: objectItemSchema,
	errors: [404, 500],
});

export const updateFile = defineRoute({
	method: "put",
	path: "/api/v1/storage/file/{id}",
	summary: "Update file metadata",
	description: "Updates metadata fields on an existing file",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	query: z.object({ folder: z.string().optional() }),
	body: updateFileSchema,
	response: z.object({ message: z.string() }),
	errors: [404, 500],
});

export const deleteFile = defineRoute({
	method: "delete",
	path: "/api/v1/storage/file/{id}",
	summary: "Delete a file",
	description: "Permanently deletes a file",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
});

// ============================================================================
// FOLDERS – CRUD
// ============================================================================

export const listFolders = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder",
	summary: "List folders",
	description: "Returns a list of all folders for the current user",
	tags: ["Storage - Folders"],
	response: z.array(folderItemSchema),
	errors: [500],
});

export const createFolder = defineRoute({
	method: "post",
	path: "/api/v1/storage/folder",
	summary: "Create a folder",
	description: "Creates a new folder under an optional parent",
	tags: ["Storage - Folders"],
	body: z.object({
		name: z.string(),
		parent: z.string().optional(),
	}),
	response: z.object({
		message: z.string(),
		id: z.string(),
		name: z.string(),
	}),
	errors: [400, 500],
});

export const getFolderTree = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/tree",
	summary: "Get folder tree",
	description: "Returns all folders with metadata for building a folder picker",
	tags: ["Storage - Folders"],
	response: z.array(folderItemSchema),
	errors: [500],
});

export const listTrashedFolders = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/trash",
	summary: "List trashed folders",
	description: "Returns folders currently in the trash",
	tags: ["Storage - Folders"],
	response: z.array(folderItemSchema),
	errors: [500],
});

export const getFolderSizes = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/sizes/{prefix}",
	summary: "Get folder sizes by prefix",
	description: "Calculates sizes for all folders under a given prefix",
	tags: ["Storage - Folders"],
	params: z.object({ prefix: z.string() }),
	response: z.record(z.string(), z.number()),
	errors: [500],
});

export const getFolder = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/{path}",
	summary: "Get a folder",
	description: "Returns a folder by ID",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	response: folderItemSchema,
	errors: [404, 500],
});

export const updateFolder = defineRoute({
	method: "put",
	path: "/api/v1/storage/folder/{path}",
	summary: "Update folder metadata",
	description: "Updates metadata on a folder (trash, star, tags, name)",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	body: z.object({
		isTrashed: z.boolean().optional(),
		isStarred: z.boolean().optional(),
		tags: z.array(z.string()).optional(),
		name: z.string().optional(),
		parentFolderId: z.string().optional(),
	}),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
});

export const deleteFolder = defineRoute({
	method: "delete",
	path: "/api/v1/storage/folder/{path}",
	summary: "Delete a folder",
	description: "Permanently deletes a folder and its contents",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	body: z.object({
		name: z.string().optional(),
		parentFolderId: z.string().optional(),
	}),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
});

export const getFolderMeta = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/{path}/meta",
	summary: "Get folder metadata",
	description: "Returns metadata for a specific folder",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	query: z.object({ parent: z.string().optional() }),
	response: z.any(),
	errors: [404, 500],
});

export const getFolderSize = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/{path}/size",
	summary: "Get folder size",
	description: "Calculates and returns the total size of a folder in bytes",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	query: z.object({ parent: z.string().optional() }),
	response: z.number(),
	errors: [400, 500],
});

export const trashFolder = defineRoute({
	method: "post",
	path: "/api/v1/storage/folder/{path}/trash",
	summary: "Trash a folder",
	description: "Soft-deletes a folder by moving it to the trash",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	body: z.object({
		parentFolderId: z.string().optional(),
	}),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
});

export const restoreFolder = defineRoute({
	method: "post",
	path: "/api/v1/storage/folder/{path}/restore",
	summary: "Restore a trashed folder",
	description: "Restores a folder from the trash",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	body: z.object({
		parentFolderId: z.string().optional(),
	}),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
});

export const moveFolderRoute = defineRoute({
	method: "post",
	path: "/api/v1/storage/folder/{path}/move",
	summary: "Move a folder",
	description: "Moves a folder to a different parent",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	body: z.object({
		parentFolderId: z.string().optional(),
		destination: z.string(),
	}),
	response: z.object({ message: z.string() }),
	errors: [400, 500],
});

// ============================================================================
// DOWNLOADS & BULK OPERATIONS
// ============================================================================

export const bulkDownload = defineRoute({
	method: "post",
	path: "/api/v1/storage/download",
	summary: "Bulk download as ZIP",
	description: "Downloads multiple files/folders as a single ZIP archive",
	tags: ["Storage - Downloads"],
	body: z.object({
		paths: z.array(z.string()).min(1).max(100),
	}),
	response: z.any().describe("Binary ZIP stream"),
	errors: [400, 500],
});

export const downloadFolder = defineRoute({
	method: "get",
	path: "/api/v1/storage/download/folder/{folder}",
	summary: "Download folder as ZIP",
	description: "Downloads an entire folder as a ZIP archive",
	tags: ["Storage - Downloads"],
	params: z.object({ folder: z.string() }),
	query: z.object({ folder: z.string().optional() }),
	response: z.any().describe("Binary ZIP stream"),
	errors: [404, 500],
});

export const bulkMove = defineRoute({
	method: "post",
	path: "/api/v1/storage/move",
	summary: "Bulk move files and folders",
	description: "Moves multiple files and/or folders to a new destination",
	tags: ["Storage - Bulk"],
	body: z.object({
		items: z
			.array(
				z.object({
					path: z.string(),
					type: z.enum(["file", "folder"]),
				}),
			)
			.min(1)
			.max(100),
		destination: z.string(),
	}),
	response: z.object({
		message: z.string(),
		results: z.array(
			z.object({
				path: z.string(),
				success: z.boolean(),
				error: z.string().optional(),
			}),
		),
		successCount: z.number(),
		failCount: z.number(),
	}),
	errors: [400, 500],
});
