/**
 * Applying a copy or delete whose requester died before it could.
 *
 * Only what the job's own result names is touched — never a sweep of the
 * tree. A copy's landed bytes with no row were never visible, and the source
 * still has them, so they are removed. A delete's removed bytes whose trash
 * rows survived would only ever restore as broken files, so the rows go.
 */

import { isAbsolute, relative } from "node:path";
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

function chunks<T>(items: T[]): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += CHUNK) {
		out.push(items.slice(i, i + CHUNK));
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

/** Deletes the trash rows whose bytes the job removed. */
export async function reconcileDelete(
	ctx: StorageContext,
	thumbnails: ThumbnailService,
	result: DeleteResult,
): Promise<number> {
	let removed = 0;
	for (const batch of chunks(keysOf(ctx, result.deleted))) {
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
	for (const batch of chunks(keysOf(ctx, result.deletedDirs))) {
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
