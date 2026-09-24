/**
 * Listing and search: browsing a folder, the trash/recent/starred views,
 * category filters, and full-text search over names.
 *
 * Every result is cached per user and invalidated wholesale on any mutation.
 */

import {
	type AnyColumn,
	and,
	asc,
	desc,
	eq,
	gt,
	ilike,
	inArray,
	isNull,
	like,
	lt,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { LISTING_MAX_PAGE_SIZE, LISTING_PAGE_SIZE } from "#lib/pagination.js";
import { isSqliteDialect } from "#lib/server/db/dialect.js";
import type {
	File as DbFile,
	Folder as DbFolder,
} from "#lib/server/db/schema.js";
import { files, folders } from "#lib/server/db/schema.js";
import type {
	FileCategory,
	ObjectItem,
	ObjectList,
} from "#lib/server/schema.js";
import { CacheKeys } from "./cache";
import type { StorageContext } from "./context";
import { getFolderIdByPath } from "./lookups";
import {
	compareSearchRelevance,
	decodeCursor,
	encodeCursor,
	fileDbToObjectItem,
	folderDbToObjectItem,
	type ListingCursor,
	paginateItems,
} from "./mappers";
import { ownedFiles, ownedFolders } from "./scope";
import { latestSeqs } from "./versions";

export type ListingSortColumn = "name" | "size" | "updatedAt";
export type ListingSortDirection = "asc" | "desc";

export interface ListingPageOptions {
	cursor?: string | null;
	limit?: number;
	sortColumn?: ListingSortColumn;
	sortDirection?: ListingSortDirection;
}

export interface ListingPage extends ObjectList {
	nextCursor: string | null;
}

export interface TrashPage extends ListingPage {
	/** Bytes the whole trash holds, loaded or not. */
	totalSize: number;
}

function plainItems(pageFolders: DbFolder[], pageFiles: DbFile[]) {
	return [
		...pageFolders.map((f) => folderDbToObjectItem(f)),
		...pageFiles.map((f) => fileDbToObjectItem(f)),
	];
}

/**
 * `path` in byte order. Postgres' default collation may ignore `/` when
 * comparing, which breaks the prefix ranges below; `folders_trash_idx` and
 * `files_trash_idx` are built on the same expression.
 */
function bytewise(path: SQL | AnyColumn): SQL {
	return isSqliteDialect() ? sql`${path}` : sql`(${path} collate "C")`;
}

function firstSegment(path: AnyColumn): SQL {
	return isSqliteDialect()
		? sql`substr(${path}, 1, instr(${path} || '/', '/') - 1)`
		: sql`(split_part(${path}, '/', 1) collate "C")`;
}

interface SortKey {
	column: ListingSortColumn;
	direction: ListingSortDirection;
	expr: SQL | AnyColumn;
}

/** Names sort case-insensitively, like the client did; folders have no size. */
function sortKey(
	table: typeof files | typeof folders,
	column: ListingSortColumn,
	direction: ListingSortDirection,
): SortKey {
	switch (column) {
		case "name":
			return { column, direction, expr: sql`lower(${table.name})` };
		case "size":
			return table === files
				? { column, direction, expr: files.size }
				: sortKey(table, "name", "asc");
		case "updatedAt":
			return { column, direction, expr: table.updatedAt };
	}
}

function cursorFor(
	row: DbFile | DbFolder,
	key: SortKey,
	kind: "file" | "folder",
): string {
	const v =
		key.column === "name"
			? row.name
			: key.column === "size"
				? (row as DbFile).size
				: row.updatedAt.getTime();
	return encodeCursor(
		kind === "folder" ? { v, id: row.id, k: "folder" } : { v, id: row.id },
	);
}

/**
 * `(sortKey, id) > (cursor.v, cursor.id)`, `<` for "desc". `id` is the
 * tiebreaker, or a page boundary on a tie could skip or repeat a row. The name
 * is lowered by the database on both sides, never by JS: SQLite's `lower`
 * folds ASCII only.
 */
function keysetAfter(key: SortKey, id: AnyColumn, cursor: ListingCursor) {
	const cmp = key.direction === "asc" ? gt : lt;
	const v =
		key.column === "name"
			? sql`lower(cast(${String(cursor.v)} as text))`
			: key.column === "size"
				? Number(cursor.v)
				: new Date(cursor.v);
	// A column still maps `v` through its own encoder whatever the static type.
	const expr = key.expr as SQL;
	return or(cmp(expr, v), and(eq(expr, v), cmp(id, cursor.id)));
}

/** A listing route's query string, as the service takes it. */
export function pageOptions(query: {
	cursor?: string;
	limit?: string;
	sort?: ListingSortColumn;
	dir?: ListingSortDirection;
}): ListingPageOptions {
	return {
		cursor: query.cursor ?? null,
		limit: query.limit ? Number(query.limit) : undefined,
		sortColumn: query.sort,
		sortDirection: query.dir,
	};
}

function pageSize(limit: number | undefined): number {
	return Math.min(
		Math.max(Number.isFinite(limit) ? Number(limit) : LISTING_PAGE_SIZE, 1),
		LISTING_MAX_PAGE_SIZE,
	);
}

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

	/**
	 * The trash, one keyset page at a time: only top-level entries (nothing
	 * under another trashed folder), each folder priced by the trashed files
	 * beneath it. Keys are full paths, unlike a folder listing: the trash is
	 * flat, so a row has no folder context to be re-attached to.
	 */
	async listTrashFiles(options: ListingPageOptions = {}): Promise<TrashPage> {
		const [page, totalSize] = await Promise.all([
			this.mixedPage(CacheKeys.trashed(), this.trashWhere(), options, (f, x) =>
				this.trashItems(f, x),
			),
			this.trashSize(),
		]);
		return { ...page, totalSize };
	}

	private trashWhere() {
		return {
			folders: and(
				ownedFolders(this.ctx),
				eq(folders.isTrashed, true),
				this.notUnderTrashedFolder(folders.path),
			),
			files: and(
				ownedFiles(this.ctx),
				eq(files.isTrashed, true),
				this.notUnderTrashedFolder(files.path),
			),
		};
	}

	/**
	 * No trashed folder's path is a proper prefix of `path`. The range bounds
	 * (an ancestor sorts between the first segment and the path itself) are
	 * what keep the probe on `folders_trash_idx`; the `substr` is the test.
	 */
	private notUnderTrashedFolder(path: AnyColumn): SQL {
		const volume =
			this.ctx.volumeId === null
				? sql`ancestor.volume_id is null`
				: sql`ancestor.volume_id = ${this.ctx.volumeId}`;
		return sql`not exists (select 1 from ${folders} as ancestor where ancestor.owner_id = ${this.ctx.user.id} and ${volume} and ancestor.is_trashed = ${true} and ${bytewise(sql`ancestor.path`)} < ${bytewise(path)} and ${bytewise(sql`ancestor.path`)} >= ${firstSegment(path)} and substr(${path}, 1, length(ancestor.path) + 1) = ancestor.path || '/')`;
	}

	private async trashItems(
		pageFolders: DbFolder[],
		pageFiles: DbFile[],
	): Promise<ObjectItem[]> {
		// A select field renders `folders.path` unqualified, which would bind to `x`.
		const folderPath = sql`${sql.identifier("folders")}.${sql.identifier("path")}`;
		const sizes =
			pageFolders.length === 0
				? []
				: await this.ctx.db
						.select({
							id: folders.id,
							size: sql<number>`(select coalesce(sum(x.size), 0) from ${files} as x where x.owner_id = ${this.ctx.user.id} and ${
								this.ctx.volumeId === null
									? sql`x.volume_id is null`
									: sql`x.volume_id = ${this.ctx.volumeId}`
							} and x.is_trashed = ${true} and ${bytewise(sql`x.path`)} > ${folderPath} || '/' and ${bytewise(sql`x.path`)} < ${folderPath} || '0')`,
						})
						.from(folders)
						.where(
							inArray(
								folders.id,
								pageFolders.map((f) => f.id),
							),
						);
		const sizeById = new Map(sizes.map((s) => [s.id, Number(s.size)]));
		return [
			...pageFolders.map((f) => ({
				...folderDbToObjectItem(f),
				key: `${f.path}/`,
				size: sizeById.get(f.id) ?? 0,
			})),
			...pageFiles.map((f) => ({ ...fileDbToObjectItem(f), key: f.path })),
		];
	}

	/** What emptying the trash frees: every trashed file, nested or not. */
	private async trashSize(): Promise<number> {
		const cacheKey = `${CacheKeys.trashed()}:size`;
		const cached = await this.ctx.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}
		const [row] = await this.ctx.db
			.select({ size: sql<number>`coalesce(sum(${files.size}), 0)` })
			.from(files)
			.where(and(ownedFiles(this.ctx), eq(files.isTrashed, true)));
		const size = Number(row?.size ?? 0);
		await this.ctx.cache.set(cacheKey, size);
		return size;
	}

	/**
	 * Keyset pagination: a category listing (Reaper media libraries run to
	 * tens of thousands of files) used to fetch and sort every row in memory
	 * on every request. Keyset resumes from `(sortKey, id)` on the last row
	 * seen, so a page costs the same regardless of how deep it is.
	 */
	listFilesPerCategory(
		category: FileCategory,
		options: ListingPageOptions = {},
	): Promise<ListingPage> {
		return this.mixedPage(
			`category:${category}`,
			{
				folders: undefined,
				files: and(
					ownedFiles(this.ctx),
					eq(files.category, category),
					eq(files.isTrashed, false),
				),
			},
			options,
		);
	}

	/**
	 * A folder's children, one keyset page at a time: every folder before any
	 * file, each in the requested order. The cursor names the segment of the
	 * last row, so a page resumes in folders or in files; both stay on their
	 * own index, with no UNION.
	 */
	async listFolderPage(
		prefix: string | undefined,
		options: ListingPageOptions = {},
	): Promise<ListingPage> {
		const path = prefix?.replace(/\/$/, "") ?? "";
		const folderId = path ? await getFolderIdByPath(this.ctx, path) : null;
		if (path && folderId === null) {
			return { list: [], count: 0, total: 0, nextCursor: null };
		}
		return this.mixedPage(
			CacheKeys.listing(path, "page"),
			{
				folders: and(
					ownedFolders(this.ctx),
					folderId ? eq(folders.parentId, folderId) : isNull(folders.parentId),
					eq(folders.isTrashed, false),
				),
				files: and(
					ownedFiles(this.ctx),
					folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
					eq(files.isTrashed, false),
				),
			},
			options,
		);
	}

	listStarredFiles(options: ListingPageOptions = {}): Promise<ListingPage> {
		return this.mixedPage(
			CacheKeys.starred(),
			{
				folders: and(
					ownedFolders(this.ctx),
					eq(folders.isStarred, true),
					eq(folders.isTrashed, false),
				),
				files: and(
					ownedFiles(this.ctx),
					eq(files.isStarred, true),
					eq(files.isTrashed, false),
				),
			},
			options,
		);
	}

	/**
	 * One page over folders (when `where.folders` is set) then files. Folders
	 * are read first; files fill whatever the page has left, plus one row to
	 * tell "more" from "done" without a second round trip.
	 */
	private async mixedPage(
		cacheBase: string,
		where: { folders: SQL | undefined; files: SQL | undefined },
		options: ListingPageOptions,
		toItems: (
			pageFolders: DbFolder[],
			pageFiles: DbFile[],
		) => ObjectItem[] | Promise<ObjectItem[]> = plainItems,
	): Promise<ListingPage> {
		const sortColumn = options.sortColumn ?? "updatedAt";
		const sortDirection = options.sortDirection ?? "desc";
		const limit = pageSize(options.limit);
		const cacheKey = `${cacheBase}:${sortColumn}:${sortDirection}:${limit}:${options.cursor ?? "start"}`;
		const cached = await this.ctx.cache.get<ListingPage>(cacheKey);
		if (cached) {
			return cached;
		}

		const cursor = options.cursor ? decodeCursor(options.cursor) : null;
		const inFiles = cursor !== null && cursor.k !== "folder";
		const folderKey = sortKey(folders, sortColumn, sortDirection);
		const fileKey = sortKey(files, sortColumn, sortDirection);
		const order = (key: SortKey) => (key.direction === "asc" ? asc : desc);

		const folderRows =
			where.folders && !inFiles
				? await this.ctx.db
						.select()
						.from(folders)
						.where(
							and(
								where.folders,
								cursor ? keysetAfter(folderKey, folders.id, cursor) : undefined,
							),
						)
						.orderBy(
							order(folderKey)(folderKey.expr),
							order(folderKey)(folders.id),
						)
						.limit(limit + 1)
				: [];
		const fileRows =
			folderRows.length > limit
				? []
				: await this.ctx.db
						.select()
						.from(files)
						.where(
							and(
								where.files,
								inFiles && cursor
									? keysetAfter(fileKey, files.id, cursor)
									: undefined,
							),
						)
						.orderBy(order(fileKey)(fileKey.expr), order(fileKey)(files.id))
						.limit(limit - folderRows.length + 1);

		const pageFolders = folderRows.slice(0, limit);
		const pageFiles = fileRows.slice(0, limit - pageFolders.length);
		const hasMore = folderRows.length + fileRows.length > limit;
		const lastFile = pageFiles.at(-1);
		const lastFolder = pageFolders.at(-1);
		const nextCursor = !hasMore
			? null
			: lastFile
				? cursorFor(lastFile, fileKey, "file")
				: lastFolder
					? cursorFor(lastFolder, folderKey, "folder")
					: null;

		const list = await toItems(pageFolders, pageFiles);
		const seqs = await latestSeqs(
			this.ctx,
			pageFiles.map((file) => file.id),
		);
		for (const item of list) {
			const seq = seqs.get(item.metadata.id);
			if (seq !== undefined) {
				item.metadata.versionSeq = seq;
			}
		}
		const result: ListingPage = {
			list,
			count: list.length,
			total: await this.countListing(cacheBase, where),
			nextCursor,
		};
		await this.ctx.cache.set(cacheKey, result);
		return result;
	}

	private async countListing(
		cacheBase: string,
		where: { folders: SQL | undefined; files: SQL | undefined },
	): Promise<number> {
		const cacheKey = `${cacheBase}:total`;
		const cached = await this.ctx.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}
		const count = sql<number>`COUNT(*)`;
		const [[fileCount], [folderCount]] = await Promise.all([
			this.ctx.db.select({ count }).from(files).where(where.files),
			where.folders
				? this.ctx.db.select({ count }).from(folders).where(where.folders)
				: [{ count: 0 }],
		]);
		const total =
			Number(fileCount?.count ?? 0) + Number(folderCount?.count ?? 0);
		await this.ctx.cache.set(cacheKey, total);
		return total;
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

	/** The trash listing's own total, so the badge cannot disagree with it. */
	countTrashedItems(): Promise<number> {
		return this.countListing(CacheKeys.trashed(), this.trashWhere());
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
