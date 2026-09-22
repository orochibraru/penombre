import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import {
	folderItemSchema,
	newFileSchema,
	objectItemSchema,
	objectListSchema,
	updateFileSchema,
	uploadResultSchema,
} from "#lib/server/schema.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/**
 * Storage route definitions.
 * Importing this module registers all storage routes with the OpenAPI registry.
 * Route handlers in +server.ts files import these and call .handler().
 */

/**
 * Where a call acts: absent is the caller's own drive, `drive` a shared one,
 * `volume` a mounted directory. Every storage route carries both, and
 * `storageServiceFor` is the one place that resolves them — so a route added
 * later inherits the membership check and the volume lookup for free.
 */
const driveQuery = {
	drive: z.string().optional(),
	volume: z.string().optional(),
	share: z.string().optional(),
};

/**
 * A keyset page: omit `cursor` for the first one, pass back `nextCursor` for
 * the next; it is null once there is no more. Ordered by `sort`/`dir` with a
 * stable id tiebreaker, folders before files.
 */
const pageQuery = {
	cursor: z.string().optional(),
	limit: z.string().optional(),
	sort: z.enum(["name", "size", "updatedAt"]).optional(),
	dir: z.enum(["asc", "desc"]).optional(),
};
const listingPageSchema = objectListSchema.extend({
	nextCursor: z.string().nullable(),
});

// ============================================================================
// LIST / BROWSE
// ============================================================================

export const listFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/list",
	summary: "List the root folder",
	description:
		"Returns a keyset-paginated page of the root directory's folders, then " +
		"its files.",
	tags: ["Storage"],
	query: z.object({ ...driveQuery, ...pageQuery }),
	response: listingPageSchema,
	errors: [500],
	service: storageServiceFor,
});

/**
 * `objectListSchema` plus one name per path segment, root first: the
 * breadcrumb trail for this folder. A client used to fetch each segment's
 * name with its own request; this folds them into the listing response
 * instead. `null` means the segment's folder is gone (deleted, no longer
 * reachable): the caller falls back to the raw id.
 */
const folderListingSchema = listingPageSchema.extend({
	ancestorNames: z.array(z.string().nullable()),
});

export const listFilesInFolder = defineRoute({
	method: "get",
	path: "/api/v1/storage/list/{path}",
	summary: "List files in folder",
	description:
		"Returns a keyset-paginated page of a folder's subfolders, then its files.",
	tags: ["Storage"],
	params: z.object({ path: z.string() }),
	query: z.object({ ...driveQuery, ...pageQuery }),
	response: folderListingSchema,
	errors: [400, 500],
	service: storageServiceFor,
});

export const listRecentFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/list/recent",
	summary: "List recent files",
	description: "Returns a list of recently accessed or modified files",
	tags: ["Storage"],
	query: z.object(driveQuery),
	response: objectListSchema,
	errors: [500],
	service: storageServiceFor,
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
	query: z.object({
		...driveQuery,
		folder: z.string().optional(),
	}),
	body: newFileSchema,
	response: uploadResultSchema,
	errors: [400, 500],
	service: storageServiceFor,
});

export const createBatchFiles = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/batch",
	summary: "Create files in batch",
	description: "Creates multiple file entries at once (metadata only)",
	tags: ["Storage - Files"],
	query: z.object({
		...driveQuery,
		folder: z.string().optional(),
	}),
	body: z.object({
		files: z.array(z.object({ name: z.string(), size: z.number() })),
	}),
	response: z.array(uploadResultSchema),
	errors: [400, 500],
	service: storageServiceFor,
});

export const searchFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/search",
	summary: "Search files",
	description: "Searches files by name",
	tags: ["Storage - Files"],
	query: z.object({
		...driveQuery,
		q: z.string(),
		limit: z.string().optional(),
	}),
	response: objectListSchema,
	errors: [400, 500],
	service: storageServiceFor,
});

export const listTrashFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/trash",
	summary: "List trashed files",
	description:
		"Returns a keyset-paginated page of the trash's top-level folders, then files. Keys are full paths; `totalSize` is what emptying the whole trash frees.",
	tags: ["Storage - Files"],
	query: z.object({ ...driveQuery, ...pageQuery }),
	response: listingPageSchema.extend({ totalSize: z.number() }),
	errors: [500],
	service: storageServiceFor,
});

export const emptyTrash = defineRoute({
	method: "delete",
	path: "/api/v1/storage/trash",
	summary: "Empty the trash",
	description:
		"Permanently deletes every trashed file and folder, and reports what was freed",
	tags: ["Storage"],
	query: z.object(driveQuery),
	response: z.object({
		deleted: z.number(),
		freed: z.number(),
		failed: z.number(),
	}),
	errors: [500],
	service: storageServiceFor,
});

export const listStarredFiles = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/starred",
	summary: "List starred files",
	description:
		"Returns a keyset-paginated page of starred folders, then starred files.",
	tags: ["Storage - Files"],
	query: z.object({ ...driveQuery, ...pageQuery }),
	response: listingPageSchema,
	errors: [500],
	service: storageServiceFor,
});

export const getFileCounts = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/counts",
	summary: "Get trash and starred counts",
	description: "Returns the count of trashed and starred items",
	tags: ["Storage - Files"],
	query: z.object(driveQuery),
	response: z.object({ trash: z.number(), starred: z.number() }),
	errors: [500],
	service: storageServiceFor,
});

export const listFilesByCategory = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/category/{category}",
	summary: "List files by category",
	description:
		"Returns a keyset-paginated page of files matching the specified " +
		"category.",
	tags: ["Storage - Files"],
	params: z.object({ category: z.string() }),
	query: z.object({ ...driveQuery, ...pageQuery }),
	response: listingPageSchema,
	errors: [400, 500],
	service: storageServiceFor,
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
		...driveQuery,
		raw: z.string().optional(),
		thumbnail: z.string().optional(),
		size: z.enum(["small", "medium", "large"]).optional(),
	}),
	response: objectItemSchema,
	errors: [404, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [400, 500],
	service: storageServiceFor,
});

export const saveOfficeDocument = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/office",
	summary: "Save an Office document",
	description:
		"Applies edited text to a .docx, .xlsx or .pptx file, rewriting only " +
		"the part of the archive that holds it so the rest of the document " +
		"survives unchanged. The body is HTML for a document, CSV for a " +
		"spreadsheet and Markdown for a presentation.",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	body: z.object({
		content: z.string().describe("The edited text, in the format for its kind"),
	}),
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [400, 404, 422, 500],
	service: storageServiceFor,
});

export const moveFile = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/move",
	summary: "Move a file",
	description: "Moves a file to a different folder",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	body: z.object({ destination: z.string() }),
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
	service: storageServiceFor,
});

export const duplicateFile = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/duplicate",
	summary: "Duplicate a file",
	description: "Creates a copy of the file in the same folder",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	query: z.object(driveQuery),
	response: objectItemSchema,
	errors: [404, 500],
	service: storageServiceFor,
});

export const updateFile = defineRoute({
	method: "put",
	path: "/api/v1/storage/file/{id}",
	summary: "Update file metadata",
	description: "Updates metadata fields on an existing file",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	query: z.object({
		...driveQuery,
		folder: z.string().optional(),
	}),
	body: updateFileSchema,
	response: z.object({ message: z.string() }),
	errors: [404, 500],
	service: storageServiceFor,
});

export const deleteFile = defineRoute({
	method: "delete",
	path: "/api/v1/storage/file/{id}",
	summary: "Delete a file",
	description: "Permanently deletes a file",
	tags: ["Storage - Files"],
	params: z.object({ id: z.string() }),
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.array(folderItemSchema),
	errors: [500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.object({
		message: z.string(),
		id: z.string(),
		name: z.string(),
	}),
	errors: [400, 500],
	service: storageServiceFor,
});

export const getFolderTree = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/tree",
	summary: "Get folder tree",
	description: "Returns all folders with metadata for building a folder picker",
	tags: ["Storage - Folders"],
	query: z.object(driveQuery),
	response: z.array(folderItemSchema),
	errors: [500],
	service: storageServiceFor,
});

export const listTrashedFolders = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/trash",
	summary: "List trashed folders",
	description: "Returns folders currently in the trash",
	tags: ["Storage - Folders"],
	query: z.object(driveQuery),
	response: z.array(folderItemSchema),
	errors: [500],
	service: storageServiceFor,
});

export const getFolderSizes = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/sizes/{prefix}",
	summary: "Get folder sizes by prefix",
	description: "Calculates sizes for all folders under a given prefix",
	tags: ["Storage - Folders"],
	params: z.object({ prefix: z.string() }),
	query: z.object(driveQuery),
	response: z.record(z.string(), z.number()),
	errors: [500],
	service: storageServiceFor,
});

export const getFolder = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/{path}",
	summary: "Get a folder",
	description: "Returns a folder by ID",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	query: z.object(driveQuery),
	response: folderItemSchema,
	errors: [404, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
	service: storageServiceFor,
});

export const getFolderMeta = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/{path}/meta",
	summary: "Get folder metadata",
	description: "Returns metadata for a specific folder",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	query: z.object({
		...driveQuery,
		parent: z.string().optional(),
	}),
	response: z.any(),
	errors: [404, 500],
	service: storageServiceFor,
});

export const getFolderSize = defineRoute({
	method: "get",
	path: "/api/v1/storage/folder/{path}/size",
	summary: "Get folder size",
	description: "Calculates and returns the total size of a folder in bytes",
	tags: ["Storage - Folders"],
	params: z.object({ path: z.string() }),
	query: z.object({
		...driveQuery,
		parent: z.string().optional(),
	}),
	response: z.number(),
	errors: [400, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [404, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.object({ message: z.string() }),
	errors: [400, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
	response: z.any().describe("Binary ZIP stream"),
	errors: [400, 500],
	service: storageServiceFor,
});

/**
 * Above this many items the query string risks a proxy's default header size
 * limit (nginx's 8 KB), even with bare keys. The GET form is for the common
 * case, and the POST form (blob download) covers the rest.
 */
export const BULK_DOWNLOAD_LINK_MAX = 100;

export const bulkDownloadLink = defineRoute({
	method: "get",
	path: "/api/v1/storage/download",
	summary: "Bulk download as ZIP (link form)",
	description:
		"Same as the POST version, for a plain <a href> so the browser streams the download itself instead of buffering it in JS memory. Every selected item shares one folder, given once; `keys` is a comma-separated list of the bare names within it, resolved the same way the POST form's full paths are.",
	tags: ["Storage - Downloads"],
	query: z.object({
		...driveQuery,
		folder: z.string().optional(),
		keys: z
			.string()
			.min(1)
			.refine((value) => {
				const count = value.split(",").filter(Boolean).length;
				return count > 0 && count <= BULK_DOWNLOAD_LINK_MAX;
			}, `keys must list 1-${BULK_DOWNLOAD_LINK_MAX} comma-separated names`),
	}),
	response: z.any().describe("Binary ZIP stream"),
	errors: [400, 500],
	service: storageServiceFor,
});

export const downloadFolder = defineRoute({
	method: "get",
	path: "/api/v1/storage/download/folder/{folder}",
	summary: "Download folder as ZIP",
	description: "Downloads an entire folder as a ZIP archive",
	tags: ["Storage - Downloads"],
	params: z.object({ folder: z.string() }),
	query: z.object({
		...driveQuery,
		folder: z.string().optional(),
	}),
	response: z.any().describe("Binary ZIP stream"),
	errors: [404, 500],
	service: storageServiceFor,
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
	query: z.object(driveQuery),
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
	service: storageServiceFor,
});

export const transferItems = defineRoute({
	method: "post",
	path: "/api/v1/storage/transfer",
	summary: "Copy or move items to another location",
	description:
		"Copies or moves files and folders from the location in the query to `destination`, which may be another drive, shared drive or volume. Within one location a move is an ordinary move and a copy duplicates.",
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
		destination: z.object({
			...driveQuery,
			folder: z.string().default(""),
		}),
		mode: z.enum(["copy", "move"]),
	}),
	query: z.object(driveQuery),
	response: z.object({
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
	errors: [400, 403, 404, 500],
	service: storageServiceFor,
});
