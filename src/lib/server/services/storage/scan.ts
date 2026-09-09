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

import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { parseFile } from "music-metadata";
import { Logger } from "$lib/logger";
import { files, folders } from "$lib/server/db/schema";
import type { StorageContext } from "./context";
import { determineCategory, determineContentType } from "./mappers";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("StorageScan");

export interface ScanResult {
	addedFolders: number;
	addedFiles: number;
	updatedFiles: number;
	removedFolders: number;
	removedFiles: number;
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

/** Every ancestor directory of a key: `a/b/c.mp3` → `a`, `a/b` */
export function ancestorFolders(key: string): string[] {
	const segments = key.split("/");
	segments.pop();

	const result: string[] = [];
	for (let i = 1; i <= segments.length; i++) {
		result.push(segments.slice(0, i).join("/"));
	}
	return result;
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
	) {}

	async scan(): Promise<ScanResult> {
		const keys = (await this.ctx.driver.listObjectKeys()).filter(isScannable);

		const [existingFolders, existingFiles] = await Promise.all([
			this.ctx.db
				.select({ id: folders.id, path: folders.path })
				.from(folders)
				.where(eq(folders.ownerId, this.ctx.user.id)),
			this.ctx.db
				.select({ id: files.id, path: files.path, size: files.size })
				.from(files)
				.where(eq(files.ownerId, this.ctx.user.id)),
		]);

		const folderIdByPath = new Map(
			existingFolders.map((f) => [f.path, f.id] as const),
		);
		const knownFilePaths = new Set(existingFiles.map((f) => f.path));

		const onDiskFolders = new Set(keys.flatMap(ancestorFolders));

		const result = { ...EMPTY_RESULT };
		result.addedFolders = await this.insertMissingFolders(
			onDiskFolders,
			folderIdByPath,
		);
		result.addedFiles = await this.insertMissingFiles(
			keys,
			knownFilePaths,
			folderIdByPath,
		);
		result.updatedFiles = await this.refreshChangedFiles(existingFiles, keys);
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
			const id = crypto.randomUUID();
			const parent = parentPath(path);

			await this.ctx.db.insert(folders).values({
				id,
				name: basename(path),
				ownerId: this.ctx.user.id,
				path,
				parentId: parent ? (folderIdByPath.get(parent) ?? null) : null,
			});

			folderIdByPath.set(path, id);
			added++;
		}
		return added;
	}

	private async insertMissingFiles(
		keys: string[],
		knownFilePaths: Set<string>,
		folderIdByPath: Map<string, string>,
	): Promise<number> {
		const missing = keys.filter((key) => !knownFilePaths.has(key));

		let added = 0;
		for (const key of missing) {
			const parent = parentPath(key);

			await this.ctx.db.insert(files).values({
				id: crypto.randomUUID(),
				name: basename(key),
				ownerId: this.ctx.user.id,
				path: key,
				folderId: parent ? (folderIdByPath.get(parent) ?? null) : null,
				contentType: determineContentType(key),
				category: determineCategory(key),
				size: await this.ctx.driver.getObjectSize(key).catch(() => 0),
			});
			added++;
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
	 * ponytail: size-only comparison, one stat per known file per scan. Cheap
	 * enough for a mounted library; switch to mtime (or a stat cache) if a scan
	 * over a very large tree starts showing up.
	 */
	private async refreshChangedFiles(
		existingFiles: Array<{ id: string; path: string; size: number }>,
		keys: string[],
	): Promise<number> {
		const knownByPath = new Map(existingFiles.map((f) => [f.path, f] as const));

		let updated = 0;
		for (const key of keys) {
			const known = knownByPath.get(key);
			if (!known) {
				continue;
			}

			const size = await this.ctx.driver.getObjectSize(key).catch(() => null);
			if (size === null || size === known.size) {
				continue;
			}

			await this.ctx.db
				.update(files)
				.set({
					size,
					...(await this.readMediaDuration(key)),
					updatedAt: new Date(),
				})
				.where(
					and(eq(files.id, known.id), eq(files.ownerId, this.ctx.user.id)),
				);

			// Cover art and waveforms are cached by key, so they describe the
			// partial file until dropped.
			await this.thumbnails.deleteThumbnails(key);
			updated++;
		}
		return updated;
	}

	/** Media duration for the changed bytes; `{}` for anything not playable. */
	private async readMediaDuration(
		key: string,
	): Promise<{ musicDuration?: number } | { videoDuration?: number } | object> {
		const category = determineCategory(key);
		if (category !== "MUSIC" && category !== "VIDEO") {
			return {};
		}

		let localPath: string | undefined;
		let isTemp = false;
		try {
			({ path: localPath, isTemp } =
				await this.thumbnails.getLocalOrTempPath(key));
			const duration = (await parseFile(localPath)).format.duration ?? 0;
			return category === "MUSIC"
				? { musicDuration: duration }
				: { videoDuration: duration };
		} catch (error) {
			logger.warn(`Failed to re-read media metadata for ${key}`, error);
			return {};
		} finally {
			if (isTemp && localPath) {
				await unlink(localPath).catch(() => {
					// best-effort cleanup of the temp file
				});
			}
		}
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

		await this.ctx.db
			.delete(files)
			.where(
				and(eq(files.ownerId, this.ctx.user.id), inArray(files.id, vanished)),
			);
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
		const vanished = existingFolders
			.filter(({ path }) => !existsSync(join(this.ctx.storagePath, path)))
			.map(({ id }) => id);

		if (vanished.length === 0) {
			return 0;
		}

		await this.ctx.db
			.delete(folders)
			.where(
				and(
					eq(folders.ownerId, this.ctx.user.id),
					inArray(folders.id, vanished),
				),
			);
		return vanished.length;
	}
}
