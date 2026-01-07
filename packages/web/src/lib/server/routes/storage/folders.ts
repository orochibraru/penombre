import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { Logger } from "$lib/logger";
import type { StorageRouter } from "$lib/server/api-types";
import { StorageService } from "$lib/server/dto/storage";
import { UnauthorizedError } from "$lib/server/errors";
import { newFolderSchema } from "$lib/server/schema";

const logger = new Logger("FoldersRouter");

const parentQuerySchema = z.object({
	parent: z.string().optional(),
});

const foldersRouter = new Hono<StorageRouter>()

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

	// GET /storage/folders - List folders
	.get("/", async (c) => {
		const storageService = c.get("storageService");

		try {
			logger.debug("Listing folders for user");
			const folders = await storageService.listFolders("", {
				includeTrashed: false,
			});
			logger.debug(`Found ${folders.length} folders`);
			return c.json(folders);
		} catch (error) {
			logger.error("Error listing folders:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/folders/trash - List trashed folders
	.get("/trash", async (c) => {
		const storageService = c.get("storageService");

		try {
			logger.debug("Listing trashed folders for user");
			const folders = await storageService.listFolders("", {
				onlyTrashed: true,
			});
			logger.debug(`Found ${folders.length} trashed folders`);
			return c.json(folders);
		} catch (error) {
			logger.error("Error listing trashed folders:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// POST /storage/folders - Create a folder
	.post("/", zValidator("json", newFolderSchema), async (c) => {
		const body = c.req.valid("json");
		const storageService = c.get("storageService");

		try {
			logger.debug(
				`Creating folder: ${body.name} under parent: ${body.parent}`,
			);
			await storageService.createFolder(body.name, body.parent);
			logger.debug("Folder created successfully");
			return c.json({ message: "Folder created successfully." }, 201);
		} catch (error) {
			logger.error("Error creating folder:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/folders/folder/:folder - Get a folder
	.get("/folder/:folder", async (c) => {
		const storageService = c.get("storageService");
		const folderName = decodeURIComponent(c.req.param("folder"));

		try {
			logger.debug(`Getting folder: ${folderName}`);
			const folder = await storageService.getFolder(folderName);
			logger.debug(`Folder retrieved: ${folderName}`);
			return c.json(folder);
		} catch (error) {
			logger.error("Error getting folder:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/folders/folder/:folder/meta - Get folder metadata
	.get(
		"/folder/:folder/meta",
		zValidator("query", parentQuerySchema),
		async (c) => {
			const storageService = c.get("storageService");
			const folderName = decodeURIComponent(c.req.param("folder"));
			const { parent } = c.req.valid("query");

			const folderPath = parent
				? `${decodeURIComponent(parent)}/${folderName}`
				: folderName;

			try {
				const meta = await storageService.getFolderMeta(folderPath);
				if (!meta) {
					return c.json({ message: "Folder not found" }, 404);
				}
				return c.json(meta);
			} catch (error) {
				logger.error("Error getting folder metadata:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// PUT /storage/folders/folder/:folder - Update folder metadata
	.put(
		"/folder/:folder",
		zValidator("query", parentQuerySchema),
		zValidator(
			"json",
			z.object({
				isTrashed: z.boolean().optional(),
				tags: z.array(z.string()).optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const { parent } = c.req.valid("query");
			const body = c.req.valid("json");

			const decoded = {
				folder: decodeURIComponent(c.req.param("folder")),
				parent: parent ? decodeURIComponent(parent) : undefined,
			};

			const folderPath = decoded.parent
				? `${decoded.parent}/${decoded.folder}`
				: decoded.folder;

			try {
				logger.debug(`Updating folder metadata: ${folderPath}`);
				await storageService.updateFolderMeta(folderPath, body);
				logger.debug(`Folder metadata updated: ${folderPath}`);
				return c.json({ message: "Folder metadata updated." });
			} catch (error) {
				logger.error("Error updating folder metadata:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// DELETE /storage/folders/folder/:folder - Delete a folder
	.delete(
		"/folder/:folder",
		zValidator("query", parentQuerySchema),
		async (c) => {
			const storageService = c.get("storageService");
			const { parent } = c.req.valid("query");

			const decoded = {
				folder: decodeURIComponent(c.req.param("folder")),
				parent: parent ? decodeURIComponent(parent) : undefined,
			};

			const folderPath = decoded.parent
				? `${decoded.parent}/${decoded.folder}`
				: decoded.folder;

			try {
				logger.debug(`Hard deleting folder: ${folderPath}`);
				await storageService.deleteFolder(folderPath);
				logger.debug(`Folder hard-deleted: ${folderPath}`);
				return c.json({ message: "Folder permanently deleted." });
			} catch (error) {
				logger.error("Error deleting folder:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// POST /storage/folders/folder/:folder/trash - Soft-trash a folder
	.post(
		"/folder/:folder/trash",
		zValidator("query", parentQuerySchema),
		async (c) => {
			const storageService = c.get("storageService");
			const { parent } = c.req.valid("query");

			const decoded = {
				folder: decodeURIComponent(c.req.param("folder")),
				parent: parent ? decodeURIComponent(parent) : undefined,
			};

			const folderPath = decoded.parent
				? `${decoded.parent}/${decoded.folder}`
				: decoded.folder;

			try {
				logger.debug(`Trashing folder: ${folderPath}`);
				await storageService.trashFolder(folderPath);
				logger.debug(`Folder trashed: ${folderPath}`);
				return c.json({ message: "Folder moved to trash." });
			} catch (error) {
				logger.error("Error trashing folder:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// POST /storage/folders/folder/:folder/restore - Restore a trashed folder
	.post(
		"/folder/:folder/restore",
		zValidator("query", parentQuerySchema),
		async (c) => {
			const storageService = c.get("storageService");
			const { parent } = c.req.valid("query");

			const decoded = {
				folder: decodeURIComponent(c.req.param("folder")),
				parent: parent ? decodeURIComponent(parent) : undefined,
			};

			const folderPath = decoded.parent
				? `${decoded.parent}/${decoded.folder}`
				: decoded.folder;

			try {
				logger.debug(`Restoring folder: ${folderPath}`);
				await storageService.restoreFolder(folderPath);
				logger.debug(`Folder restored: ${folderPath}`);
				return c.json({ message: "Folder restored from trash." });
			} catch (error) {
				logger.error("Error restoring folder:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	);

export { foldersRouter };
