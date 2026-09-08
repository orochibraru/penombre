/**
 * Bulk download: stream selected files, or a whole folder tree, as a zip.
 *
 * Entries are named by their display names rather than their stored UUID
 * paths, so the archive mirrors what the user sees in the browser.
 */

import type { Readable } from "node:stream";
import { Readable as NodeReadable } from "node:stream";
import archiver from "archiver";
import { and, eq, like } from "drizzle-orm";
import type { Folder as DbFolder } from "$lib/server/db/schema";
import { files, folders } from "$lib/server/db/schema";
import { logger } from "./constants";
import type { StorageContext } from "./context";
import { buildDisplayPathForFile } from "./mappers";

/** Surface archiver errors; a missing file is a warning, anything else rethrows */
function attachArchiveLogging(archive: archiver.Archiver): void {
	archive.on("error", (err) => {
		logger.error("[bulk-download] Archive error:", err);
		throw err;
	});
	archive.on("warning", (err) => {
		if (err.code === "ENOENT") {
			logger.warn("[bulk-download] File not found during archiving:", err);
		} else {
			throw err;
		}
	});
}

export class ZipService {
	constructor(private readonly ctx: StorageContext) {}

	async appendObject(
		archive: archiver.Archiver,
		key: string,
		name: string,
	): Promise<void> {
		const stream = await this.ctx.driver.getObjectStream(key);
		archive.append(
			NodeReadable.fromWeb(
				stream as unknown as Parameters<typeof NodeReadable.fromWeb>[0],
			),
			{ name },
		);
	}

	async appendFolder(
		archive: archiver.Archiver,
		folderPath: string,
		folderRecord: DbFolder,
	): Promise<void> {
		const allSubFolders = await this.ctx.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.ownerId, this.ctx.user.id),
					like(folders.path, `${folderPath}/%`),
				),
			);
		const folderDisplayMap = new Map<string, string>([
			[folderPath, folderRecord.name],
			...allSubFolders.map((sf): [string, string] => [sf.path, sf.name]),
		]);

		const allFilesUnder = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.ownerId, this.ctx.user.id),
					like(files.path, `${folderPath}/%`),
				),
			);

		for (const f of allFilesUnder) {
			const displayPath = buildDisplayPathForFile({
				filePath: f.path,
				displayName: f.name,
				folderBasePath: folderPath,
				folderDisplayName: folderRecord.name,
				folderDisplayMap,
			});
			await this.appendObject(archive, f.path, displayPath);
		}
	}

	async appendPath(
		archive: archiver.Archiver,
		filePath: string,
	): Promise<void> {
		const normalizedPath = filePath.endsWith("/")
			? filePath.slice(0, -1)
			: filePath;

		const [fileRecord] = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.path, normalizedPath),
					eq(files.ownerId, this.ctx.user.id),
				),
			);

		if (fileRecord) {
			await this.appendObject(archive, fileRecord.path, fileRecord.name);
			return;
		}

		const [folderRecord] = await this.ctx.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.path, normalizedPath),
					eq(folders.ownerId, this.ctx.user.id),
				),
			);

		if (!folderRecord) {
			logger.warn(`[bulk-download] Skipping unknown path: ${filePath}`);
			return;
		}

		await this.appendFolder(archive, normalizedPath, folderRecord);
	}

	async createZipFromPaths(
		filePaths: string[],
	): Promise<{ stream: Readable; archive: archiver.Archiver }> {
		const archive = archiver("zip", { zlib: { level: 6 } });
		const startTime = performance.now();
		logger.debug(`[bulk-download] Creating zip with ${filePaths.length} items`);

		attachArchiveLogging(archive);

		for (const filePath of filePaths) {
			await this.appendPath(archive, filePath);
		}

		void archive.finalize().then(() => {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[bulk-download] Archive finalized in ${elapsed}ms`);
		});

		return { stream: archive as unknown as Readable, archive };
	}

	async createZipFromFolder(
		folderPath: string,
	): Promise<{ stream: Readable; archive: archiver.Archiver }> {
		const normalizedPath = folderPath.endsWith("/")
			? folderPath.slice(0, -1)
			: folderPath;

		const [folderRecord] = await this.ctx.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.path, normalizedPath),
					eq(folders.ownerId, this.ctx.user.id),
				),
			);
		if (!folderRecord) {
			throw new Error(`Folder not found: ${folderPath}`);
		}

		const archive = archiver("zip", { zlib: { level: 6 } });
		const startTime = performance.now();
		const folderDisplayName = folderRecord.name;

		logger.debug(
			`[bulk-download] Creating zip for folder: ${folderPath} as ${folderDisplayName}`,
		);

		archive.on("error", (err) => {
			logger.error("[bulk-download] Archive error:", err);
			throw err;
		});

		const allSubFolders = await this.ctx.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.ownerId, this.ctx.user.id),
					like(folders.path, `${normalizedPath}/%`),
				),
			);
		const folderDisplayMap = new Map<string, string>([
			[normalizedPath, folderDisplayName],
			...allSubFolders.map((sf): [string, string] => [sf.path, sf.name]),
		]);

		const allFiles = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.ownerId, this.ctx.user.id),
					like(files.path, `${normalizedPath}/%`),
				),
			);

		for (const f of allFiles) {
			const displayPath = buildDisplayPathForFile({
				filePath: f.path,
				displayName: f.name,
				folderBasePath: normalizedPath,
				folderDisplayName,
				folderDisplayMap,
			});
			const stream = await this.ctx.driver.getObjectStream(f.path);
			archive.append(
				NodeReadable.fromWeb(
					stream as unknown as Parameters<typeof NodeReadable.fromWeb>[0],
				),
				{ name: displayPath },
			);
		}

		archive.finalize().then(() => {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[bulk-download] Folder archive finalized in ${elapsed}ms`);
		});

		return { stream: archive as unknown as Readable, archive };
	}

	generateZipFilename(_paths: string[]): string {
		return "penombre-download.zip";
	}
}
