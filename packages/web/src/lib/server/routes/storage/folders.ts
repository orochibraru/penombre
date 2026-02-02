import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { Logger } from "$lib/logger";
import type { StorageRouter } from "$lib/server/api-types";
import { UnauthorizedError } from "$lib/server/errors";
import { StorageService } from "$lib/server/services/storage";

const logger = new Logger("Router::Storage::Folders");

export const newFolderSchema = z.object({
	name: z.string(),
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

	// GET /storage/folders/tree - List all folders with metadata for folder picker
	.get("/tree", async (c) => {
		const storageService = c.get("storageService");

		try {
			logger.debug("Listing folder tree for user");
			const folders = await storageService.listFoldersWithMetadata("", {
				includeTrashed: false,
			});
			logger.debug(`Found ${folders.length} folders in tree`);
			return c.json(folders);
		} catch (error) {
			logger.error("Error listing folder tree:", error);
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
			const result = await storageService.createFolder(body.name, body.parent);
			logger.debug(
				`Folder created successfully: UUID=${result.id}, name=${result.name}`,
			);
			return c.json(
				{
					message: "Folder created successfully.",
					id: result.id,
					name: result.name,
				},
				201,
			);
		} catch (error) {
			logger.error("Error creating folder:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/folders/folder/:id - Get a folder
	.get("/folder/:id", async (c) => {
		const storageService = c.get("storageService");
		const folderId = c.req.param("id");
		try {
			logger.debug(`Getting folder: ${folderId}`);
			const folder = await storageService.getFolder(folderId);
			logger.debug(`Folder retrieved: ${folderId}`);
			return c.json(folder);
		} catch (error) {
			logger.error("Error getting folder:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/folders/folder/:id/meta - Get folder metadata
	.get(
		"/folder/:id/meta",
		zValidator(
			"query",
			z.object({
				parent: z.string().optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const query = c.req.valid("query");

			const folderId = c.req.param("id");

			const folderPath = storageService.getFullFolderPath(
				folderId,
				query.parent,
			);

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

	// PUT /storage/folders/folder/:id - Update folder metadata
	.put(
		"/folder/:id",
		zValidator(
			"json",
			z.object({
				isTrashed: z.boolean().optional(),
				isStarred: z.boolean().optional(),
				tags: z.array(z.string()).optional(),
				name: z.string().optional(),
				parentFolderId: z.string().optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const body = c.req.valid("json");

			const folderId = c.req.param("id");

			const folderPath = storageService.getFullFolderPath(
				folderId,
				body.parentFolderId,
			);

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

	// DELETE /storage/folders/folder/:id - Delete a folder
	.delete(
		"/folder/:id",
		zValidator(
			"json",
			z.object({
				name: z.string().optional(),
				parentFolderId: z.string().optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const body = c.req.valid("json");

			const folderId = c.req.param("id");

			const folderPath = storageService.getFullFolderPath(
				folderId,
				body.parentFolderId,
			);
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

	// POST /storage/folders/folder/:id/trash - Soft-trash a folder
	.post(
		"/folder/:id/trash",
		zValidator(
			"json",
			z.object({
				parentFolderId: z.string().optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const body = c.req.valid("json");

			const folderId = c.req.param("id");

			const folderPath = storageService.getFullFolderPath(
				folderId,
				body.parentFolderId,
			);
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

	// POST /storage/folders/folder/:id/restore - Restore a trashed folder
	.post(
		"/folder/:id/restore",
		zValidator(
			"json",
			z.object({
				parentFolderId: z.string().optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const body = c.req.valid("json");

			const folderId = c.req.param("id");

			const folderPath = storageService.getFullFolderPath(
				folderId,
				body.parentFolderId,
			);

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
	)

	// GET /storage/folders/sizes/:prefix - Get sizes of all folders in a prefix
	.get("/sizes/:prefix", async (c) => {
		const storageService = c.get("storageService");
		const prefix = c.req.param("prefix");

		try {
			logger.debug(`Calculating folder sizes for prefix: ${prefix}`);
			const sizes = await storageService.calculateFolderSizes(prefix || "");
			const result = Object.fromEntries(sizes);
			logger.debug(`Calculated sizes for ${sizes.size} folders`);
			return c.json(result);
		} catch (error) {
			logger.error("Error calculating folder sizes:", error);
			return c.json({ message: "Internal Server Error" }, 500);
		}
	})

	// GET /storage/folders/size/:id - Get size of a specific folder
	.get(
		"/size/:id",
		zValidator(
			"query",
			z.object({
				parent: z.string().optional(),
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const query = c.req.valid("query");
			const folderId = c.req.param("id");

			const folderPath = storageService.getFullFolderPath(
				folderId,
				query.parent,
			);

			try {
				logger.debug(`Calculating folder size: ${folderPath}`);
				const size = await storageService.calculateFolderSize(folderPath);
				logger.debug(`Folder size: ${folderPath} = ${size} bytes`);
				return c.json({ size });
			} catch (error) {
				logger.error("Error calculating folder size:", error);
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	)

	// POST /storage/folders/folder/:id/move - Move a folder to a different parent
	.post(
		"/folder/:id/move",
		zValidator(
			"json",
			z.object({
				parentFolderId: z.string().optional(),
				destination: z.string(), // Empty string for root
			}),
		),
		async (c) => {
			const storageService = c.get("storageService");
			const body = c.req.valid("json");
			const folderId = c.req.param("id");

			const folderPath = storageService.getFullFolderPath(
				folderId,
				body.parentFolderId,
			);

			try {
				logger.debug(
					`Moving folder: ${folderPath} to ${body.destination || "root"}`,
				);
				await storageService.moveFolder(folderPath, body.destination);
				logger.debug(
					`Folder moved: ${folderPath} to ${body.destination || "root"}`,
				);
				return c.json({ message: "Folder moved successfully." });
			} catch (error) {
				logger.error("Error moving folder:", error);
				if (error instanceof Error && error.message.includes("into itself")) {
					return c.json({ message: "Cannot move a folder into itself." }, 400);
				}
				return c.json({ message: "Internal Server Error" }, 500);
			}
		},
	);

export { foldersRouter };
