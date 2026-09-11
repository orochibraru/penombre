/**
 * Listing and search: browsing a folder, the trash/recent/starred views,
 * category filters, and full-text search over names.
 *
 * Every result is cached per user and invalidated wholesale on any mutation.
 */

import { and, desc, eq, ilike, inArray, isNull, like, sql } from "drizzle-orm";
import { isSqliteDialect } from "$lib/server/db/dialect";
import type { File as DbFile, Folder as DbFolder } from "$lib/server/db/schema";
import { files, folders } from "$lib/server/db/schema";
import type { FileCategory, ObjectItem, ObjectList } from "$lib/server/schema";
import { CacheKeys } from "./cache";
import type { StorageContext } from "./context";
import { getFolderIdByPath } from "./lookups";
import {
	compareSearchRelevance,
	fileDbToObjectItem,
	folderDbToObjectItem,
	paginateItems,
} from "./mappers";
import { ownedFiles, ownedFolders } from "./scope";

/**
 * SQLite has no ILIKE — its LIKE is already case-insensitive for ASCII.
 * Same signature either way, so the call sites don't care which one this is.
 */
const nameLike = isSqliteDialect() ? like : ilike;

export class ListingOperations {
	constructor(private readonly ctx: StorageContext) {}

	fetchDirectChildren(
		folderId: string | null,
		options: { includeTrashed?: boolean; category?: FileCategory },
	): Promise<[DbFile[], DbFolder[]]> {
		const hideTrashed = options.includeTrashed
			? undefined
			: eq(files.isTrashed, false);

		return Promise.all([
			this.ctx.db
				.select()
				.from(files)
				.where(
					and(
						ownedFiles(this.ctx),
						folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
						hideTrashed,
						options.category ? eq(files.category, options.category) : undefined,
					),
				),
			this.ctx.db
				.select()
				.from(folders)
				.where(
					and(
						ownedFolders(this.ctx),
						folderId
							? eq(folders.parentId, folderId)
							: isNull(folders.parentId),
						options.includeTrashed ? undefined : eq(folders.isTrashed, false),
					),
				),
		]);
	}

	async abstractListFiles(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
		recursive?: boolean;
		limit?: number;
		offset?: number;
	}): Promise<ObjectList> {
		const prefix = options.parent ?? "";
		const cacheKey = CacheKeys.listing(prefix, JSON.stringify(options));
		const cached = await this.ctx.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

		if (options.recursive) {
			const result = await this.listFilesRecursive(options);
			await this.ctx.cache.set(cacheKey, result);
			return result;
		}

		const normalizedPrefix = prefix.endsWith("/")
			? prefix.slice(0, -1)
			: prefix;
		const folderId = normalizedPrefix
			? await getFolderIdByPath(this.ctx, normalizedPrefix)
			: null;

		// Prefix given but folder not found → return empty
		if (normalizedPrefix && folderId === null) {
			const empty: ObjectList = { list: [], count: 0, total: 0 };
			await this.ctx.cache.set(cacheKey, empty);
			return empty;
		}

		const [childFiles, childFolders] = await this.fetchDirectChildren(
			folderId,
			options,
		);

		const items: ObjectItem[] = [
			...childFolders.map((f) => folderDbToObjectItem(f)),
			...childFiles.map((f) => fileDbToObjectItem(f)),
		];
		items.sort((a, b) => a.key.localeCompare(b.key));

		const result = paginateItems(items, options);
		await this.ctx.cache.set(cacheKey, result);
		return result;
	}

	async listFilesRecursive(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
	}): Promise<ObjectList> {
		const prefix = options.parent ?? "";
		const normalizedPrefix = prefix.endsWith("/")
			? prefix.slice(0, -1)
			: prefix;

		const allUserFolders = await this.ctx.db
			.select()
			.from(folders)
			.where(ownedFolders(this.ctx));
		const folderById = new Map(allUserFolders.map((f) => [f.id, f]));

		const allFiles = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(
					ownedFiles(this.ctx),
					normalizedPrefix
						? like(files.path, `${normalizedPrefix}/%`)
						: undefined,
					options.includeTrashed ? undefined : eq(files.isTrashed, false),
					options.category ? eq(files.category, options.category) : undefined,
				),
			);

		const items: ObjectItem[] = allFiles.map((f) => {
			const item = fileDbToObjectItem(f);
			if (f.folderId) {
				const parentFolder = folderById.get(f.folderId);
				if (parentFolder) {
					item.parent = parentFolder.name;
					item.parentKey = parentFolder.path;
				}
			}
			return item;
		});

		return { list: items, count: items.length, total: items.length };
	}

	async listTrashFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.trashed();
		const cached = await this.ctx.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

		const [trashedFiles, trashedFolders] = await Promise.all([
			this.ctx.db
				.select()
				.from(files)
				.where(and(ownedFiles(this.ctx), eq(files.isTrashed, true))),
			this.ctx.db
				.select()
				.from(folders)
				.where(and(ownedFolders(this.ctx), eq(folders.isTrashed, true))),
		]);

		const list = [
			...trashedFolders.map((f) => folderDbToObjectItem(f)),
			...trashedFiles.map((f) => fileDbToObjectItem(f)),
		];
		const result: ObjectList = { list, count: list.length, total: list.length };
		await this.ctx.cache.set(cacheKey, result);
		return result;
	}

	async listFilesPerCategory(category: FileCategory): Promise<ObjectList> {
		const cacheKey = `category:${category}`;
		const cached = await this.ctx.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

		const categoryFiles = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(
					ownedFiles(this.ctx),
					eq(files.category, category),
					eq(files.isTrashed, false),
				),
			);
		const list = categoryFiles.map((f) => fileDbToObjectItem(f));
		const result: ObjectList = { list, count: list.length, total: list.length };
		await this.ctx.cache.set(cacheKey, result);
		return result;
	}

	listFiles(
		prefix?: string,
		options?: { limit?: number; offset?: number },
	): Promise<ObjectList> {
		const normalizedPrefix =
			prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix;
		return this.abstractListFiles({ parent: normalizedPrefix, ...options });
	}

	async listRecentFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.recent();
		const cached = await this.ctx.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

		const recentFiles = await this.ctx.db
			.select()
			.from(files)
			.where(and(ownedFiles(this.ctx), eq(files.isTrashed, false)))
			.orderBy(desc(files.updatedAt))
			.limit(25);

		const folderIds = [
			...new Set(
				recentFiles
					.filter(
						(f): f is typeof f & { folderId: string } => f.folderId !== null,
					)
					.map((f) => f.folderId),
			),
		];
		const parentFolders =
			folderIds.length > 0
				? await this.ctx.db
						.select({
							id: folders.id,
							name: folders.name,
							path: folders.path,
						})
						.from(folders)
						.where(and(ownedFolders(this.ctx), inArray(folders.id, folderIds)))
				: [];
		const folderMap = new Map(parentFolders.map((f) => [f.id, f]));

		const list = recentFiles.map((f) => {
			const item = fileDbToObjectItem(f);
			if (f.folderId) {
				const pf = folderMap.get(f.folderId);
				if (pf) {
					item.parent = pf.name;
					item.parentKey = pf.path;
				}
			}
			return item;
		});

		const result: ObjectList = { list, count: list.length, total: list.length };
		await this.ctx.cache.set(cacheKey, result);
		return result;
	}

	async listStarredFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.starred();
		const cached = await this.ctx.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

		const [starredFiles, starredFolders] = await Promise.all([
			this.ctx.db
				.select()
				.from(files)
				.where(
					and(
						ownedFiles(this.ctx),
						eq(files.isStarred, true),
						eq(files.isTrashed, false),
					),
				),
			this.ctx.db
				.select()
				.from(folders)
				.where(
					and(
						ownedFolders(this.ctx),
						eq(folders.isStarred, true),
						eq(folders.isTrashed, false),
					),
				),
		]);

		const fileItems = starredFiles.map((f) => fileDbToObjectItem(f));
		const folderItems = starredFolders.map((f) => folderDbToObjectItem(f));
		const combined = [...folderItems, ...fileItems].sort((a, b) => {
			const aIsFolder = a.type === "folder";
			const bIsFolder = b.type === "folder";
			if (aIsFolder && !bIsFolder) {
				return -1;
			}
			if (!aIsFolder && bIsFolder) {
				return 1;
			}
			return (a.metadata.name || a.key).localeCompare(b.metadata.name || b.key);
		});

		const result: ObjectList = {
			list: combined,
			count: combined.length,
			total: combined.length,
		};
		await this.ctx.cache.set(cacheKey, result);
		return result;
	}

	async searchFiles(query: string, limit = 50): Promise<ObjectList> {
		if (!query || query.trim().length === 0) {
			return { list: [], count: 0, total: 0 };
		}
		const searchTerm = query.toLowerCase().trim();

		const [matchedFiles, matchedFolders] = await Promise.all([
			this.ctx.db
				.select()
				.from(files)
				.where(
					and(ownedFiles(this.ctx), nameLike(files.name, `%${searchTerm}%`)),
				),
			this.ctx.db
				.select()
				.from(folders)
				.where(
					and(
						ownedFolders(this.ctx),
						nameLike(folders.name, `%${searchTerm}%`),
					),
				),
		]);

		const allMatches: ObjectItem[] = [
			...matchedFolders.map((f) => folderDbToObjectItem(f)),
			...matchedFiles.map((f) => fileDbToObjectItem(f)),
		];

		allMatches.sort((a, b) => compareSearchRelevance(a, b, searchTerm));

		const limited = allMatches.slice(0, limit);
		return { list: limited, count: limited.length, total: allMatches.length };
	}

	async countTrashedItems(): Promise<number> {
		const cacheKey = `${CacheKeys.counts()}:trashed`;
		const cached = await this.ctx.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const [result] = await this.ctx.db
			.select({ count: sql<number>`COUNT(*)` })
			.from(files)
			.where(and(ownedFiles(this.ctx), eq(files.isTrashed, true)));
		const count = Number(result?.count ?? 0);
		await this.ctx.cache.set(cacheKey, count);
		return count;
	}

	async countStarredItems(): Promise<number> {
		const cacheKey = `${CacheKeys.counts()}:starred`;
		const cached = await this.ctx.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const [result] = await this.ctx.db
			.select({ count: sql<number>`COUNT(*)` })
			.from(files)
			.where(and(ownedFiles(this.ctx), eq(files.isStarred, true)));
		const count = Number(result?.count ?? 0);
		await this.ctx.cache.set(cacheKey, count);
		return count;
	}
}
