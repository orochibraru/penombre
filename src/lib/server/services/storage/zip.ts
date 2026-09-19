/**
 * Bulk download: a Go worker builds the archive to a temp file, and this
 * service streams that file back, deleting it once the stream is done.
 *
 * Entries are named by their display names rather than their stored UUID
 * paths, so the archive mirrors what the user sees in the browser.
 */

import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { and, eq, like } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { getStoragePath } from "#lib/server/config.js";
import type { Folder as DbFolder } from "#lib/server/db/schema.js";
import { files, folders } from "#lib/server/db/schema.js";
import { awaitJob, enqueueJob } from "#lib/server/services/jobs.js";
import type { StorageContext } from "./context";
import { buildDisplayPathForFile } from "./mappers";
import { ownedFiles, ownedFolders } from "./scope";

const logger = new Logger("StorageService");

const ZIP_JOB_TIMEOUT_MS = 30 * 60 * 1000;
const STALE_ZIP_AGE_MS = 60 * 60 * 1000;

interface ZipEntry {
	source: string;
	name: string;
}

/** A dot-directory, so the library scan (which skips hidden segments) ignores it. */
function zipDir(): string {
	return join(getStoragePath(), ".tmp", "zips");
}

/** Delete `.tmp/zips` files older than an hour. Never throws — a sweep is best-effort. */
export async function sweepStaleZips(): Promise<void> {
	const dir = zipDir();
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch {
		return;
	}
	const cutoff = Date.now() - STALE_ZIP_AGE_MS;
	for (const name of entries) {
		const path = join(dir, name);
		try {
			const info = await stat(path);
			if (info.mtimeMs < cutoff) {
				await unlink(path);
			}
		} catch (error) {
			logger.warn(`[bulk-download] Failed to sweep ${path}:`, error);
		}
	}
}

export class ZipService {
	constructor(private readonly ctx: StorageContext) {}

	private async collectFolder(
		entries: ZipEntry[],
		folderPath: string,
		folderRecord: DbFolder,
	): Promise<void> {
		const allSubFolders = await this.ctx.db
			.select()
			.from(folders)
			.where(
				and(ownedFolders(this.ctx), like(folders.path, `${folderPath}/%`)),
			);
		const folderDisplayMap = new Map<string, string>([
			[folderPath, folderRecord.name],
			...allSubFolders.map((sf): [string, string] => [sf.path, sf.name]),
		]);

		// A folder listing hides trashed files; a zip of that folder must too,
		// or trashing a file inside an otherwise-normal folder leaves it in
		// every download of that folder forever.
		const allFilesUnder = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(
					ownedFiles(this.ctx),
					like(files.path, `${folderPath}/%`),
					eq(files.isTrashed, false),
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
			entries.push({
				source: join(this.ctx.storagePath, f.path),
				name: displayPath,
			});
		}
	}

	private async collectPath(
		entries: ZipEntry[],
		filePath: string,
	): Promise<void> {
		const normalizedPath = filePath.endsWith("/")
			? filePath.slice(0, -1)
			: filePath;

		const [fileRecord] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, normalizedPath), ownedFiles(this.ctx)));

		if (fileRecord) {
			entries.push({
				source: join(this.ctx.storagePath, fileRecord.path),
				name: fileRecord.name,
			});
			return;
		}

		const [folderRecord] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, normalizedPath), ownedFolders(this.ctx)));

		if (!folderRecord) {
			logger.warn(`[bulk-download] Skipping unknown path: ${filePath}`);
			return;
		}

		await this.collectFolder(entries, normalizedPath, folderRecord);
	}

	/** Enqueue the archive job, wait for it, and hand back a self-deleting stream. */
	private async buildZip(
		entries: ZipEntry[],
	): Promise<ReadableStream<Uint8Array>> {
		await mkdir(zipDir(), { recursive: true });
		const output = join(zipDir(), `${randomUUID()}.zip`);
		const startTime = performance.now();

		const jobId = await enqueueJob({
			type: "zip",
			spec: { output, entries },
			priority: "interactive",
		});
		const job = await awaitJob(jobId, {
			timeoutMs: ZIP_JOB_TIMEOUT_MS,
			consume: true,
		});
		if (!job || job.status !== "succeeded") {
			throw new Error(
				`Zip job ${jobId} ${job ? `failed: ${job.error}` : "timed out"}`,
			);
		}
		const { skipped = [] } = JSON.parse(job.result ?? "{}") as {
			skipped?: string[];
		};
		for (const source of skipped) {
			logger.warn(`[bulk-download] Skipped a file missing on disk: ${source}`);
		}

		logger.debug(
			`[bulk-download] Archive ready in ${(performance.now() - startTime).toFixed(0)}ms`,
		);
		return streamAndCleanUp(output);
	}

	async createZipFromPaths(
		filePaths: string[],
	): Promise<ReadableStream<Uint8Array>> {
		logger.debug(`[bulk-download] Creating zip with ${filePaths.length} items`);
		const entries: ZipEntry[] = [];
		for (const filePath of filePaths) {
			await this.collectPath(entries, filePath);
		}
		return this.buildZip(entries);
	}

	async createZipFromFolder(
		folderPath: string,
	): Promise<ReadableStream<Uint8Array>> {
		const normalizedPath = folderPath.endsWith("/")
			? folderPath.slice(0, -1)
			: folderPath;

		const [folderRecord] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, normalizedPath), ownedFolders(this.ctx)));
		if (!folderRecord) {
			throw new Error(`Folder not found: ${folderPath}`);
		}

		logger.debug(
			`[bulk-download] Creating zip for folder: ${folderPath} as ${folderRecord.name}`,
		);
		const entries: ZipEntry[] = [];
		await this.collectFolder(entries, normalizedPath, folderRecord);
		return this.buildZip(entries);
	}

	generateZipFilename(_paths: string[]): string {
		return "penombre-download.zip";
	}
}

/** Stream a finished archive, deleting it on end, error or cancel alike. */
export function streamAndCleanUp(path: string): ReadableStream<Uint8Array> {
	const nodeStream = createReadStream(path);
	let cleanedUp = false;
	const cleanUp = () => {
		if (cleanedUp) {
			return;
		}
		cleanedUp = true;
		unlink(path).catch((error: unknown) => {
			logger.warn(`[bulk-download] Failed to delete temp zip ${path}:`, error);
		});
	};
	// `close` fires whether the stream ended normally, errored, or was
	// destroyed by the web ReadableStream's cancel() — one hook, every case.
	nodeStream.on("close", cleanUp);
	return Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;
}
