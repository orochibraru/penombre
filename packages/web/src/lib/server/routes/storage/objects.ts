import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { dev } from "$app/environment";
import { Logger } from "$lib/logger";
import type { StorageRouter } from "$lib/server/api-types";
import {
	FileOrFolderNotFoundError,
	UnauthorizedError,
} from "$lib/server/errors";
import type { ObjectItem, ObjectList } from "$lib/server/schema";
import {
	allowedFileCategories,
	batchFileSchema,
	type FileCategory,
	newFileSchema,
	updateFileSchema,
} from "$lib/server/schema";
import {
	bulkDownloadService,
	StorageService,
} from "$lib/server/services/storage";

const logger = new Logger("ObjectsRouter");

/**
 * Generate ETag from file metadata for conditional requests.
 */
function generateETag(data: { size: number; mtime: number }): string {
	const hash = createHash("md5")
		.update(`${data.size}-${data.mtime}`)
		.digest("hex");
	return `"${hash}"`;
}

// Query schemas for RPC type inference
const folderQuerySchema = z.object({
	folder: z.string().optional(),
	limit: z.string().optional(),
	offset: z.string().optional(),
});

const rawQuerySchema = z.object({
	raw: z.string().optional(),
	thumbnail: z.string().optional(),
	size: z.enum(["small", "medium", "large"]).optional(),
});

const moveBodySchema = z.object({
	destination: z.string(), // Empty string for root
});

const bulkDownloadSchema = z.object({
	paths: z.array(z.string()).min(1).max(100), // Limit to 100 items
});

const bulkMoveSchema = z.object({
	items: z
		.array(
			z.object({
				path: z.string(), // Full path of the item
				type: z.enum(["file", "folder"]),
			}),
		)
		.min(1)
		.max(100),
	destination: z.string(), // Empty string for root
});

const folderDownloadQuerySchema = z.object({
	folder: z.string().optional(), // Parent folder context
});

// ============================================================================
// ITEM SUB-ROUTER - Handles /storage/objects/item/:item/*
// Using a sub-router ensures specific actions like /move are matched first
// ============================================================================

const itemRouter = new Hono<StorageRouter>()
	// POST /move - Move a file to a different folder
	.post("/move", zValidator("json", moveBodySchema), async (c) => {
		const storageService = c.get("storageService");
		const itemParam = c.req.param("item");
		if (!itemParam) {
			return c.json({ message: "Item parameter required" }, 400);
		}
		const decodedItemName = decodeURIComponent(itemParam);
		const { destination } = c.req.valid("json");

		logger.debug(
			`Moving file: ${decodedItemName} to folder: ${destination || "root"}`,
		);

		const exists = await storageService.fileExists(decodedItemName);
		if (!exists) {
			logger.debug("File not found for move:", decodedItemName);
			return c.json({ message: "File not found" }, 404);
		}

		try {
			await storageService.moveFile(decodedItemName, destination);
			logger.debug(
				`File moved: ${decodedItemName} to ${destination || "root"}`,
			);
			return c.json({ message: "File moved successfully." });
		} catch (error) {
			logger.error("Error moving file:", error);
			return c.json({ message: "Error moving file." }, 500);
		}
	})
	// POST /duplicate - Duplicate a file in the same folder
	.post("/duplicate", async (c) => {
		const storageService = c.get("storageService");
		const itemParam = c.req.param("item");
		if (!itemParam) {
			return c.json({ message: "Item parameter required" }, 400);
		}
		const decodedItemName = decodeURIComponent(itemParam);

		logger.debug(`Duplicating file: ${decodedItemName}`);

		const exists = await storageService.fileExists(decodedItemName);
		if (!exists) {
			logger.debug("File not found for duplicate:", decodedItemName);
			return c.json({ message: "File not found" }, 404);
		}

		try {
			const newFile = await storageService.duplicateFile(decodedItemName);
			logger.debug(
				`File duplicated: ${decodedItemName} -> ${newFile.metadata.name}`,
			);
			return c.json(newFile);
		} catch (error) {
			logger.error("Error duplicating file:", error);
			return c.json({ message: "Error duplicating file." }, 500);
		}
	});

// ============================================================================
// OBJECTS ROUTES
// ============================================================================

const objectsRouter = new Hono<StorageRouter>()

	.use("*", async (c, next) => {
		const user = c.get("user");
		if (!user) {
			throw new UnauthorizedError("User not authenticated");
		}
		const storageService = new StorageService(user);
		// Mount the service into the context
		c.set("storageService", storageService);
		await next();
	})

	// GET /storage/objects - List files in folder
	.get("/", zValidator("query", folderQuerySchema), async (c) => {
		const storageService = c.get("storageService");
		const { folder = "" } = c.req.valid("query");

		try {
			logger.debug(`Listing files in folder: ${folder}`);
			const objects = await storageService.listFiles(
				decodeURIComponent(folder),
			);
			logger.debug(`Found ${objects.count} files in folder: ${folder}`);
			return c.json<ObjectList>(objects);
		} catch (error) {
			logger.error("Error listing files:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// POST /storage/objects - Create a file (metadata only)
	.post(
		"/",
		zValidator("query", folderQuerySchema),
		zValidator("json", newFileSchema),
		async (c) => {
			const { folder } = c.req.valid("query");
			const body = c.req.valid("json");
			const storageService = c.get("storageService");

			try {
				logger.debug(`Creating file: ${body.name} in folder: ${folder}`);
				const res = await storageService.createFile(body, folder);
				logger.debug(`File created: ${body.name} in folder: ${folder}`);
				return c.json(res);
			} catch (error) {
				if (error instanceof UnauthorizedError) {
					return c.json({ message: "Unauthorized" }, 401);
				}
				logger.error("Error creating file:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// POST /storage/objects/batch - Create multiple files in batch
	.post(
		"/batch",
		zValidator("query", folderQuerySchema),
		zValidator("json", batchFileSchema),
		async (c) => {
			const { folder } = c.req.valid("query");
			const body = c.req.valid("json");
			const storageService = c.get("storageService");

			try {
				logger.debug(
					`Creating batch of ${body.files.length} files in folder: ${folder}`,
				);
				const results = await storageService.createBatchFiles(
					body.files,
					folder,
				);
				logger.debug(
					`Batch creation completed: ${body.files.length} files created`,
				);
				return c.json(results);
			} catch (error) {
				if (error instanceof UnauthorizedError) {
					return c.json({ message: "Unauthorized" }, 401);
				}
				logger.error("Error creating batch files:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// GET /storage/objects/recent - List recent files
	.get("/recent", async (c) => {
		const storageService = c.get("storageService");

		try {
			logger.debug("Listing recent files for user");
			const objects = await storageService.listRecentFiles();
			logger.debug(`Found ${objects.count} recent files`);
			return c.json<ObjectList>(objects);
		} catch (error) {
			logger.error("Error listing recent files:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/objects/search - Search files by name
	.get(
		"/search",
		zValidator(
			"query",
			z.object({
				q: z.string().min(1),
				limit: z.string().optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const { q, limit } = c.req.valid("query");
			const parsedLimit = limit ? Number.parseInt(limit, 10) : 50;

			try {
				logger.debug(`Searching files with query: "${q}"`);
				const objects = await storageService.searchFiles(q, parsedLimit);
				logger.debug(`Found ${objects.count} matching files`);
				return c.json<ObjectList>(objects);
			} catch (error) {
				logger.error("Error searching files:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// GET /storage/objects/trash - List trashed files
	.get("/trash", async (c) => {
		const storageService = c.get("storageService");

		try {
			logger.debug("Listing trashed files for user");
			const objects = await storageService.listTrashFiles();
			logger.debug(`Found ${objects.count} trashed files`);
			return c.json<ObjectList>(objects);
		} catch (error) {
			logger.error("Error listing trashed files:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/objects/starred - List starred files
	.get("/starred", async (c) => {
		const storageService = c.get("storageService");

		try {
			logger.debug("Listing starred files for user");
			const objects = await storageService.listStarredFiles();
			logger.debug(`Found ${objects.count} starred files`);
			return c.json<ObjectList>(objects);
		} catch (error) {
			logger.error("Error listing starred files:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/objects/counts - Get counts for trash and starred items
	.get("/counts", async (c) => {
		const storageService = c.get("storageService");

		try {
			const [trashCount, starredCount] = await Promise.all([
				storageService.countTrashedItems(),
				storageService.countStarredItems(),
			]);
			return c.json({ trash: trashCount, starred: starredCount });
		} catch (error) {
			logger.error("Error getting counts:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// POST /storage/objects/download - Bulk download multiple files as zip
	.post("/download", zValidator("json", bulkDownloadSchema), async (c) => {
		const storageService = c.get("storageService");
		const { paths } = c.req.valid("json");

		logger.debug(`Bulk download requested for ${paths.length} items`);

		try {
			const storagePath = storageService.getStoragePath();
			const { stream } = await bulkDownloadService.createZipFromPaths(
				storagePath,
				paths,
			);
			const filename = bulkDownloadService.generateZipFilename(paths);

			logger.debug(`Streaming zip download: ${filename}`);

			return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
				headers: {
					"Content-Type": "application/zip",
					"Content-Disposition": `attachment; filename="${filename}"`,
					"Cache-Control": "no-cache",
				},
			});
		} catch (error) {
			logger.error("Error creating bulk download:", error);
			return c.json({ message: "Error creating download" }, 500);
		}
	})

	// POST /storage/objects/move - Bulk move multiple files/folders
	.post("/move", zValidator("json", bulkMoveSchema), async (c) => {
		const storageService = c.get("storageService");
		const { items, destination } = c.req.valid("json");

		logger.debug(
			`Bulk move requested: ${items.length} items to ${destination || "root"}`,
		);

		const results: { path: string; success: boolean; error?: string }[] = [];

		for (const item of items) {
			try {
				if (item.type === "folder") {
					// For folders, the path is the full path including parent
					const folderPath = item.path.replace(/\/$/, "");
					await storageService.moveFolder(folderPath, destination);
				} else {
					await storageService.moveFile(item.path, destination);
				}
				results.push({ path: item.path, success: true });
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				logger.error(`Failed to move ${item.path}:`, error);
				results.push({ path: item.path, success: false, error: message });
			}
		}

		const successCount = results.filter((r) => r.success).length;
		const failCount = results.filter((r) => !r.success).length;

		logger.debug(
			`Bulk move completed: ${successCount} succeeded, ${failCount} failed`,
		);

		return c.json({
			message: `Moved ${successCount} of ${items.length} items`,
			results,
			successCount,
			failCount,
		});
	})

	// GET /storage/objects/download/folder/:folder - Download folder as zip
	.get(
		"/download/folder/:folder",
		zValidator("query", folderDownloadQuerySchema),
		async (c) => {
			const storageService = c.get("storageService");
			const folderParam = c.req.param("folder");
			const { folder: parentFolder } = c.req.valid("query");

			if (!folderParam) {
				return c.json({ message: "Folder parameter required" }, 400);
			}

			const decodedFolder = decodeURIComponent(folderParam);
			const fullPath = parentFolder
				? `${parentFolder}/${decodedFolder}`
				: decodedFolder;

			logger.debug(`Folder download requested: ${fullPath}`);

			try {
				const storagePath = storageService.getStoragePath();
				const { stream } = await bulkDownloadService.createZipFromFolder(
					storagePath,
					fullPath,
				);
				const filename = `${decodedFolder}.zip`;

				logger.debug(`Streaming folder zip download: ${filename}`);

				return new Response(
					Readable.toWeb(stream) as unknown as ReadableStream,
					{
						headers: {
							"Content-Type": "application/zip",
							"Content-Disposition": `attachment; filename="${filename}"`,
							"Cache-Control": "no-cache",
						},
					},
				);
			} catch (error) {
				logger.error("Error creating folder download:", error);
				if (error instanceof Error && error.message.includes("not found")) {
					return c.json({ message: "Folder not found" }, 404);
				}
				return c.json({ message: "Error creating download" }, 500);
			}
		},
	)

	// GET /storage/objects/category/:category - List files by category
	.get("/category/:category", async (c) => {
		const cat = c.req.param("category")?.toUpperCase();
		if (!allowedFileCategories.includes(cat || "")) {
			return c.json({ message: "Invalid category" }, 400);
		}
		const storageService = c.get("storageService");

		try {
			logger.debug(`Listing files in category: ${cat}`);
			const objects = await storageService.listFilesPerCategory(
				cat as FileCategory,
			);
			logger.debug(`Found ${objects.count} files in category: ${cat}`);
			return c.json<ObjectList>(objects);
		} catch (error) {
			logger.error("Error listing files by category:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// Mount item sub-router for /item/:item/* action routes (e.g. /move)
	.route("/item/:item", itemRouter)

	// GET /storage/objects/item/:item - Get file metadata or raw file
	.get("/item/:item", zValidator("query", rawQuerySchema), async (c) => {
		const storageService = c.get("storageService");
		const user = c.get("user");

		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}

		const decodedItemName = decodeURIComponent(c.req.param("item"));
		const { raw, thumbnail, size } = c.req.valid("query");

		try {
			// Handle thumbnail requests
			if (thumbnail === "true") {
				logger.debug(`Fetching thumbnail for: ${decodedItemName}`);
				// Map size string to pixel dimensions: small=100px, medium=200px, large=300px
				const thumbSize =
					size === "small" ? 100 : size === "medium" ? 200 : 300;
				const thumbData = await storageService.getThumbnail(
					decodedItemName,
					thumbSize,
				);

				if (!thumbData) {
					// Fall back to raw file if thumbnail generation fails
					logger.debug(
						`Thumbnail generation failed, falling back to raw for: ${decodedItemName}`,
					);
				} else {
					// Generate ETag for thumbnail
					const etag = generateETag({
						size: thumbData.buffer.length,
						mtime: Date.now(),
					});

					// Check If-None-Match header for 304 Not Modified
					const ifNoneMatch = c.req.header("If-None-Match");
					if (ifNoneMatch === etag) {
						return c.body(null, 304);
					}

					return new Response(new Uint8Array(thumbData.buffer), {
						headers: {
							"Content-Type": thumbData.contentType,
							"Cache-Control": "public, max-age=31536000, immutable",
							"Content-Length": thumbData.buffer.length.toString(),
							ETag: etag,
						},
						status: 200,
					});
				}
			}

			if (raw === "true" || thumbnail === "true") {
				logger.debug(`Fetching raw file data for: ${decodedItemName}`);
				const fileData = await storageService.getRawFileData(decodedItemName);
				if (!fileData) {
					logger.debug(`File not found: ${decodedItemName}`);
					return c.json({ message: "File not found" }, 404);
				}

				logger.debug(`Raw file data retrieved for: ${decodedItemName}`);
				logger.debug(`Checking ownership for user: ${user.id}`);
				if (fileData.meta.metadata.owner !== user.id) {
					logger.debug(`Unauthorized access attempt by user: ${user.id}`);
					return c.json({ message: "Unauthorized" }, 401);
				}

				logger.debug(`User authorized: ${user.id}, preparing file response`);

				// Generate ETag for conditional requests
				const etag = generateETag({
					size: fileData.file.size,
					mtime: fileData.file.lastModified,
				});

				// Check If-None-Match header for 304 Not Modified
				const ifNoneMatch = c.req.header("If-None-Match");
				if (ifNoneMatch === etag && !dev) {
					logger.debug("ETag match, returning 304 Not Modified");
					return c.body(null, 304, {
						ETag: etag,
						"Cache-Control": "public, max-age=3600",
					});
				}

				logger.debug("Checking for Range header");
				const rangeHeader =
					c.req.header("range") || c.req.header("Range") || "";
				if (rangeHeader) {
					const headers: Record<string, string> = {};
					c.req.raw.headers.forEach((value, key) => {
						headers[key] = value;
					});
					logger.debug("Generating range headers for partial content");
					const { chunk, headers: newHeaders } =
						storageService.generateRangeHeaders({
							file: fileData.file,
							object: fileData.meta,
							headers,
						});

					newHeaders.set("ETag", etag);
					logger.debug("Returning partial content response with status 206");
					return new Response(chunk, {
						status: 206,
						headers: newHeaders,
					});
				}

				logger.debug("Returning full file response with status 200");
				const newHeaders = storageService.generateRawFileHeaders({
					file: fileData.file,
					object: fileData.meta,
				});

				// Log all headers for debug
				logger.debug("headers");
				for (const header of newHeaders) {
					logger.debug(header);
				}

				newHeaders.set("ETag", etag);

				// Return raw buffer so Content-Disposition header is respected by browser
				const buffer = await fileData.file.arrayBuffer();
				logger.debug(
					"File response prepared, sending response with display name from metadata",
				);
				return new Response(buffer, {
					headers: newHeaders,
					status: 200,
				});
			}

			logger.debug(`Fetching file metadata for: ${decodedItemName}`);
			const file = await storageService.getFile(decodedItemName);
			if (!file) {
				logger.debug(`File not found: ${decodedItemName}`);
				return c.json({ message: "File not found" }, 404);
			}

			logger.debug("Checking file ownership");
			if (file.metadata.owner !== user.id) {
				logger.debug(`Unauthorized access attempt by user: ${user.id}`);
				return c.json({ message: "Unauthorized" }, 401);
			}

			logger.debug("File metadata retrieved successfully");
			return c.json<ObjectItem>(file);
		} catch (error) {
			if (error instanceof FileOrFolderNotFoundError) {
				return c.json({ message: "File not found" }, 404);
			}
			logger.error("Error retrieving file metadata:", error);
			return c.json({ message: "Error retrieving file metadata." }, 500);
		}
	})

	// POST /storage/objects/item/:item - Upload file body
	.post("/item/:item", async (c) => {
		const formData = await c.req.formData();
		logger.debug("Received form data for file upload");
		const file = formData.get("file") as File | null;
		if (!file) {
			logger.error("No file provided in upload request");
			return c.json({ message: "No file provided." }, 400);
		}

		const storageService = c.get("storageService");
		const decodedItemName = decodeURIComponent(c.req.param("item"));

		logger.debug("Checking if file exists for:", decodedItemName);
		const exists = await storageService.fileExists(decodedItemName);
		if (!exists) {
			logger.debug("File not found for upload:", decodedItemName);
			return c.json({ message: "File not found" }, 404);
		}

		try {
			logger.debug("Uploading file body for:", decodedItemName, file);
			await storageService.uploadFileBody(decodedItemName, file);
			logger.debug("File body uploaded for:", decodedItemName);
			return c.json({ message: "File uploaded successfully." });
		} catch (error) {
			logger.error("Error uploading file body:", error);
			return c.json({ message: "Error uploading file body." }, 500);
		}
	})

	// PUT /storage/objects/item/:item - Update file metadata
	.put(
		"/item/:item",
		zValidator("query", folderQuerySchema),
		zValidator("json", updateFileSchema),
		async (c) => {
			const storageService = c.get("storageService");
			const { folder } = c.req.valid("query");
			const body = c.req.valid("json");
			const fullPath = `${folder ? `${folder}/` : ""}${c.req.param("item")}`;
			const decodedItemName = decodeURIComponent(fullPath);

			logger.debug(
				"Checking if file exists for metadata update:",
				decodedItemName,
			);
			const exists = await storageService.fileExists(decodedItemName);
			if (!exists) {
				logger.debug("File not found for metadata update:", decodedItemName);
				return c.json({ message: "File not found" }, 404);
			}

			try {
				logger.debug("Updating file metadata for:", decodedItemName, body);
				await storageService.updateFile(decodedItemName, body);
				logger.debug("File metadata updated for:", decodedItemName);
				return c.json({ message: "File metadata updated successfully." });
			} catch (error) {
				logger.error("Error updating file metadata:", error);
				return c.json({ message: "Error updating file metadata." }, 500);
			}
		},
	)

	// DELETE /storage/objects/item/:item - Delete a file
	.delete("/item/:item", async (c) => {
		const storageService = c.get("storageService");
		const decodedItemName = decodeURIComponent(c.req.param("item"));

		logger.debug("Checking if file exists for deletion:", decodedItemName);
		const exists = await storageService.fileExists(decodedItemName);
		if (!exists) {
			logger.debug("File not found for deletion:", decodedItemName);
			return c.json({ message: "File not found" }, 404);
		}

		try {
			logger.debug("Deleting file:", decodedItemName);
			await storageService.deleteFile(decodedItemName);
			logger.debug("File deleted:", decodedItemName);
			return c.json({ message: "File deleted successfully." });
		} catch (error) {
			logger.error("Error deleting file:", error);
			return c.json({ message: "Error deleting file." }, 500);
		}
	});

export { objectsRouter };
