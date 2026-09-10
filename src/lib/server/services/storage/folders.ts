/**
 * Folder operations: create, move, trash, restore, delete, and the folder
 * listings and size roll-ups built on top of them.
 *
 * Moving a folder re-roots every descendant path in the database and relocates
 * the matching objects in the storage backend.
 */

import { and, eq, isNull, like, or, sql } from "drizzle-orm";
import { Logger } from "$lib/logger";
import type { File as DbFile } from "$lib/server/db/schema";
import { files, folders } from "$lib/server/db/schema";
import { FileOrFolderNotFoundError } from "$lib/server/errors";
import type {
	DirectoryList,
	FileMetadata,
	FolderItem,
} from "$lib/server/schema";
import { CacheKeys } from "./cache";
import type { StorageContext } from "./context";
import { getFolderIdByPath, getUniqueDisplayName } from "./lookups";
import { folderDbToMetadata } from "./mappers";
import { ownedFiles, ownedFolders } from "./scope";

const logger = new Logger("StorageService");

export class FolderOperations {
	constructor(private readonly ctx: StorageContext) {}

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

	async relocateObjects(fromPrefix: string, toPrefix: string): Promise<void> {
		const allFileKeys = await this.ctx.driver.listObjectKeys(`${fromPrefix}/`);
		for (const oldKey of allFileKeys) {
			const newKey = toPrefix + oldKey.slice(fromPrefix.length);
			await this.ctx.driver.copyObject(oldKey, newKey);
			await this.ctx.driver.deleteObject(oldKey);
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
			await this.ctx.db
				.update(folders)
				.set({
					path: toPrefix + sf.path.slice(fromPrefix.length),
					updatedAt: new Date(),
				})
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

		const physicalName = normalizedKey.includes("/")
			? (normalizedKey.split("/").pop() ?? normalizedKey)
			: normalizedKey;
		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
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
			userId: this.ctx.user.id,
			action: "update",
			message: `Moved folder "${uniqueName}" to ${normalizedDest || "root"}`,
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
		const folderPath = normalizedParent
			? `${normalizedParent}/${folderId}`
			: folderId;

		const parentId = normalizedParent
			? await getFolderIdByPath(this.ctx, normalizedParent)
			: null;

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
				userId: this.ctx.user.id,
				action: "create",
				message: `Created folder: ${uniqueName}`,
				level: "info",
			});
			logger.info(
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
		try {
			const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;

			await this.ctx.driver.deleteObjectsByPrefix(`${normalizedKey}/`);

			await this.ctx.db
				.delete(files)
				.where(
					and(ownedFiles(this.ctx), like(files.path, `${normalizedKey}/%`)),
				);
			await this.ctx.db
				.delete(folders)
				.where(
					and(
						ownedFolders(this.ctx),
						or(
							eq(folders.path, normalizedKey),
							like(folders.path, `${normalizedKey}/%`),
						),
					),
				);

			await this.ctx.activityService.register({
				userId: this.ctx.user.id,
				action: "delete",
				message: `Deleted folder: ${normalizedKey}`,
				level: "info",
			});
			logger.info(`Folder deleted: ${normalizedKey}`);
			await this.ctx.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting folder:", error);
			throw new Error(`Error deleting folder with key: ${key}`);
		}
	}

	async trashFolder(key: string): Promise<void> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		const [folder] = await this.ctx.db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.path, normalizedKey), ownedFolders(this.ctx)));
		if (!folder) {
			throw new Error("Folder not found");
		}

		await this.ctx.db
			.update(files)
			.set({ isTrashed: true, updatedAt: new Date() })
			.where(and(ownedFiles(this.ctx), like(files.path, `${normalizedKey}/%`)));
		await this.ctx.db
			.update(folders)
			.set({ isTrashed: true, updatedAt: new Date() })
			.where(
				and(
					ownedFolders(this.ctx),
					or(
						eq(folders.path, normalizedKey),
						like(folders.path, `${normalizedKey}/%`),
					),
				),
			);

		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "update",
			message: `Moved folder to trash: ${normalizedKey}`,
			level: "info",
		});
		await this.ctx.invalidateListingCaches();
	}

	async restoreFolder(key: string): Promise<void> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		const [folder] = await this.ctx.db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.path, normalizedKey), ownedFolders(this.ctx)));
		if (!folder) {
			throw new Error("Folder not found");
		}

		await this.ctx.db
			.update(files)
			.set({ isTrashed: false, updatedAt: new Date() })
			.where(and(ownedFiles(this.ctx), like(files.path, `${normalizedKey}/%`)));
		await this.ctx.db
			.update(folders)
			.set({ isTrashed: false, updatedAt: new Date() })
			.where(
				and(
					ownedFolders(this.ctx),
					or(
						eq(folders.path, normalizedKey),
						like(folders.path, `${normalizedKey}/%`),
					),
				),
			);

		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "update",
			message: `Restored folder from trash: ${normalizedKey}`,
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
			throw new Error("Folder not found");
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

		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "update",
			message: `Updated folder metadata: ${normalizedId}`,
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
