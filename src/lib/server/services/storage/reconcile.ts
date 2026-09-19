/**
 * Applying a copy or delete whose requester died before it could.
 *
 * Only what the job's own result names is touched — never a sweep of the
 * tree. A copy's landed bytes with no row were never visible, and the source
 * still has them, so they are removed. A delete's removed bytes whose trash
 * rows survived would only ever restore as broken files, so the rows go.
 */

import { lstat } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { files, folders } from "#lib/server/db/schema.js";
import type { StorageContext } from "./context";
import { ownedFiles, ownedFolders } from "./scope";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("StorageReconcile");

/** SQLite caps bound parameters per statement. */
const CHUNK = 500;

export interface CopyResult {
	copied: string[];
	failed: { dest: string }[];
}

export interface DeleteResult {
	deleted: string[];
	deletedDirs: string[];
}

/**
 * Only ENOENT is gone. `objectExists` (`Bun.file().exists()`) also answers
 * false on EACCES — and a row deleted for bytes the app merely cannot read
 * is resurrected untrashed by the next scan.
 */
export async function bytesGone(
	ctx: StorageContext,
	key: string,
): Promise<boolean> {
	try {
		await lstat(join(ctx.storagePath, key));
		return false;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code === "ENOENT";
	}
}

export function chunks<T>(items: T[], size = CHUNK): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(items.slice(i, i + size));
	}
	return out;
}

/** Storage keys for absolute paths under this root; anything else is dropped. */
function keysOf(ctx: StorageContext, paths: string[]): string[] {
	return paths.flatMap((path) => {
		const key = relative(ctx.storagePath, path);
		return key && !key.startsWith("..") && !isAbsolute(key) ? [key] : [];
	});
}

/** Removes every destination of the job that no row points at. */
export async function reconcileCopy(
	ctx: StorageContext,
	result: CopyResult,
): Promise<number> {
	const keys = keysOf(ctx, [
		...result.copied,
		...result.failed.map((failure) => failure.dest),
	]);
	let removed = 0;
	for (const batch of chunks(keys)) {
		const rows = await ctx.db
			.select({ path: files.path })
			.from(files)
			.where(and(ownedFiles(ctx), inArray(files.path, batch)));
		const kept = new Set(rows.map((row) => row.path));
		for (const key of batch.filter((k) => !kept.has(k))) {
			try {
				await ctx.driver.deleteObject(key);
				removed++;
			} catch (error) {
				// Never landed, or already gone: nothing to remove.
				if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
					logger.warn(`Could not remove orphaned copy ${key}`, error);
				}
			}
		}
	}
	return removed;
}

/**
 * Deletes the trash rows whose bytes the job removed — and that are still
 * gone: on a volume, a file trashed at the same path since has bytes again.
 */
export async function reconcileDelete(
	ctx: StorageContext,
	thumbnails: ThumbnailService,
	result: DeleteResult,
): Promise<number> {
	const stillGone = async (keys: string[]) => {
		const out: string[] = [];
		for (const key of keys) {
			if (await bytesGone(ctx, key)) {
				out.push(key);
			}
		}
		return out;
	};
	const deleted = await stillGone(keysOf(ctx, result.deleted));
	const deletedDirs = await stillGone(keysOf(ctx, result.deletedDirs));
	let removed = 0;
	for (const batch of chunks(deleted)) {
		const gone = await ctx.db
			.delete(files)
			.where(
				and(
					ownedFiles(ctx),
					eq(files.isTrashed, true),
					inArray(files.path, batch),
				),
			)
			.returning({ path: files.path });
		for (const row of gone) {
			await thumbnails.deleteThumbnails(row.path);
		}
		removed += gone.length;
	}
	for (const batch of chunks(deletedDirs)) {
		const gone = await ctx.db
			.delete(folders)
			.where(
				and(
					ownedFolders(ctx),
					eq(folders.isTrashed, true),
					inArray(folders.path, batch),
				),
			)
			.returning({ id: folders.id });
		removed += gone.length;
	}
	return removed;
}
