/**
 * Copying a file or a folder's subtree between two storage services — two
 * drives, a drive and a volume, or the same drive twice (duplicating a folder).
 *
 * Export reads rows from the source; import creates fresh rows and bytes in
 * the target. Nothing is shared between the two but the rows and a way to open
 * each file, so the target never needs to know where the source is rooted.
 */

import { join } from "node:path";
import { and, asc, eq, like } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import type {
	File as DbFile,
	Folder as DbFolder,
} from "#lib/server/db/schema.js";
import { files, folders } from "#lib/server/db/schema.js";
import { FileOrFolderNotFoundError } from "#lib/server/errors.js";
import {
	awaitJob,
	enqueueJob,
	type JobOutcome,
} from "#lib/server/services/jobs.js";
import type { StorageContext } from "./context";
import type { FileOperations, PlannedImport } from "./files";
import type { FolderOperations } from "./folders";
import { ownedFiles, ownedFolders } from "./scope";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("StorageTransfer");

/** The route awaits this job synchronously; a large tree can take a while. */
const COPY_TIMEOUT_MS = 30 * 60 * 1000;

export interface ExportedTree {
	type: "file" | "folder";
	/** The folder itself for a folder export; absent for a file. */
	root?: DbFolder;
	/** Descendant folders, parents before children. */
	folders: DbFolder[];
	files: DbFile[];
}

export interface TransferResult {
	copied: number;
	failed: number;
}

interface CopyJobResult {
	failed: { index: number; error: string }[];
}

function parentOf(path: string): string {
	return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

export class TransferOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly fileOps: FileOperations,
		private readonly folderOps: FolderOperations,
		private readonly thumbnails: ThumbnailService,
	) {}

	/** Trashed descendants stay behind: the trash is not part of what moves. */
	async exportTree(
		key: string,
		type: "file" | "folder",
	): Promise<ExportedTree> {
		const path = key.replace(/\/$/, "");
		if (type === "file") {
			const [file] = await this.ctx.db
				.select()
				.from(files)
				.where(and(eq(files.path, path), ownedFiles(this.ctx)));
			if (!file) {
				throw new FileOrFolderNotFoundError(`File not found: ${path}`);
			}
			return { type, folders: [], files: [file] };
		}

		const [root] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, path), ownedFolders(this.ctx)));
		if (!root) {
			throw new FileOrFolderNotFoundError(`Folder not found: ${path}`);
		}
		const [subFolders, subFiles] = await Promise.all([
			this.ctx.db
				.select()
				.from(folders)
				.where(
					and(
						ownedFolders(this.ctx),
						like(folders.path, `${path}/%`),
						eq(folders.isTrashed, false),
					),
				)
				.orderBy(asc(folders.path)),
			this.ctx.db
				.select()
				.from(files)
				.where(
					and(
						ownedFiles(this.ctx),
						like(files.path, `${path}/%`),
						eq(files.isTrashed, false),
					),
				),
		]);
		// Path order is not depth order once ids differ in length; depth is.
		subFolders.sort(
			(a, b) => a.path.split("/").length - b.path.split("/").length,
		);
		return { type, root, folders: subFolders, files: subFiles };
	}

	/** The folders of a tree under `dest`, keyed by their old path. */
	private async recreateFolders(
		root: DbFolder,
		descendants: DbFolder[],
		dest: string,
	): Promise<Map<string, string>> {
		const newPathOf = new Map<string, string>();
		const created = await this.folderOps.createFolder(
			root.name,
			dest || undefined,
		);
		newPathOf.set(root.path, dest ? `${dest}/${created.id}` : created.id);
		for (const folder of descendants) {
			const parent = newPathOf.get(parentOf(folder.path));
			if (parent !== undefined) {
				const child = await this.folderOps.createFolder(folder.name, parent);
				newPathOf.set(folder.path, `${parent}/${child.id}`);
			}
		}
		return newPathOf;
	}

	/**
	 * Copy an exported tree into `destination`. Folder rows are created here,
	 * as ever; every file's destination is planned up front (unique name,
	 * row) and every byte copy runs as one `copy` job, so a row is only
	 * inserted for a pair Go actually landed.
	 */
	async importTree(
		tree: ExportedTree,
		destination: string,
		sourceStoragePath: string,
	): Promise<TransferResult> {
		const dest = destination.replace(/\/$/, "");
		const newPathOf = tree.root
			? await this.recreateFolders(tree.root, tree.folders, dest)
			: new Map<string, string>();

		const plans: { file: DbFile; plan: PlannedImport }[] = [];
		let failed = 0;
		for (const file of tree.files) {
			const folder = tree.root ? newPathOf.get(parentOf(file.path)) : dest;
			if (folder === undefined) {
				failed++;
				continue;
			}
			try {
				plans.push({ file, plan: await this.fileOps.importFile(file, folder) });
			} catch (error) {
				logger.warn(`Could not plan a copy of ${file.path}`, error);
				failed++;
			}
		}

		if (plans.length === 0) {
			await this.ctx.invalidateListingCaches();
			return { copied: 0, failed };
		}

		const jobId = await enqueueJob({
			type: "copy",
			spec: {
				pairs: plans.map(({ file, plan }) => ({
					source: join(sourceStoragePath, file.path),
					dest: join(this.ctx.storagePath, plan.filePath),
				})),
			},
			priority: "mutation",
		});
		const job = await awaitJob(jobId, {
			timeoutMs: COPY_TIMEOUT_MS,
			settle: true,
			consume: true,
		});
		const failedIndexes = this.failedCopyIndexes(job, plans.length);

		let copied = 0;
		for (const [index, { file, plan }] of plans.entries()) {
			if (failedIndexes.has(index)) {
				failed++;
				continue;
			}
			await this.ctx.db.insert(files).values(plan.values);
			this.thumbnails.warm(plan.filePath, file.contentType).catch(() => {
				// `warm` already logs.
			});
			copied++;
		}

		await this.ctx.invalidateListingCaches();
		return { copied, failed };
	}

	/** A missing or unsuccessful job leaves no pair confirmed copied. */
	private failedCopyIndexes(
		job: JobOutcome | undefined,
		count: number,
	): Set<number> {
		if (job?.status === "succeeded" && job.result) {
			const { failed } = JSON.parse(job.result) as CopyJobResult;
			return new Set(failed.map((f) => f.index));
		}
		logger.warn(
			`Copy job did not complete (status ${job?.status ?? "timed out"})`,
		);
		return new Set(Array.from({ length: count }, (_, i) => i));
	}
}
