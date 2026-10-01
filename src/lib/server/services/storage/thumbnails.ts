/**
 * Thumbnail and waveform generation.
 *
 * Rendering happens off-process: `generateThumbnail` enqueues a `"thumbnail"`
 * job for the Go worker (ffmpeg, pdftoppm, libwebp) and reads back whatever it
 * wrote under `.thumbnails/`, even when the storage backend itself is remote.
 * Documents, sheets and decks are the exception: only TypeScript reads them,
 * so their first page is laid out here as a PDF, which the worker rasterises.
 */

import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { link, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { PAGE_PREVIEW_TYPES } from "#lib/documents.js";
import { Logger } from "#lib/logger.js";
import {
	isSealed,
	type Keyring,
	openWhole,
} from "#lib/server/crypto/envelope.js";
import { keyring } from "#lib/server/crypto/keyring.js";
import { files } from "#lib/server/db/schema.js";
import { firstPagePdf } from "#lib/server/office/export/index.js";
import { awaitJob, enqueueJob } from "#lib/server/services/jobs.js";
import type { StorageContext } from "./context";
import { generateETag } from "./mappers";
import { ownedFiles } from "./scope";

const logger = new Logger("StorageService");

/** `buffer` is null when `ifNoneMatch` already names this render. */
export interface Thumbnail {
	buffer: Buffer | null;
	contentType: string;
	etag: string;
}

const IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
	"image/tiff",
] as const;

const VIDEO_TYPES = [
	"video/mp4",
	"video/webm",
	"video/x-msvideo",
	"video/x-matroska",
	"video/quicktime",
	"video/x-ms-wmv",
	"video/x-flv",
	"video/mpeg",
	"video/3gpp",
	"video/ogg",
] as const;

const DOCUMENT_TYPES = ["application/pdf"] as const;

const AUDIO_TYPES = [
	"audio/mpeg",
	"audio/wav",
	"audio/flac",
	"audio/aac",
	"audio/ogg",
	"audio/mp4",
	"audio/x-ms-wma",
	"audio/aiff",
	"audio/x-m4a",
	"audio/webm",
] as const;

/** `page`: a document, sheet or deck, laid out here as a one-page PDF. */
type Kind = "image" | "video" | "pdf" | "audio" | "page";

function kindOf(contentType: string): Kind | undefined {
	const is = (list: readonly string[]) => list.includes(contentType);
	if (is(IMAGE_TYPES)) {
		return "image";
	}
	if (is(VIDEO_TYPES)) {
		return "video";
	}
	if (is(DOCUMENT_TYPES)) {
		return "pdf";
	}
	if (is(AUDIO_TYPES)) {
		return "audio";
	}
	if (PAGE_PREVIEW_TYPES[contentType]) {
		return "page";
	}
	return undefined;
}

export class ThumbnailService {
	constructor(
		private readonly ctx: StorageContext,
		private readonly keys: Keyring = keyring(),
	) {}

	async deleteThumbnails(key: string): Promise<void> {
		try {
			const thumbDir = join(this.ctx.storagePath, ".thumbnails");
			if (!existsSync(thumbDir)) {
				return;
			}
			const safeKey = key.replace(/\//g, "_");
			const thumbFiles = await fs.promises.readdir(thumbDir);
			for (const thumbFile of thumbFiles) {
				if (thumbFile.startsWith(`${safeKey}_`)) {
					await unlink(join(thumbDir, thumbFile));
				}
			}
		} catch (error) {
			logger.warn("Error deleting thumbnails:", error);
		}
	}

	/**
	 * Gives `toKey` the renders `fromKey` already has, as hard links. A version
	 * is a link to the bytes those renders were made from, so they are its
	 * renders too — and the file's own are about to be deleted for new bytes.
	 */
	async adopt(fromKey: string, toKey: string): Promise<void> {
		try {
			const thumbDir = join(this.ctx.storagePath, ".thumbnails");
			const from = `${fromKey.replace(/\//g, "_")}_`;
			const to = `${toKey.replace(/\//g, "_")}_`;
			const entries = await fs.promises.readdir(thumbDir).catch(() => []);
			for (const entry of entries) {
				if (entry.startsWith(from) && !entry.endsWith(".tmp")) {
					await link(
						join(thumbDir, entry),
						join(thumbDir, to + entry.slice(from.length)),
					).catch(() => undefined);
				}
			}
		} catch (error) {
			logger.warn("Error adopting thumbnails:", error);
		}
	}

	/**
	 * The size the grid asks for. Warming it at write time means the first
	 * view is a cache hit instead of an ffmpeg run per tile.
	 */
	static readonly WARM_SIZE = 300;

	/** Bars in a waveform. Enough detail for a wide tile, still a small file. */
	static readonly PEAK_BUCKETS = 400;

	private plan(key: string, contentType: string, size: number) {
		const kind = kindOf(contentType);
		if (!kind) {
			return undefined;
		}
		const safeKey = key.replace(/\//g, "_");
		const output = join(
			this.ctx.storagePath,
			".thumbnails",
			kind === "audio" ? `${safeKey}_peaks.json` : `${safeKey}_${size}.webp`,
		);
		// Beside the renders, so deleting or adopting them covers it too.
		const page =
			kind === "page"
				? { key: `.thumbnails/${safeKey}_page.pdf`, contentType }
				: undefined;
		return {
			output,
			outputType: kind === "audio" ? "application/json" : "image/webp",
			page,
			job: {
				type: "thumbnail",
				dedupeKey: output,
				spec: {
					kind: page ? "pdf" : kind,
					source: join(this.ctx.storagePath, page?.key ?? key),
					output,
					size,
					buckets: ThumbnailService.PEAK_BUCKETS,
					encrypt: this.ctx.encrypted,
				},
			},
		};
	}

	/** Never throws: a failed enqueue must not fail an upload or a scan. */
	async warm(key: string, contentType: string): Promise<void> {
		const plan = this.plan(key, contentType, ThumbnailService.WARM_SIZE);
		// A page is laid out in this process, so on view: an editor's
		// autosave every few seconds would otherwise lay it out each time.
		if (!plan || plan.page || existsSync(plan.output)) {
			return;
		}
		try {
			await enqueueJob({ ...plan.job, priority: "background" });
		} catch (error) {
			logger.warn(`[thumbnail] Warm failed for ${key}:`, error);
		}
	}

	/**
	 * Writes the first page of `key` as a PDF for the worker to rasterise,
	 * sealed like the file. False when there is nothing to draw.
	 */
	private async layOut(
		key: string,
		page: { key: string; contentType: string },
	): Promise<boolean> {
		if (existsSync(join(this.ctx.storagePath, page.key))) {
			return true;
		}
		try {
			const pdf = await firstPagePdf(
				`page.${PAGE_PREVIEW_TYPES[page.contentType]}`,
				await this.ctx.driver.readObject(key),
			);
			if (pdf) {
				await this.ctx.driver.writeObject(page.key, pdf);
			}
			return pdf !== null;
		} catch (error) {
			logger.warn(`[thumbnail] Could not lay out ${key}:`, error);
			return false;
		}
	}

	async getThumbnail(
		key: string,
		size = 300,
		ifNoneMatch?: string,
	): Promise<Thumbnail | null> {
		const [file] = await this.ctx.db
			.select({ contentType: files.contentType })
			.from(files)
			.where(and(eq(files.path, key), ownedFiles(this.ctx)));
		if (!file) {
			return null;
		}
		return this.generateThumbnail(key, file.contentType, size, ifNoneMatch);
	}

	async generateThumbnail(
		key: string,
		contentType: string,
		size = 300,
		ifNoneMatch?: string,
	): Promise<Thumbnail | null> {
		const plan = this.plan(key, contentType, size);
		if (!plan) {
			return null;
		}
		try {
			if (!existsSync(plan.output)) {
				if (plan.page && !(await this.layOut(key, plan.page))) {
					return null;
				}
				// The job may be a warm-up or another tab's request: leave it
				// for them rather than cancel it at this tile's deadline.
				const job = await awaitJob(
					await enqueueJob({ ...plan.job, priority: "interactive" }),
					{ cancelOnTimeout: false },
				);
				if (job?.status !== "succeeded") {
					logger.warn(
						`[thumbnail] No thumbnail for ${key}: ${job?.error ?? "timed out"}`,
					);
					return null;
				}
			}
			const info = await stat(plan.output);
			const etag = generateETag({ size: info.size, mtime: info.mtimeMs });
			if (ifNoneMatch === etag) {
				return { buffer: null, contentType: plan.outputType, etag };
			}
			const bytes = await Bun.file(plan.output).bytes();
			return {
				buffer: isSealed(bytes)
					? openWhole(this.keys, bytes)
					: Buffer.from(bytes),
				contentType: plan.outputType,
				etag,
			};
		} catch (error) {
			logger.error(`[thumbnail] Error generating thumbnail for ${key}:`, error);
			return null;
		}
	}
}
