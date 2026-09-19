/**
 * Emptying the trash.
 *
 * One request rather than one per row: the client used to fire a delete per
 * visible item, which reported a size it could see, raced its own listing
 * refresh, and left whatever failed behind with no way to tell.
 */

import { join } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { files, folders } from "#lib/server/db/schema.js";
import {
	awaitJob,
	disownJob,
	enqueueJob,
	finishJob,
	type JobOutcome,
} from "#lib/server/services/jobs.js";
import type { StorageContext } from "./context";
import { ancestorFolders } from "./mappers";
import { bytesGone, chunks } from "./reconcile";
import { jobContext, ownedFiles, ownedFolders } from "./scope";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("StorageTrash");

/** SQLite caps bound parameters per statement; delete ids in slices. */
const DELETE_CHUNK = 500;

/** The route awaits this job synchronously; emptying a large trash takes a while. */
const DELETE_TIMEOUT_MS = 30 * 60 * 1000;

interface DeleteJobResult {
	failedFiles: string[];
	failedDirs: string[];
}

export interface EmptyTrashResult {
	/** Files and folders whose rows were removed. */
	deleted: number;
	/** Bytes given back to the disk. */
	freed: number;
	/** Files whose bytes could not be removed; their rows are kept. */
	failed: number;
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

		const jobId = await enqueueJob({
			type: "delete",
			spec: {
				files: trashedFiles.map((file) =>
					join(this.ctx.storagePath, file.path),
				),
				dirs: trashedFolders.map((folder) =>
					join(this.ctx.storagePath, folder.path),
				),
				context: jobContext(this.ctx),
			},
			priority: "mutation",
		});
		// Not consumed here: the row is the record `reconcile.ts` needs should
		// this process die before the rows below are deleted.
		const job = await awaitJob(jobId, {
			timeoutMs: DELETE_TIMEOUT_MS,
			settle: true,
		});
		try {
			const outcome = await this.jobOutcome(job, trashedFiles, trashedFolders);
			return await this.applyEmpty(
				jobId,
				outcome,
				trashedFiles,
				trashedFolders,
			);
		} catch (error) {
			// Half-applied, or the outcome itself unparsable: the reconciler
			// finishes from the job's record either way.
			await disownJob(jobId);
			throw error;
		}
	}

	private async applyEmpty(
		jobId: string,
		outcome: { failedFiles: Set<string>; failedDirs: string[] },
		trashedFiles: { id: string; path: string; size: number }[],
		trashedFolders: { id: string; path: string }[],
	): Promise<EmptyTrashResult> {
		const removableFileIds: string[] = [];
		const survivingPaths: string[] = [];
		let freed = 0;

		for (const file of trashedFiles) {
			if (outcome.failedFiles.has(file.path)) {
				// The row stays. A row without its bytes is re-imported by the
				// library scan, which is how deleted files came back scattered
				// across the drive.
				survivingPaths.push(file.path);
				logger.error(`Could not delete trashed file ${file.path}`);
				continue;
			}
			removableFileIds.push(file.id);
			freed += file.size;
			await this.thumbnails.deleteThumbnails(file.path);
		}

		for (const path of outcome.failedDirs) {
			logger.error(`Could not remove folder ${path}`);
		}

		const keptFolders = new Set(survivingPaths.flatMap(ancestorFolders));
		const removableFolders = trashedFolders.filter(
			(folder) => !keptFolders.has(folder.path),
		);

		for (const ids of chunks(removableFileIds, DELETE_CHUNK)) {
			await this.ctx.db
				.delete(files)
				.where(and(ownedFiles(this.ctx), inArray(files.id, ids)));
		}
		for (const ids of chunks(
			removableFolders.map((folder) => folder.id),
			DELETE_CHUNK,
		)) {
			await this.ctx.db
				.delete(folders)
				.where(and(ownedFolders(this.ctx), inArray(folders.id, ids)));
		}

		// A false here means this process was taken for dead and the job
		// adopted; the reconciler deletes the same rows, so nothing to redo.
		await finishJob(jobId);
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

	/**
	 * With no outcome, the disk is the record: the job may have run part-way
	 * before its worker vanished, so a file whose bytes are gone loses its
	 * row, and every other row stays. Folders stay too — an empty folder has
	 * nothing to lose either way.
	 */
	private async jobOutcome(
		job: JobOutcome | undefined,
		trashedFiles: { path: string }[],
		trashedFolders: { path: string }[],
	): Promise<{ failedFiles: Set<string>; failedDirs: string[] }> {
		if (job?.status === "succeeded" && job.result) {
			const result = JSON.parse(job.result) as DeleteJobResult;
			const byAbs = new Map(
				trashedFiles.map((file) => [
					join(this.ctx.storagePath, file.path),
					file.path,
				]),
			);
			const failedFiles = new Set(
				result.failedFiles.map((abs) => byAbs.get(abs) ?? abs),
			);
			return { failedFiles, failedDirs: result.failedDirs };
		}
		logger.error(
			`Delete job did not complete (status ${job?.status ?? "timed out"})`,
		);
		const present: string[] = [];
		for (const file of trashedFiles) {
			if (!(await bytesGone(this.ctx, file.path))) {
				present.push(file.path);
			}
		}
		return {
			failedFiles: new Set(present),
			failedDirs: trashedFolders.map((folder) =>
				join(this.ctx.storagePath, folder.path),
			),
		};
	}
}
