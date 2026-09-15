/**
 * Emptying the trash.
 *
 * One request rather than one per row: the client used to fire a delete per
 * visible item, which reported a size it could see, raced its own listing
 * refresh, and left whatever failed behind with no way to tell.
 */

import { and, eq, inArray } from "drizzle-orm";
import { Logger } from "$lib/logger";
import { files, folders } from "$lib/server/db/schema";
import type { StorageContext } from "./context";
import { ancestorFolders } from "./mappers";
import { ownedFiles, ownedFolders } from "./scope";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("StorageTrash");

/** SQLite caps bound parameters per statement; delete ids in slices. */
const DELETE_CHUNK = 500;

export interface EmptyTrashResult {
	/** Files and folders whose rows were removed. */
	deleted: number;
	/** Bytes given back to the disk. */
	freed: number;
	/** Files whose bytes could not be removed; their rows are kept. */
	failed: number;
}

function chunk<T>(items: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
}

export class TrashOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
	) {}

	async emptyTrash(): Promise<EmptyTrashResult> {
		const [trashedFiles, trashedFolders] = await Promise.all([
			this.ctx.db
				.select({ id: files.id, path: files.path, size: files.size })
				.from(files)
				.where(and(ownedFiles(this.ctx), eq(files.isTrashed, true))),
			this.ctx.db
				.select({ id: folders.id, path: folders.path })
				.from(folders)
				.where(and(ownedFolders(this.ctx), eq(folders.isTrashed, true))),
		]);

		const removableFileIds: string[] = [];
		const survivingPaths: string[] = [];
		let freed = 0;

		for (const file of trashedFiles) {
			try {
				await this.deleteBytes(file.path);
				removableFileIds.push(file.id);
				freed += file.size;
			} catch (error) {
				// The row stays. A row without its bytes is re-imported by the
				// library scan, which is how deleted files came back scattered
				// across the drive.
				survivingPaths.push(file.path);
				logger.error(`Could not delete trashed file ${file.path}:`, error);
			}
		}

		const keptFolders = new Set(survivingPaths.flatMap(ancestorFolders));
		const removableFolders = trashedFolders.filter(
			(folder) => !keptFolders.has(folder.path),
		);

		for (const folder of removableFolders) {
			try {
				await this.ctx.driver.deleteObjectsByPrefix(`${folder.path}/`);
			} catch (error) {
				logger.error(`Could not remove folder ${folder.path}:`, error);
			}
		}

		for (const ids of chunk(removableFileIds, DELETE_CHUNK)) {
			await this.ctx.db
				.delete(files)
				.where(and(ownedFiles(this.ctx), inArray(files.id, ids)));
		}
		for (const ids of chunk(
			removableFolders.map((folder) => folder.id),
			DELETE_CHUNK,
		)) {
			await this.ctx.db
				.delete(folders)
				.where(and(ownedFolders(this.ctx), inArray(folders.id, ids)));
		}

		const deleted = removableFileIds.length + removableFolders.length;

		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "delete",
			message: `Emptied the trash: ${deleted} item${deleted === 1 ? "" : "s"}`,
			level: "info",
		});
		await this.ctx.invalidateListingCaches();

		return { deleted, freed, failed: survivingPaths.length };
	}

	/** Bytes already gone are not a failure — only a refused delete is. */
	private async deleteBytes(path: string): Promise<void> {
		try {
			await this.ctx.driver.deleteObject(path);
		} catch (error) {
			if (await this.ctx.driver.objectExists(path)) {
				throw error;
			}
		}
		await this.thumbnails.deleteThumbnails(path);
	}
}
