import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { Logger } from "$lib/logger";
import type { StorageRouter } from "$lib/server/api-types";
import { StorageService } from "$lib/server/dto/storage";
import {
	FileOrFolderNotFoundError,
	UnauthorizedError,
} from "$lib/server/errors";
import type { ObjectItem, ObjectList } from "$lib/server/schema";
import {
	allowedFileCategories,
	type FileCategory,
	newFileSchema,
	updateFileSchema,
} from "$lib/server/schema";

const logger = new Logger("ObjectsRouter");

// Query schemas for RPC type inference
const folderQuerySchema = z.object({
	folder: z.string().optional(),
});

const rawQuerySchema = z.object({
	raw: z.string().optional(),
	thumbnail: z.string().optional(),
	size: z.string().optional(),
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
				const thumbSize = size ? Number.parseInt(size, 10) : 300;
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
					return new Response(new Uint8Array(thumbData.buffer), {
						headers: {
							"Content-Type": thumbData.contentType,
							"Cache-Control": "public, max-age=31536000, immutable",
							"Content-Length": thumbData.buffer.length.toString(),
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

				logger.debug("File response prepared, sending response");
				return new Response(fileData.file, {
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
