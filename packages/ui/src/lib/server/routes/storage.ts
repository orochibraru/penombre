import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { Logger } from "$lib/logger";
import type { CustomRouter } from "$lib/server/api-types";
import { StorageService } from "$lib/server/dto/storage";
import { FileNotFoundError, UnauthorizedError } from "$lib/server/errors";
import type { ObjectItem, ObjectList } from "$lib/server/schema";
import {
	allowedFileCategories,
	type FileCategory,
	newFileSchema,
	newFolderSchema,
	updateFileSchema,
} from "$lib/server/schema";

const logger = new Logger("StorageRouter");

// Query schemas for RPC type inference
const folderQuerySchema = z.object({
	folder: z.string().optional(),
});

const rawQuerySchema = z.object({
	raw: z.string().optional(),
});

const parentQuerySchema = z.object({
	parent: z.string().optional(),
});

// ============================================================================
// OBJECTS ROUTES
// ============================================================================

const objectsRouter = new Hono<CustomRouter>()
	// GET /storage/objects - List files in folder
	.get("/", zValidator("query", folderQuerySchema), async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		const { folder = "" } = c.req.valid("query");
		const storageService = new StorageService(user);
		const objects = await storageService.listFiles(decodeURIComponent(folder));
		return c.json<ObjectList>(objects);
	})
	// POST /storage/objects - Create a file (metadata only)
	.post(
		"/",
		zValidator("query", folderQuerySchema),
		zValidator("json", newFileSchema),
		async (c) => {
			const user = c.get("user");
			if (!user) {
				return c.json({ message: "Unauthorized" }, 401);
			}
			const { folder } = c.req.valid("query");
			const body = c.req.valid("json");
			const storageService = new StorageService(user);

			try {
				const res = await storageService.createFile(body, folder);
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
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		const storageService = new StorageService(user);
		const objects = await storageService.listRecentFiles();
		return c.json<ObjectList>(objects);
	})
	// GET /storage/objects/trash - List trashed files
	.get("/trash", async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		const storageService = new StorageService(user);
		const objects = await storageService.listTrashFiles();
		return c.json<ObjectList>(objects);
	})
	// GET /storage/objects/category/:category - List files by category
	.get("/category/:category", async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		const cat = c.req.param("category")?.toUpperCase();
		if (!allowedFileCategories.includes(cat || "")) {
			return c.json({ message: "Invalid category" }, 400);
		}
		logger.info(
			`User ${user.id} is fetching files for category ${c.req.param("category")}`,
		);
		const storageService = new StorageService(user);
		const objects = await storageService.listFilesPerCategory(
			cat as FileCategory,
		);
		return c.json<ObjectList>(objects);
	})
	// GET /storage/objects/item/:item - Get file metadata or raw file
	.get("/item/:item", zValidator("query", rawQuerySchema), async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		const storage = new StorageService(user);
		const decodedItemName = decodeURIComponent(c.req.param("item"));
		const { raw } = c.req.valid("query");

		try {
			if (raw === "true") {
				const fileData = await storage.getRawFileData(decodedItemName);
				if (!fileData) {
					return c.json({ message: "File not found" }, 404);
				}

				const rangeHeader =
					c.req.header("range") || c.req.header("Range") || "";
				if (rangeHeader) {
					const headers: Record<string, string> = {};
					c.req.raw.headers.forEach((value, key) => {
						headers[key] = value;
					});
					const { chunk, headers: newHeaders } = storage.generateRangeHeaders({
						file: fileData.file,
						object: fileData.meta,
						headers,
					});

					return new Response(chunk, {
						status: 206,
						headers: newHeaders,
					});
				}

				const newHeaders = storage.generateRawFileHeaders({
					file: fileData.file,
					object: fileData.meta,
				});

				return new Response(fileData.file, {
					headers: newHeaders,
					status: 200,
				});
			}

			const file = await storage.getFile(decodedItemName);
			if (!file) {
				return c.json({ message: "File not found" }, 404);
			}

			if (file.metadata.owner !== user.id) {
				return c.json({ message: "Unauthorized" }, 401);
			}

			return c.json<ObjectItem>(file);
		} catch (error) {
			if (error instanceof FileNotFoundError) {
				return c.json({ message: "File not found" }, 404);
			}
			logger.error("Error retrieving file metadata:", error);
			return c.json({ message: "Error retrieving file metadata." }, 500);
		}
	})
	// POST /storage/objects/item/:item - Upload file body
	.post("/item/:item", async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}

		const formData = await c.req.formData();
		const file = formData.get("file") as File | null;
		if (!file) {
			return c.json({ message: "No file provided." }, 400);
		}

		const storage = new StorageService(user);
		const decodedItemName = decodeURIComponent(c.req.param("item"));

		const exists = await storage.fileExists(decodedItemName);
		if (!exists) {
			return c.json({ message: "File not found" }, 404);
		}

		logger.info("Uploading file body for:", decodedItemName, file);

		try {
			await storage.uploadFileBody(decodedItemName, file);
			logger.info("File body uploaded for:", decodedItemName);
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
			const user = c.get("user");
			if (!user) {
				return c.json({ message: "Unauthorized" }, 401);
			}
			const storage = new StorageService(user);
			const { folder } = c.req.valid("query");
			const body = c.req.valid("json");
			const fullPath = `${folder ? `${folder}/` : ""}${c.req.param("item")}`;
			const decodedItemName = decodeURIComponent(fullPath);

			const exists = await storage.fileExists(decodedItemName);
			if (!exists) {
				return c.json({ message: "File not found" }, 404);
			}

			try {
				await storage.updateFile(decodedItemName, body);
				return c.json({ message: "File metadata updated successfully." });
			} catch (error) {
				logger.error("Error updating file metadata:", error);
				return c.json({ message: "Error updating file metadata." }, 500);
			}
		},
	)
	// DELETE /storage/objects/item/:item - Delete a file
	.delete("/item/:item", async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		const storage = new StorageService(user);
		const decodedItemName = decodeURIComponent(c.req.param("item"));

		const exists = await storage.fileExists(decodedItemName);
		if (!exists) {
			return c.json({ message: "File not found" }, 404);
		}

		try {
			await storage.deleteFile(decodedItemName);
			return c.json({ message: "File deleted successfully." });
		} catch (error) {
			logger.error("Error deleting file:", error);
			return c.json({ message: "Error deleting file." }, 500);
		}
	});

// ============================================================================
// FOLDERS ROUTES
// ============================================================================

const foldersRouter = new Hono<CustomRouter>()
	// GET /storage/folders - List folders
	.get("/", async (c) => {
		return c.json({ message: "Folders retrieved successfully." });
	})
	// POST /storage/folders - Create a folder
	.post("/", zValidator("json", newFolderSchema), async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		const body = c.req.valid("json");
		const storageService = new StorageService(user);
		await storageService.createFolder(body.name, body.parent);
		return c.json({ message: "Folder created successfully." }, 201);
	})
	// GET /storage/folders/folder/:folder - Get a folder
	.get("/folder/:folder", async (c) => {
		return c.json({ message: "Folder retrieved successfully." });
	})
	// DELETE /storage/folders/folder/:folder - Delete a folder
	.delete(
		"/folder/:folder",
		zValidator("query", parentQuerySchema),
		async (c) => {
			const user = c.get("user");
			if (!user) {
				return c.json({ message: "Unauthorized" }, 401);
			}
			const storageService = new StorageService(user);
			const { parent } = c.req.valid("query");

			const decoded = {
				folder: decodeURIComponent(c.req.param("folder")),
				parent: parent ? decodeURIComponent(parent) : undefined,
			};

			const folderPath = decoded.parent
				? `${decoded.parent}/${decoded.folder}`
				: decoded.folder;

			await storageService.deleteFolder(folderPath);
			return c.json({ message: "Folder deleted successfully." });
		},
	);

// ============================================================================
// STORAGE ROUTER (combines objects + folders)
// ============================================================================

export const storageRouter = new Hono<CustomRouter>()
	.route("/objects", objectsRouter)
	.route("/folders", foldersRouter);
