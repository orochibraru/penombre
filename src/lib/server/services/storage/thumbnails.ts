/**
 * Thumbnail and waveform generation.
 *
 * Rendering happens off-process: `generateThumbnail` enqueues a `"thumbnail"`
 * job for the Go worker (ffmpeg, pdftoppm, libwebp) and reads back whatever it
 * wrote under `.thumbnails/`, even when the storage backend itself is remote.
 */

import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import {
	isSealed,
	type Keyring,
	openWhole,
} from "#lib/server/crypto/envelope.js";
import { keyring } from "#lib/server/crypto/keyring.js";
import { files } from "#lib/server/db/schema.js";
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

type Kind = "image" | "video" | "pdf" | "audio";

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
		return {
			output,
			outputType: kind === "audio" ? "application/json" : "image/webp",
			job: {
				type: "thumbnail",
				dedupeKey: output,
				spec: {
					kind,
					source: join(this.ctx.storagePath, key),
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
		if (!plan || existsSync(plan.output)) {
			return;
		}
		try {
			await enqueueJob({ ...plan.job, priority: "background" });
		} catch (error) {
			logger.warn(`[thumbnail] Warm failed for ${key}:`, error);
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
