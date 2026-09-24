import { FileCategoryEnum } from "#lib/file-helpers.js";
/**
 * Library scan: reconcile the DB with what's actually in the storage backend.
 *
 * Uploads through the app write both the bytes and the row, so nothing needs
 * scanning. A *mounted* volume is the opposite — the bytes were there before
 * Penombre ever ran, and without rows the UI shows an empty drive. This walks
 * the storage root and creates the missing rows (and drops rows whose bytes
 * are gone).
 *
 * Runs on boot and on an interval in simple mode (see `hooks.server.ts`).
 */

import { and, eq, inArray } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { sealedSize } from "#lib/server/crypto/envelope.js";
import { type File as DbFile, files, folders } from "#lib/server/db/schema.js";
import { awaitJob, enqueueJob } from "#lib/server/services/jobs.js";
import type { StorageContext } from "./context";
import { purgeGrantsFor } from "./grants";
import {
	ancestorFolders,
	determineCategory,
	determineContentType,
} from "./mappers";
import { bytesGone, chunks } from "./reconcile";
import { followRenames } from "./renames";
import { ownedFiles, ownedFolders } from "./scope";
import { promoteShadow, relinkShadow } from "./shadow";
import type { ThumbnailService } from "./thumbnails";
import { nameUuidPaths } from "./uuid-names";
import {
	type AdminVersioning,
	adminVersioning,
	dropVersionBytes,
} from "./versions";

export { ancestorFolders };

/** What a pass knows of a file row. */
type ScannedFile = Pick<
	DbFile,
	| "id"
	| "path"
	| "size"
	| "updatedAt"
	| "inode"
	| "name"
	| "contentType"
	| "folderId"
>;

/** A file on disk, as the `scan-list` Go job reports it. */
export interface ScanEntry {
	key: string;
	size: number;
	/** Epoch ms; absent from a worker older than this field. */
	mtime?: number;
	/** Absent where the platform has none: nothing is then versioned. */
	ino?: string;
}

/** The scannable keys on disk and their sizes, bundled to keep call sites at 4 params. */
interface Listing {
	keys: string[];
	sizeByKey: Map<string, number>;
	mtimeByKey: Map<string, number>;
	inoByKey: Map<string, string>;
	/** Set while versioning is on: outside replaces are then kept. */
	versioning?: AdminVersioning;
}

const LISTING_TIMEOUT_MS = 30 * 60_000;

/** A write stamps its row a moment apart from the file's mtime. */
const DATE_SLACK_MS = 2000;

/** Walks `root` via the `scan-list` job. Exported so a test can stub scan()'s listing. */
export async function listStorageRoot(root: string): Promise<ScanEntry[]> {
	const id = await enqueueJob({
		type: "scan-list",
		spec: { root },
		priority: "mutation",
	});
	const job = await awaitJob(id, {
		timeoutMs: LISTING_TIMEOUT_MS,
		consume: true,
	});
	if (!job || job.status !== "succeeded" || !job.result) {
		throw new Error(
			`scan-list job did not succeed: ${job?.error ?? "timed out"}`,
		);
	}
	return (JSON.parse(job.result) as { entries: ScanEntry[] }).entries;
}

const logger = new Logger("StorageScan");

export interface ScanResult {
	addedFolders: number;
	addedFiles: number;
	updatedFiles: number;
	removedFolders: number;
	removedFiles: number;
}

/**
 * Where a pass is. `files` is the long phase — a row, a stat and a thumbnail
 * per file — so it is the only one with a count; the others are quick or
 * cannot be counted ahead (walking the tree).
 */
export type ScanPhase = "listing" | "folders" | "files" | "cleanup";

export interface ScanStep {
	phase: ScanPhase;
	/** The path being handled, when there is one. */
	current?: string;
	done: number;
	total: number;
}

export type ScanReporter = (step: ScanStep) => void;

/**
 * Remaining time at the average rate so far. Needs a few files and a second
 * of history, or the first thumbnail alone would set the estimate.
 */
export function estimateRemaining(
	done: number,
	total: number,
	elapsedMs: number,
): number | undefined {
	if (done < 3 || elapsedMs < 1000 || done >= total) {
		return undefined;
	}
	return Math.ceil(((elapsedMs / done) * (total - done)) / 1000);
}

const EMPTY_RESULT: ScanResult = {
	addedFolders: 0,
	addedFiles: 0,
	updatedFiles: 0,
	removedFolders: 0,
	removedFiles: 0,
};

/**
 * Ignore thumbnails, legacy metadata sidecars and hidden entries
 * (`.DS_Store`, `.git/…` and friends show up on any real mounted volume).
 */
export function isScannable(key: string): boolean {
	if (key.endsWith(".meta.json")) {
		return false;
	}
	return !key.split("/").some((segment) => segment.startsWith("."));
}

/** Changed bytes invalidate a duration; the duration sweep refills it. */
function unknownDuration(
	key: string,
): { musicDuration: null } | { videoDuration: null } | object {
	switch (determineCategory(key)) {
		case FileCategoryEnum.MUSIC:
			return { musicDuration: null };
		case FileCategoryEnum.VIDEO:
			return { videoDuration: null };
		default:
			return {};
	}
}

function basename(path: string): string {
	return path.split("/").pop() ?? path;
}

function parentPath(path: string): string | null {
	const index = path.lastIndexOf("/");
	return index === -1 ? null : path.slice(0, index);
}

export class ScanOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
		private readonly deps: {
			listStorageRoot: (root: string) => Promise<ScanEntry[]>;
		} = { listStorageRoot },
	) {}

	/**
	 * `full` re-reads every known file as if its bytes had changed: type,
	 * duration and thumbnails rebuilt, sizes and all. Rows keep their ids, so
	 * stars, notes and shares survive it. A quick pass only re-reads a file
	 * whose size moved.
	 */
	async scan(
		report: ScanReporter = () => undefined,
		{ full = false }: { full?: boolean } = {},
	): Promise<ScanResult> {
		report({ phase: "listing", done: 0, total: 0 });
		const writable = this.ctx.namedPaths && !this.ctx.readOnly;
		if (writable) {
			await nameUuidPaths(this.ctx, this.thumbnails);
		}
		const admin = writable ? await adminVersioning() : undefined;
		const entries = (
			await this.deps.listStorageRoot(this.ctx.storagePath)
		).filter((entry) => isScannable(entry.key));
		const keys = entries.map((entry) => entry.key);
		const listing: Listing = {
			keys,
			sizeByKey: new Map(entries.map((entry) => [entry.key, entry.size])),
			mtimeByKey: new Map(
				entries.flatMap((entry) =>
					entry.mtime ? [[entry.key, entry.mtime] as const] : [],
				),
			),
			inoByKey: new Map(
				entries.flatMap((entry) =>
					entry.ino ? [[entry.key, entry.ino] as const] : [],
				),
			),
			versioning: admin?.enabled ? admin : undefined,
		};

		const [existingFolders, existingFiles] = await Promise.all([
			this.ctx.db
				.select({ id: folders.id, path: folders.path })
				.from(folders)
				.where(ownedFolders(this.ctx)),
			this.ctx.db
				.select({
					id: files.id,
					path: files.path,
					size: files.size,
					updatedAt: files.updatedAt,
					inode: files.inode,
					name: files.name,
					contentType: files.contentType,
					folderId: files.folderId,
				})
				.from(files)
				.where(ownedFiles(this.ctx)),
		]);

		const folderIdByPath = new Map(
			existingFolders.map((f) => [f.path, f.id] as const),
		);
		const onDiskFolders = new Set(keys.flatMap(ancestorFolders));

		const result = { ...EMPTY_RESULT };
		report({ phase: "folders", done: 0, total: 0 });
		result.addedFolders = await this.insertMissingFolders(
			onDiskFolders,
			folderIdByPath,
		);
		// Before inserting: a renamed file keeps its row, versions included,
		// instead of being dropped and imported again as new.
		result.updatedFiles += await followRenames(
			{ ctx: this.ctx, thumbnails: this.thumbnails },
			existingFiles,
			listing,
			folderIdByPath,
		);
		const knownFilePaths = new Set(existingFiles.map((f) => f.path));

		// One count across both file passes: every key on disk is visited once,
		// either inserted or re-stat'ed.
		const progress = { done: 0, total: keys.length };
		const tick = (key: string) => {
			progress.done++;
			report({ phase: "files", current: key, ...progress });
		};
		report({ phase: "files", ...progress });
		result.addedFiles = await this.insertMissingFiles(
			listing,
			knownFilePaths,
			folderIdByPath,
			tick,
		);
		result.updatedFiles += await this.refreshChangedFiles(
			existingFiles,
			listing,
			tick,
			full,
		);
		report({ phase: "cleanup", ...progress });
		result.removedFiles = await this.removeVanishedFiles(existingFiles, keys);
		result.removedFolders = await this.removeVanishedFolders(existingFolders);

		const changed =
			result.addedFolders +
			result.addedFiles +
			result.updatedFiles +
			result.removedFolders +
			result.removedFiles;

		if (changed > 0) {
			await this.ctx.invalidateListingCaches();
			logger.info(
				`Scan: +${result.addedFolders} folder(s), +${result.addedFiles} file(s), ` +
					`~${result.updatedFiles} file(s), ` +
					`-${result.removedFolders} folder(s), -${result.removedFiles} file(s)`,
			);
		}

		return result;
	}

	/** The walk reports bytes on disk; where writes are sealed, ask the driver. */
	private plainSize(key: string, diskSize: number): Promise<number> {
		return this.ctx.encrypted
			? this.ctx.driver.getObjectSize(key).catch(() => diskSize)
			: Promise.resolve(diskSize);
	}

	/** Shallowest first, so each folder's parent id already exists in the map. */
	private async insertMissingFolders(
		onDiskFolders: Set<string>,
		folderIdByPath: Map<string, string>,
	): Promise<number> {
		const missing = [...onDiskFolders]
			.filter((path) => !folderIdByPath.has(path))
			.sort((a, b) => a.split("/").length - b.split("/").length);

		let added = 0;
		for (const path of missing) {
			const parent = parentPath(path);

			// Another pass (or process) may have inserted it since we listed;
			// the unique index keeps one row, and its id is the parent to use.
			const [inserted] = await this.ctx.db
				.insert(folders)
				.values({
					id: crypto.randomUUID(),
					name: basename(path),
					ownerId: this.ctx.user.id,
					volumeId: this.ctx.volumeId,
					path,
					parentId: parent ? (folderIdByPath.get(parent) ?? null) : null,
				})
				.onConflictDoNothing()
				.returning({ id: folders.id });
			const id =
				inserted?.id ??
				(
					await this.ctx.db
						.select({ id: folders.id })
						.from(folders)
						.where(
							and(
								eq(folders.path, path),
								eq(folders.isTrashed, false),
								ownedFolders(this.ctx),
							),
						)
				)[0]?.id;
			if (id) {
				folderIdByPath.set(path, id);
			}
			if (inserted) {
				added++;
			}
		}
		return added;
	}

	private async insertMissingFiles(
		{ keys, sizeByKey, mtimeByKey, inoByKey, versioning }: Listing,
		knownFilePaths: Set<string>,
		folderIdByPath: Map<string, string>,
		tick: (key: string) => void = () => undefined,
	): Promise<number> {
		const missing = keys.filter((key) => !knownFilePaths.has(key));

		let added = 0;
		for (const key of missing) {
			const parent = parentPath(key);
			const mtime = mtimeByKey.get(key);
			// The file's own date, not the scan's: every take read as equally new.
			const dated = mtime
				? { createdAt: new Date(mtime), updatedAt: new Date(mtime) }
				: {};

			const [inserted] = await this.ctx.db
				.insert(files)
				.values({
					id: crypto.randomUUID(),
					name: basename(key),
					ownerId: this.ctx.user.id,
					volumeId: this.ctx.volumeId,
					path: key,
					folderId: parent ? (folderIdByPath.get(parent) ?? null) : null,
					contentType: determineContentType(key),
					category: determineCategory(key),
					size: await this.plainSize(key, sizeByKey.get(key) ?? 0),
					// Only with a shadow beside it: a row scanned with versioning
					// off must still get one once it is turned on.
					inode: versioning ? (inoByKey.get(key) ?? null) : null,
					...dated,
				})
				.onConflictDoNothing()
				.returning({ id: files.id });
			if (!inserted) {
				tick(key);
				continue;
			}
			if (versioning) {
				await relinkShadow(this.ctx, inserted.id, key);
			}

			// Build the preview as part of the scan, so a mounted library is
			// browsable without every tile triggering an ffmpeg run.
			await this.thumbnails.warm(key, determineContentType(key));
			added++;
			tick(key);
		}
		return added;
	}

	/**
	 * Re-read files whose bytes changed under us. A sync client (Syncthing,
	 * rclone) writes a file progressively, so a scan that lands mid-transfer
	 * records a partial size — and `insertMissingFiles` never revisits a path it
	 * already knows. That matters because `proxy.ts` builds `Content-Length` and
	 * `Content-Range` from the stored size, so a stale row serves a truncated
	 * stream forever (an 80MB track playing as 19 seconds).
	 *
	 * Sizes come from the walk itself, so this costs no extra stat. A rewrite
	 * that keeps the size is only caught by a full rescan.
	 */
	private async refreshChangedFiles(
		existingFiles: ScannedFile[],
		{ keys, sizeByKey, mtimeByKey, inoByKey, versioning }: Listing,
		tick: (key: string) => void = () => undefined,
		full = false,
	): Promise<number> {
		const knownByPath = new Map(existingFiles.map((f) => [f.path, f] as const));

		let updated = 0;
		for (const key of keys) {
			const known = knownByPath.get(key);
			if (!known) {
				continue;
			}
			tick(key);

			const size = sizeByKey.get(key);
			const mtime = mtimeByKey.get(key);
			// A sealed file is bigger on disk than the plaintext its row records.
			const sameSize = size === known.size || size === sealedSize(known.size);
			// A re-render of the same length is the same size to the byte; only
			// the date says it changed. A row stamped by an older scan is newer
			// than its file, so that direction is a re-date, never a re-render.
			const rewritten =
				mtime !== undefined &&
				mtime - known.updatedAt.getTime() > DATE_SLACK_MS;
			const ino = inoByKey.get(key);
			if (versioning && ino && ino !== known.inode) {
				// Before the renders below are dropped: the version keeps them.
				if (known.inode && rewritten) {
					await promoteShadow(this.ctx, this.thumbnails, known, versioning);
				}
				await relinkShadow(this.ctx, known.id, key);
				await this.ctx.db
					.update(files)
					// `updatedAt` restated, or `$onUpdate` stamps it with now.
					.set({ inode: ino, updatedAt: known.updatedAt })
					.where(and(eq(files.id, known.id), ownedFiles(this.ctx)));
			}
			if (size === undefined || (sameSize && !rewritten && !full)) {
				// Rows scanned before dates were kept carry the scan's time.
				if (
					mtime &&
					Math.abs(known.updatedAt.getTime() - mtime) > DATE_SLACK_MS
				) {
					await this.ctx.db
						.update(files)
						.set({ updatedAt: new Date(mtime) })
						.where(and(eq(files.id, known.id), ownedFiles(this.ctx)));
					updated++;
				}
				continue;
			}

			await this.ctx.db
				.update(files)
				.set({
					size: await this.plainSize(key, size),
					...(full && {
						contentType: determineContentType(key),
						category: determineCategory(key),
					}),
					...unknownDuration(key),
					updatedAt: mtime ? new Date(mtime) : new Date(),
				})
				.where(and(eq(files.id, known.id), ownedFiles(this.ctx)));

			// Cover art and waveforms are cached by key, so they describe the
			// partial file until dropped, then rebuilt from the new bytes.
			await this.thumbnails.deleteThumbnails(key);
			await this.thumbnails.warm(key, determineContentType(key));
			updated++;
		}
		return updated;
	}

	private async removeVanishedFiles(
		existingFiles: Array<{ id: string; path: string }>,
		keys: string[],
	): Promise<number> {
		const onDisk = new Set(keys);
		const vanished = existingFiles
			.filter((file) => !onDisk.has(file.path))
			.map((file) => file.id);

		if (vanished.length === 0) {
			return 0;
		}

		for (const ids of chunks(vanished)) {
			await this.ctx.db
				.delete(files)
				.where(and(ownedFiles(this.ctx), inArray(files.id, ids)));
		}
		await purgeGrantsFor(this.ctx.db, "file", vanished);
		await dropVersionBytes(this.ctx, vanished);
		return vanished.length;
	}

	/**
	 * Folders are pruned by checking the directory itself, not by whether any
	 * file key still sits under it — otherwise an empty folder someone created
	 * in the UI would be deleted by the next scan.
	 */
	private async removeVanishedFolders(
		existingFolders: Array<{ id: string; path: string }>,
	): Promise<number> {
		const vanished: string[] = [];
		for (const { id, path } of existingFolders) {
			if (await bytesGone(this.ctx, path)) {
				vanished.push(id);
			}
		}

		if (vanished.length === 0) {
			return 0;
		}

		for (const ids of chunks(vanished)) {
			await this.ctx.db
				.delete(folders)
				.where(and(ownedFolders(this.ctx), inArray(folders.id, ids)));
		}
		await purgeGrantsFor(this.ctx.db, "folder", vanished);
		return vanished.length;
	}
}
