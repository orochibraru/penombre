/**
 * File versions: earlier bytes of a file, hard-linked under
 * `<root>/.versions/<fileId>/<versionId>`. A dot-directory at the root, so the
 * scan never imports them and folder moves and prefix deletes never touch
 * them. Rows cascade with the file; bytes go through `dropVersionBytes`.
 */

import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { and, desc, eq, inArray, lt, max, or, sql } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import {
	type File as DbFile,
	type FileVersion,
	type FolderSettingsData,
	fileVersions,
	folders,
	user,
} from "#lib/server/db/schema.js";
import { getAppSettings } from "#lib/server/services/app-settings.js";
import type { StorageContext } from "./context";
import { ownedFolders } from "./scope";

const logger = new Logger("StorageVersions");

export const DEFAULT_MAX_VERSIONS = 10;

export interface AdminVersioning {
	enabled: boolean;
	max: number;
}

export interface Versioning {
	enabled: boolean;
	max: number;
}

export async function adminVersioning(): Promise<AdminVersioning> {
	const settings = await getAppSettings();
	return {
		enabled: settings.versioningEnabled ?? false,
		max: settings.maxVersionsPerFile ?? DEFAULT_MAX_VERSIONS,
	};
}

export function versionKey(fileId: string, versionId: string): string {
	return `.versions/${fileId}/${versionId}`;
}

/** Every folder path from the top down to `path`: `a`, `a/b`, `a/b/c`. */
export function pathPrefixes(path: string): string[] {
	const segments = path.split("/").filter(Boolean);
	return segments.map((_, i) => segments.slice(0, i + 1).join("/"));
}

/**
 * What applies at `folderPath` (null is the root): the nearest folder that
 * sets a key wins, else the admin's. `excludeSelf` answers what "inherit"
 * would resolve to for that folder.
 */
export async function versioningAt(
	ctx: StorageContext,
	folderPath: string | null,
	admin: AdminVersioning,
	excludeSelf = false,
): Promise<Versioning> {
	if (!admin.enabled) {
		return { enabled: false, max: admin.max };
	}
	let prefixes = folderPath ? pathPrefixes(folderPath) : [];
	if (excludeSelf) {
		prefixes = prefixes.slice(0, -1);
	}
	let enabled: boolean | undefined;
	let limit: number | undefined;
	if (prefixes.length > 0) {
		// A share recipient's scope hides the ancestors a setting lives on.
		const rows = await ctx.db
			.select({ path: folders.path, settings: folders.settings })
			.from(folders)
			.where(
				and(
					ownedFolders({ ...ctx, scope: undefined }),
					inArray(folders.path, prefixes),
				),
			);
		const byPath = new Map(rows.map((row) => [row.path, row.settings]));
		for (const prefix of [...prefixes].reverse()) {
			const settings: FolderSettingsData | null | undefined =
				byPath.get(prefix);
			enabled ??= settings?.versioning;
			limit ??= settings?.maxVersions;
		}
	}
	return {
		enabled: enabled ?? true,
		max: Math.max(1, Math.min(limit ?? admin.max, admin.max)),
	};
}

async function folderPathOf(
	ctx: StorageContext,
	folderId: string | null,
): Promise<string | null> {
	if (!folderId) {
		return null;
	}
	const [folder] = await ctx.db
		.select({ path: folders.path })
		.from(folders)
		.where(
			and(ownedFolders({ ...ctx, scope: undefined }), eq(folders.id, folderId)),
		);
	return folder?.path ?? null;
}

export async function versioningForFile(
	ctx: StorageContext,
	file: Pick<DbFile, "folderId">,
	admin: AdminVersioning,
): Promise<Versioning> {
	return versioningAt(ctx, await folderPathOf(ctx, file.folderId), admin);
}

/**
 * Keeps the file's current bytes as a new version, then prunes the oldest
 * past `limit`. Rows go before bytes, or a row would point at nothing.
 */
export async function snapshot(
	ctx: StorageContext,
	file: Pick<DbFile, "id" | "path" | "contentType">,
	limit: number,
	{
		dropThumbnails = () => Promise.resolve(),
		place = (key) => ctx.driver.linkObject(file.path, key),
		...meta
	}: {
		dropThumbnails?: (key: string) => Promise<void>;
		/** Puts the version's bytes at `key`; a link to the file by default. */
		place?: (key: string) => Promise<void>;
		/** A merged-in file's name and mtime. */
		name?: string;
		createdAt?: Date;
	} = {},
): Promise<FileVersion> {
	const id = crypto.randomUUID();
	const key = versionKey(file.id, id);
	await place(key);
	const size = await ctx.driver.getObjectSize(key);

	let row: FileVersion | undefined;
	for (let attempt = 0; !row; attempt++) {
		const [last] = await ctx.db
			.select({ seq: max(fileVersions.seq) })
			.from(fileVersions)
			.where(eq(fileVersions.fileId, file.id));
		try {
			[row] = await ctx.db
				.insert(fileVersions)
				.values({
					id,
					fileId: file.id,
					seq: (last?.seq ?? 0) + 1,
					size,
					contentType: file.contentType,
					createdBy: ctx.actor.id,
					...meta,
				})
				.returning();
		} catch (error) {
			// Two snapshots racing for one seq: the unique index refuses one.
			if (attempt >= 3) {
				await ctx.driver.deleteObject(key).catch(() => undefined);
				throw error;
			}
		}
	}

	const stale = (
		await ctx.db
			.select({ id: fileVersions.id })
			.from(fileVersions)
			.where(eq(fileVersions.fileId, file.id))
			.orderBy(desc(fileVersions.seq))
	).slice(limit);
	if (stale.length > 0) {
		await ctx.db.delete(fileVersions).where(
			inArray(
				fileVersions.id,
				stale.map((v) => v.id),
			),
		);
		for (const version of stale) {
			const key = versionKey(file.id, version.id);
			await ctx.driver.deleteObject(key).catch(() => undefined);
			await dropThumbnails(key);
		}
	}
	return row;
}

export type ListedVersion = FileVersion & { authorName: string | null };

export async function listVersions(
	ctx: StorageContext,
	fileId: string,
): Promise<ListedVersion[]> {
	const rows = await ctx.db
		.select({ version: fileVersions, authorName: user.name })
		.from(fileVersions)
		.leftJoin(user, eq(user.id, fileVersions.createdBy))
		.where(eq(fileVersions.fileId, fileId))
		.orderBy(desc(fileVersions.seq));
	return rows.map((row) => ({ ...row.version, authorName: row.authorName }));
}

export async function getVersion(
	ctx: StorageContext,
	fileId: string,
	versionId: string,
): Promise<FileVersion | null> {
	const [version] = await ctx.db
		.select()
		.from(fileVersions)
		.where(
			and(eq(fileVersions.fileId, fileId), eq(fileVersions.id, versionId)),
		);
	return version ?? null;
}

/**
 * Renumbers a file's versions `v1..vN` in the order given, oldest first.
 * False unless `ids` is exactly the file's versions. Two passes, through
 * negatives, so no row ever takes a seq another still holds.
 */
export async function reorderVersions(
	ctx: StorageContext,
	fileId: string,
	ids: string[],
): Promise<boolean> {
	const rows = await ctx.db
		.select({ id: fileVersions.id })
		.from(fileVersions)
		.where(eq(fileVersions.fileId, fileId));
	const known = new Set(rows.map((row) => row.id));
	if (
		ids.length !== known.size ||
		new Set(ids).size !== ids.length ||
		!ids.every((id) => known.has(id))
	) {
		return false;
	}
	if (ids.length === 0) {
		return true;
	}
	const cases = sql.join(
		ids.map((id, i) => sql`when ${id} then ${-(i + 1)}`),
		sql` `,
	);
	await ctx.db
		.update(fileVersions)
		.set({ seq: sql`case ${fileVersions.id} ${cases} end` })
		.where(eq(fileVersions.fileId, fileId));
	await ctx.db
		.update(fileVersions)
		.set({ seq: sql`-${fileVersions.seq}` })
		.where(and(eq(fileVersions.fileId, fileId), lt(fileVersions.seq, 0)));
	return true;
}

export async function deleteVersion(
	ctx: StorageContext,
	fileId: string,
	versionId: string,
): Promise<boolean> {
	const gone = await ctx.db
		.delete(fileVersions)
		.where(and(eq(fileVersions.fileId, fileId), eq(fileVersions.id, versionId)))
		.returning({ id: fileVersions.id });
	if (gone.length === 0) {
		return false;
	}
	await ctx.driver
		.deleteObject(versionKey(fileId, versionId))
		.catch(() => undefined);
	return true;
}

/**
 * Highest kept `seq` per file for a page of files, so the current bytes read
 * as `v{seq + 1}`. Files without versions are absent.
 */
export async function latestSeqs(
	ctx: StorageContext,
	fileIds: string[],
): Promise<Map<string, number>> {
	if (fileIds.length === 0) {
		return new Map();
	}
	const rows = await ctx.db
		.select({ fileId: fileVersions.fileId, seq: max(fileVersions.seq) })
		.from(fileVersions)
		.where(inArray(fileVersions.fileId, fileIds))
		.groupBy(fileVersions.fileId);
	return new Map(rows.map((row) => [row.fileId, Number(row.seq ?? 0)]));
}

/**
 * After file rows are gone (their version rows cascade), their version bytes.
 * Never throws: the rows are already deleted, and a stray directory is only
 * unreferenced bytes the scan never reads.
 */
export async function dropVersionBytes(
	ctx: StorageContext,
	fileIds: string[],
): Promise<void> {
	if (fileIds.length === 0) {
		return;
	}
	for (const id of fileIds) {
		await ctx.driver
			.deleteObjectsByPrefix(`.versions/${id}/`)
			.catch((error: unknown) => {
				logger.error(`Could not remove versions of file ${id}`, error);
			});
	}
	// One listing for the whole batch: a per-file `deleteThumbnails` rereads
	// the cache directory each time, which over a big trash is quadratic.
	const dir = join(ctx.storagePath, ".thumbnails");
	const ids = new Set(fileIds);
	const entries = await readdir(dir).catch(() => [] as string[]);
	for (const entry of entries) {
		// `.versions_<fileId>_<versionId>_<size>.webp`; a UUID has no `_`.
		if (
			entry.startsWith(VERSION_THUMB_PREFIX) &&
			ids.has(entry.slice(VERSION_THUMB_PREFIX.length).split("_")[0] ?? "")
		) {
			await unlink(join(dir, entry)).catch(() => undefined);
		}
	}
}

const VERSION_THUMB_PREFIX = ".versions_";

export interface FolderVersioning {
	path: string;
	/** What the folder itself sets; unset keys inherit. */
	settings: FolderSettingsData;
	/** What applies inside it. */
	effective: Versioning;
	/** What applies if it set nothing. */
	inherited: Versioning;
	adminEnabled: boolean;
	adminMax: number;
}

/** A listing row names its folder by id; a folder page only has its path. */
function idOrPath(key: string) {
	return or(eq(folders.id, key), eq(folders.path, key));
}

export async function folderVersioning(
	ctx: StorageContext,
	folderId: string,
	admin: AdminVersioning,
): Promise<FolderVersioning | null> {
	const [folder] = await ctx.db
		.select({ path: folders.path, settings: folders.settings })
		.from(folders)
		.where(and(ownedFolders(ctx), idOrPath(folderId)));
	if (!folder) {
		return null;
	}
	return {
		path: folder.path,
		settings: folder.settings ?? {},
		effective: await versioningAt(ctx, folder.path, admin),
		inherited: await versioningAt(ctx, folder.path, admin, true),
		adminEnabled: admin.enabled,
		adminMax: admin.max,
	};
}

export async function setFolderSettings(
	ctx: StorageContext,
	folderId: string,
	settings: FolderSettingsData,
): Promise<boolean> {
	const updated = await ctx.db
		.update(folders)
		.set({ settings })
		.where(and(ownedFolders(ctx), idOrPath(folderId)))
		.returning({ id: folders.id });
	return updated.length > 0;
}
