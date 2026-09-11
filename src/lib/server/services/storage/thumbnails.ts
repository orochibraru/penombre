/**
 * Thumbnail and waveform generation.
 *
 * Generation shells out to ffmpeg, pdftoppm and sharp, so it is capped by a
 * semaphore and cached on the local filesystem under `.thumbnails/`, even when
 * the storage backend itself is remote.
 */

import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";
import { Logger } from "$lib/logger";
import { files } from "$lib/server/db/schema";
import type { StorageContext } from "./context";
import { ownedFiles } from "./scope";

const logger = new Logger("StorageService");

/** Loudest sample in each of `buckets` slices, normalised to 0..1. */
function bucketPeaks(samples: Int16Array, buckets: number): number[] {
	const perBucket = Math.max(1, Math.floor(samples.length / buckets));
	const peaks: number[] = [];

	for (let b = 0; b < buckets; b++) {
		const start = b * perBucket;
		if (start >= samples.length) {
			break;
		}
		const end = Math.min(start + perBucket, samples.length);
		let peak = 0;
		for (let i = start; i < end; i++) {
			const value = Math.abs(samples[i] ?? 0);
			if (value > peak) {
				peak = value;
			}
		}
		// Three decimals is well below one pixel of a rendered bar.
		peaks.push(Math.round((peak / 32_768) * 1000) / 1000);
	}

	return peaks;
}

class ThumbnailSemaphore {
	private running = 0;
	private readonly queue: Array<() => void> = [];

	constructor(private readonly maxConcurrent: number) {}

	acquire(): Promise<void> {
		if (this.running < this.maxConcurrent) {
			this.running++;
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			this.queue.push(() => {
				this.running++;
				resolve();
			});
		});
	}

	release(): void {
		this.running--;
		const next = this.queue.shift();
		if (next) {
			next();
		}
	}

	get stats() {
		return { running: this.running, queued: this.queue.length };
	}
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

/** At most four thumbnail jobs run at once, process-wide */
const thumbnailSemaphore = new ThumbnailSemaphore(4);

export class ThumbnailService {
	constructor(private readonly ctx: StorageContext) {}

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

	/**
	 * Precompute this file's thumbnail (or waveform, for audio).
	 *
	 * Never throws: a missing ffmpeg or an unreadable file must not fail the
	 * upload or abort a library scan. Unsupported types return early inside
	 * `generateThumbnail`, so calling this for every file is cheap.
	 */
	async warm(key: string, contentType: string): Promise<void> {
		try {
			await this.generateThumbnail(
				key,
				contentType,
				ThumbnailService.WARM_SIZE,
			);
		} catch (error) {
			logger.warn(`[thumbnail] Warm failed for ${key}:`, error);
		}
	}

	async getThumbnail(
		key: string,
		size = 300,
	): Promise<{ buffer: Buffer; contentType: string } | null> {
		const [file] = await this.ctx.db
			.select({ contentType: files.contentType })
			.from(files)
			.where(and(eq(files.path, key), ownedFiles(this.ctx)));
		if (!file) {
			return null;
		}
		return this.generateThumbnail(key, file.contentType, size);
	}

	async getLocalOrTempPath(
		key: string,
	): Promise<{ path: string; isTemp: boolean }> {
		const localPath = join(this.ctx.storagePath, key);
		if (existsSync(localPath)) {
			return { path: localPath, isTemp: false };
		}
		const content = await this.ctx.driver.readObject(key);
		const tmpPath = join(
			tmpdir(),
			`penombre-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		await Bun.write(tmpPath, content);
		return { path: tmpPath, isTemp: true };
	}

	async generateVideoThumbnail(
		videoPath: string,
		outputPath: string,
		size: number,
	): Promise<Buffer> {
		const tempPng = `${outputPath}.tmp.png`;
		const startTime = performance.now();
		logger.debug(`[thumbnail:video] Starting generation for ${videoPath}`);

		try {
			const result = await Bun.spawn([
				"ffmpeg",
				"-y",
				"-ss",
				"1",
				"-i",
				videoPath,
				"-vframes",
				"1",
				"-vf",
				`scale=${size}:${size}:force_original_aspect_ratio=decrease`,
				tempPng,
			]).exited;

			if (result !== 0) {
				logger.debug(
					"[thumbnail:video] First attempt failed, trying from beginning",
				);
				const fallbackResult = await Bun.spawn([
					"ffmpeg",
					"-y",
					"-i",
					videoPath,
					"-vframes",
					"1",
					"-vf",
					`scale=${size}:${size}:force_original_aspect_ratio=decrease`,
					tempPng,
				]).exited;

				if (fallbackResult !== 0) {
					throw new Error("ffmpeg failed to extract video frame");
				}
			}

			const thumbnail = await sharp(tempPng).webp({ quality: 80 }).toBuffer();
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(
				`[thumbnail:video] Generated ${thumbnail.length} bytes in ${elapsed}ms`,
			);
			try {
				await unlink(tempPng);
			} catch {
				// best-effort cleanup of the temp file
			}
			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:video] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(tempPng);
			} catch {
				// best-effort cleanup of the temp file
			}
			throw error;
		}
	}

	async generatePdfThumbnail(
		pdfPath: string,
		outputPath: string,
		size: number,
	): Promise<Buffer> {
		const tempPrefix = `${outputPath}.tmp`;
		const startTime = performance.now();
		logger.debug(`[thumbnail:pdf] Starting generation for ${pdfPath}`);

		try {
			const result = await Bun.spawn([
				"pdftoppm",
				"-png",
				"-f",
				"1",
				"-l",
				"1",
				"-scale-to",
				String(size),
				"-singlefile",
				pdfPath,
				tempPrefix,
			]).exited;

			if (result !== 0) {
				throw new Error("pdftoppm failed to render PDF");
			}

			const tempPng = `${tempPrefix}.png`;
			const thumbnail = await sharp(tempPng)
				.resize(size, size, { fit: "inside", withoutEnlargement: true })
				.webp({ quality: 80 })
				.toBuffer();

			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(
				`[thumbnail:pdf] Generated ${thumbnail.length} bytes in ${elapsed}ms`,
			);
			try {
				await unlink(tempPng);
			} catch {
				// best-effort cleanup of the temp file
			}
			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:pdf] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(`${tempPrefix}.png`);
			} catch {
				// best-effort cleanup of the temp file
			}
			throw error;
		}
	}

	/**
	 * Amplitude peaks for an audio file, normalised to 0..1.
	 *
	 * Peaks rather than a rendered image on purpose: `showwavespic` bakes a
	 * colour into a bitmap, so a waveform generated under one accent stayed
	 * that colour forever after. Numbers let the client draw an SVG in
	 * whatever colour the theme currently is.
	 */
	async generateAudioPeaks(
		audioPath: string,
		buckets = ThumbnailService.PEAK_BUCKETS,
	): Promise<number[]> {
		const startTime = performance.now();
		logger.debug(`[thumbnail:audio] Extracting peaks for ${audioPath}`);

		// Mono, 8 kHz, signed 16-bit: far more resolution than a few hundred
		// buckets need, and it keeps the decode cheap on a long file.
		const proc = Bun.spawn(
			[
				"ffmpeg",
				"-v",
				"error",
				"-i",
				audioPath,
				"-ac",
				"1",
				"-ar",
				"8000",
				"-f",
				"s16le",
				"-",
			],
			{ stdout: "pipe", stderr: "ignore" },
		);

		const raw = Buffer.from(await new Response(proc.stdout).arrayBuffer());
		if ((await proc.exited) !== 0 || raw.length < 2) {
			throw new Error("ffmpeg failed to decode audio for peaks");
		}

		const samples = new Int16Array(
			raw.buffer,
			raw.byteOffset,
			Math.floor(raw.length / 2),
		);
		const peaks = bucketPeaks(samples, buckets);

		const elapsed = (performance.now() - startTime).toFixed(0);
		logger.debug(
			`[thumbnail:audio] Extracted ${peaks.length} peaks in ${elapsed}ms`,
		);
		return peaks;
	}

	/** Produce the bytes for one thumbnail, chosen by the file's kind. */
	private render(
		kind: { isImage: boolean; isVideo: boolean; isAudio: boolean },
		paths: { localPath: string; thumbPath: string; size: number },
	): Promise<Buffer> {
		const { localPath, thumbPath, size } = paths;

		if (kind.isImage) {
			return sharp(localPath)
				.resize(size, size, { fit: "inside", withoutEnlargement: true })
				.webp({ quality: 80 })
				.toBuffer();
		}
		if (kind.isVideo) {
			return this.generateVideoThumbnail(localPath, thumbPath, size);
		}
		if (kind.isAudio) {
			return this.generateAudioPeaks(localPath).then((peaks) =>
				Buffer.from(JSON.stringify(peaks)),
			);
		}
		return this.generatePdfThumbnail(localPath, thumbPath, size);
	}

	async generateThumbnail(
		key: string,
		contentType: string,
		size = 300,
	): Promise<{ buffer: Buffer; contentType: string } | null> {
		const isImage = IMAGE_TYPES.includes(
			contentType as (typeof IMAGE_TYPES)[number],
		);
		const isVideo = VIDEO_TYPES.includes(
			contentType as (typeof VIDEO_TYPES)[number],
		);
		const isPdf = DOCUMENT_TYPES.includes(
			contentType as (typeof DOCUMENT_TYPES)[number],
		);
		const isAudio = AUDIO_TYPES.includes(
			contentType as (typeof AUDIO_TYPES)[number],
		);

		if (!(isImage || isVideo || isPdf || isAudio)) {
			return null;
		}

		const thumbDir = join(this.ctx.storagePath, ".thumbnails");
		const safeKey = key.replace(/\//g, "_");
		// Audio is peak data, not a picture, so it is cached and served as
		// JSON — the client draws the SVG in the current accent colour.
		const outputType = isAudio ? "application/json" : "image/webp";
		const thumbPath = join(
			thumbDir,
			isAudio ? `${safeKey}_peaks.json` : `${safeKey}_${size}.webp`,
		);

		if (existsSync(thumbPath)) {
			logger.debug(`[thumbnail] Cache hit for ${key}`);
			const cached = await Bun.file(thumbPath).arrayBuffer();
			return { buffer: Buffer.from(cached), contentType: outputType };
		}

		const stats = thumbnailSemaphore.stats;
		logger.debug(
			`[thumbnail] Waiting for slot (running: ${stats.running}, queued: ${stats.queued}) for ${key}`,
		);
		await thumbnailSemaphore.acquire();

		try {
			// Double-check cache after acquiring slot
			if (existsSync(thumbPath)) {
				logger.debug(`[thumbnail] Cache hit after wait for ${key}`);
				const cached = await Bun.file(thumbPath).arrayBuffer();
				return { buffer: Buffer.from(cached), contentType: outputType };
			}

			await mkdir(thumbDir, { recursive: true });

			const { path: localPath, isTemp } = await this.getLocalOrTempPath(key);
			let thumbnail: Buffer;

			try {
				thumbnail = await this.render(
					{ isImage, isVideo, isAudio },
					{ localPath, thumbPath, size },
				);
			} finally {
				if (isTemp) {
					try {
						await unlink(localPath);
					} catch {
						// best-effort cleanup of the temp file
					}
				}
			}

			await Bun.write(thumbPath, thumbnail);
			logger.debug(
				`[thumbnail] Cached ${thumbnail.length} bytes to ${thumbPath}`,
			);
			return { buffer: thumbnail, contentType: outputType };
		} catch (error) {
			logger.error(`[thumbnail] Error generating thumbnail for ${key}:`, error);
			return null;
		} finally {
			thumbnailSemaphore.release();
		}
	}
}
