/**
 * Folder operations: create, move, trash, restore, delete, and the folder
 * listings and size roll-ups built on top of them.
 *
 * Moving a folder re-roots every descendant path in the database and relocates
 * the matching objects in the storage backend.
 */

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, isNull, like, or, sql } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import type { File as DbFile } from "#lib/server/db/schema.js";
import { files, folders } from "#lib/server/db/schema.js";
import {
	FileOrFolderNotFoundError,
	rethrowUnreachable,
} from "#lib/server/errors.js";
import type {
	DirectoryList,
	FileMetadata,
	FolderItem,
} from "#lib/server/schema.js";
import { CacheKeys } from "./cache";
import type { StorageContext } from "./context";
import { purgeGrantsFor } from "./grants";
import { diskName, getFolderIdByPath, getUniqueDisplayName } from "./lookups";
import { folderDbToMetadata } from "./mappers";
import { ownedFiles, ownedFolders } from "./scope";
import type { ThumbnailService } from "./thumbnails";
import { dropVersionBytes } from "./versions";

const logger = new Logger("StorageService");

export class FolderOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
	) {}

	async getFolder(folderId: string): Promise<string> {
		const normalizedId = folderId.endsWith("/")
			? folderId.slice(0, -1)
			: folderId;
		const [folder] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, normalizedId), ownedFolders(this.ctx)));
		if (!folder) {
			throw new FileOrFolderNotFoundError(`Folder not found: ${folderId}`);
		}
		return `${normalizedId}/`;
	}

	/** The scan drops any folder row whose directory is missing. */
	private async ensureDir(path: string): Promise<void> {
		const dir = join(this.ctx.storagePath, path);
		await mkdir(dir, { recursive: true }).catch((error: unknown) =>
			rethrowUnreachable(error, dir),
		);
	}

	async relocateObjects(fromPrefix: string, toPrefix: string): Promise<void> {
		const allFileKeys = await this.ctx.driver.listObjectKeys(`${fromPrefix}/`);
		for (const oldKey of allFileKeys) {
			const newKey = toPrefix + oldKey.slice(fromPrefix.length);
			await this.ctx.driver.copyObject(oldKey, newKey);
			await this.ctx.driver.deleteObject(oldKey);
			// Every descendant got a new key; its old thumbnail/peaks would
			// otherwise sit on disk forever, unreachable by any path a
			// listing uses.
			await this.thumbnails.deleteThumbnails(oldKey);
		}
	}

	async repathDescendants(
		fromPrefix: string,
		toPrefix: string,
		filesUnder: DbFile[],
	): Promise<void> {
		for (const f of filesUnder) {
			await this.ctx.db
				.update(files)
				.set({
					path: toPrefix + f.path.slice(fromPrefix.length),
					updatedAt: new Date(),
				})
				.where(eq(files.id, f.id));
		}

		const allSubFolders = await this.ctx.db
			.select()
			.from(folders)
			.where(
				and(ownedFolders(this.ctx), like(folders.path, `${fromPrefix}/%`)),
			);
		for (const sf of allSubFolders) {
			const path = toPrefix + sf.path.slice(fromPrefix.length);
			await this.ensureDir(path);
			await this.ctx.db
				.update(folders)
				.set({ path, updatedAt: new Date() })
				.where(eq(folders.id, sf.id));
		}
	}

	async moveFolder(
		folderKey: string,
		destinationFolder: string,
	): Promise<void> {
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;
		const [folder] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, normalizedKey), ownedFolders(this.ctx)));
		if (!folder) {
			throw new FileOrFolderNotFoundError("Folder not found");
		}

		const uniqueName = await getUniqueDisplayName(
			this.ctx,
			folder.name,
			destinationFolder || undefined,
			"folder",
		);

		const currentSegment = normalizedKey.includes("/")
			? (normalizedKey.split("/").pop() ?? normalizedKey)
			: normalizedKey;
		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const physicalName = await diskName(this.ctx, normalizedDest, uniqueName, {
			fallback: currentSegment,
			self: normalizedKey,
		});
		const newFolderPath = normalizedDest
			? `${normalizedDest}/${physicalName}`
			: physicalName;

		if (newFolderPath.startsWith(`${normalizedKey}/`)) {
			throw new Error("Cannot move a folder into itself");
		}

		// Query DB-tracked files under this folder path first
		const allFilesUnder = await this.ctx.db
			.select()
			.from(files)
			.where(and(ownedFiles(this.ctx), like(files.path, `${normalizedKey}/%`)));

		// Only touch the driver when there are actual files to move (avoids errors on empty folders)
		if (allFilesUnder.length > 0) {
			await this.relocateObjects(normalizedKey, newFolderPath);
		}

		await this.ensureDir(newFolderPath);
		await this.repathDescendants(normalizedKey, newFolderPath, allFilesUnder);

		// Update the root folder itself
		const newParentId = normalizedDest
			? await getFolderIdByPath(this.ctx, normalizedDest)
			: null;
		await this.ctx.db
			.update(folders)
			.set({
				path: newFolderPath,
				name: uniqueName,
				parentId: newParentId,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, folder.id));

		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "update",
			message: "Moved a folder",
			level: "info",
		});
		await this.ctx.invalidateListingCaches();
	}

	async createFolder(
		name: string,
		parent?: string,
	): Promise<{ id: string; name: string }> {
		logger.info(`Creating folder: name=${name}, parent=${parent}`);

		const normalizedParent = parent
			? parent.endsWith("/")
				? parent.slice(0, -1)
				: parent
			: undefined;

		const uniqueName = await getUniqueDisplayName(
			this.ctx,
			name,
			normalizedParent,
			"folder",
		);

		const folderId = crypto.randomUUID();
		const segment = await diskName(this.ctx, normalizedParent, uniqueName, {
			fallback: folderId,
		});
		const folderPath = normalizedParent
			? `${normalizedParent}/${segment}`
			: segment;

		const parentId = normalizedParent
			? await getFolderIdByPath(this.ctx, normalizedParent)
			: null;

		await this.ensureDir(folderPath);
		try {
			await this.ctx.db.insert(folders).values({
				id: folderId,
				name: uniqueName,
				ownerId: this.ctx.user.id,
				volumeId: this.ctx.volumeId,
				path: folderPath,
				parentId,
				isTrashed: false,
				isStarred: false,
				tags: [],
			});
			await this.ctx.activityService.register({
				userId: this.ctx.actor.id,
				action: "create",
				message: "Created a folder",
				level: "info",
			});
			logger.debug(
				`Folder created: UUID=${folderId}, name=${uniqueName}, path=${folderPath}`,
			);
			await this.ctx.invalidateListingCaches();
			return { id: folderId, name: uniqueName };
		} catch (error) {
			logger.error("Error creating folder:", error);
			throw new Error("Failed to create folder");
		}
	}

	async deleteFolder(key: string): Promise<void> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		// Deleting a path that matches no row used to answer 200 while doing
		// nothing, so a failed empty-trash looked like a successful one.
		await this.requireFolder(normalizedKey);

		try {
			await this.ctx.driver.deleteObjectsByPrefix(`${normalizedKey}/`);

			const deletedFiles = await this.ctx.db
				.delete(files)
				.where(
					and(ownedFiles(this.ctx), like(files.path, `${normalizedKey}/%`)),
				)
				.returning({ id: files.id });
			const deletedFolders = await this.ctx.db
				.delete(folders)
				.where(
					and(
						ownedFolders(this.ctx),
						or(
							eq(folders.path, normalizedKey),
							like(folders.path, `${normalizedKey}/%`),
						),
					),
				)
				.returning({ id: folders.id });
			await purgeGrantsFor(
				this.ctx.db,
				"file",
				deletedFiles.map((f) => f.id),
			);
			await dropVersionBytes(
				this.ctx,
				deletedFiles.map((f) => f.id),
			);
			await purgeGrantsFor(
				this.ctx.db,
				"folder",
				deletedFolders.map((f) => f.id),
			);

			await this.ctx.activityService.register({
				userId: this.ctx.actor.id,
				action: "delete",
				message: "Deleted a folder",
				level: "info",
			});
			logger.debug(`Folder deleted: ${normalizedKey}`);
			await this.ctx.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting folder:", error);
			throw new Error(`Error deleting folder with key: ${key}`);
		}
	}

	/**
	 * Trash state is a property of the whole subtree.
	 *
	 * Leaving descendants untouched hid them from the drive (their parent is
	 * gone from the listing) while keeping them out of the trash, so nothing
	 * could restore or delete them and their bytes were never freed.
	 */
	private async setTrashedRecursively(
		normalizedKey: string,
		isTrashed: boolean,
	): Promise<void> {
		const updatedAt = new Date();
		await this.ctx.db
			.update(files)
			.set({ isTrashed, updatedAt })
			.where(and(ownedFiles(this.ctx), like(files.path, `${normalizedKey}/%`)));
		await this.ctx.db
			.update(folders)
			.set({ isTrashed, updatedAt })
			.where(
				and(
					ownedFolders(this.ctx),
					or(
						eq(folders.path, normalizedKey),
						like(folders.path, `${normalizedKey}/%`),
					),
				),
			);
	}

	private async requireFolder(normalizedKey: string): Promise<void> {
		const [folder] = await this.ctx.db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.path, normalizedKey), ownedFolders(this.ctx)));
		if (!folder) {
			throw new FileOrFolderNotFoundError(`Folder not found: ${normalizedKey}`);
		}
	}

	async trashFolder(key: string): Promise<void> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		await this.requireFolder(normalizedKey);
		await this.setTrashedRecursively(normalizedKey, true);

		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "update",
			message: "Moved a folder to trash",
			level: "info",
		});
		await this.ctx.invalidateListingCaches();
	}

	async restoreFolder(key: string): Promise<void> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		await this.requireFolder(normalizedKey);
		await this.setTrashedRecursively(normalizedKey, false);

		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "update",
			message: "Restored a folder from trash",
			level: "info",
		});
		await this.ctx.invalidateListingCaches();
	}

	async updateFolderMeta(
		id: string,
		data: {
			isTrashed?: boolean;
			isStarred?: boolean;
			tags?: string[];
			name?: string;
		},
	): Promise<void> {
		const normalizedId = id.endsWith("/") ? id.slice(0, -1) : id;
		const [folder] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, normalizedId), ownedFolders(this.ctx)));
		if (!folder) {
			throw new FileOrFolderNotFoundError(`Folder not found: ${normalizedId}`);
		}

		const updates: Partial<typeof folders.$inferInsert> = {
			updatedAt: new Date(),
		};
		if (typeof data.isTrashed === "boolean") {
			updates.isTrashed = data.isTrashed;
		}
		if (typeof data.isStarred === "boolean") {
			updates.isStarred = data.isStarred;
		}
		if (Array.isArray(data.tags)) {
			updates.tags = data.tags;
		}
		if (typeof data.name === "string") {
			updates.name = data.name;
		}

		await this.ctx.db
			.update(folders)
			.set(updates)
			.where(eq(folders.id, folder.id));

		// The UI trashes and restores a folder through this route, so the
		// subtree has to follow — see setTrashedRecursively.
		if (typeof data.isTrashed === "boolean") {
			await this.setTrashedRecursively(normalizedId, data.isTrashed);
		}

		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "update",
			message: "Updated folder metadata",
			level: "info",
		});
		await this.ctx.invalidateListingCaches();
	}

	async getFolderMeta(folderId: string): Promise<FileMetadata | null> {
		const normalizedId = folderId.endsWith("/")
			? folderId.slice(0, -1)
			: folderId;
		const [folder] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, normalizedId), ownedFolders(this.ctx)));
		if (!folder) {
			logger.warn(`Folder not found: ${folderId}`);
			return null;
		}
		return folderDbToMetadata(folder);
	}

	getFullFolderPath(folderId: string, parentId?: string): string {
		const folderPrefix = folderId.endsWith("/") ? folderId : `${folderId}/`;
		if (parentId) {
			const parentPrefix = parentId.endsWith("/") ? parentId : `${parentId}/`;
			return `${parentPrefix}${folderPrefix}`;
		}
		return folderPrefix;
	}

	async folderExists(key: string): Promise<boolean> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		const [folder] = await this.ctx.db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.path, normalizedKey), ownedFolders(this.ctx)));
		return !!folder;
	}

	async listFolders(
		prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<DirectoryList> {
		const normalizedPrefix = !prefix || prefix === "/" ? "" : prefix;
		const cacheKey = CacheKeys.folders(
			normalizedPrefix,
			Boolean(options?.onlyTrashed),
		);
		const cached = await this.ctx.cache.get<DirectoryList>(cacheKey);
		if (cached) {
			return cached;
		}

		const parentFolderId = normalizedPrefix
			? await getFolderIdByPath(this.ctx, normalizedPrefix)
			: null;

		const rows = await this.ctx.db
			.select({ id: folders.id, isTrashed: folders.isTrashed })
			.from(folders)
			.where(
				and(
					ownedFolders(this.ctx),
					options?.onlyTrashed
						? eq(folders.isTrashed, true)
						: parentFolderId
							? eq(folders.parentId, parentFolderId)
							: isNull(folders.parentId),
				),
			);

		const result: string[] = rows
			.filter((r) => {
				if (!(options?.includeTrashed || options?.onlyTrashed)) {
					return !r.isTrashed;
				}
				return true;
			})
			.map((r) => r.id);

		await this.ctx.cache.set(cacheKey, result);
		return result;
	}

	async listFoldersWithMetadata(
		_prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<FolderItem[]> {
		const allFolders = await this.ctx.db
			.select()
			.from(folders)
			.where(ownedFolders(this.ctx));

		return allFolders
			.filter((f) => {
				if (options?.onlyTrashed) {
					return f.isTrashed;
				}
				if (!options?.includeTrashed) {
					return !f.isTrashed;
				}
				return true;
			})
			.map((f) => ({
				id: f.id,
				name: f.name,
				path: f.path,
			}));
	}

	async calculateFolderSize(folderKey: string): Promise<number> {
		logger.info(`Calculating size for folder: ${folderKey}`);
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;
		const cacheKey = `folder-size:${normalizedKey}`;
		const cached = await this.ctx.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const [result] = await this.ctx.db
			.select({ totalSize: sql<number>`COALESCE(SUM(${files.size}), 0)` })
			.from(files)
			.where(and(ownedFiles(this.ctx), like(files.path, `${normalizedKey}/%`)));
		const totalSize = Number(result?.totalSize ?? 0);
		await this.ctx.cache.set(cacheKey, totalSize, 300);
		logger.info(
			`Calculated size for folder: ${folderKey}, size: ${totalSize} bytes`,
		);
		return totalSize;
	}

	async calculateFolderSizes(prefix: string): Promise<Map<string, number>> {
		const sizes = new Map<string, number>();
		const folderList = await this.listFolders(prefix, { includeTrashed: true });
		for (const folderId of folderList) {
			const folderPath = prefix ? `${prefix}/${folderId}` : folderId;
			try {
				const size = await this.calculateFolderSize(folderPath);
				sizes.set(folderId, size);
			} catch {
				sizes.set(folderId, 0);
			}
		}
		return sizes;
	}
}
