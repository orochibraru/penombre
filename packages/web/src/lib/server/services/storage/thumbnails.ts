import { existsSync } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { logger } from "./constants";

// ================================
// Concurrency Control
// ================================

/**
 * Simple semaphore for limiting concurrent thumbnail generation.
 * Prevents server overload when many thumbnails are requested simultaneously.
 */
class ThumbnailSemaphore {
	private running = 0;
	private queue: Array<() => void> = [];

	constructor(private maxConcurrent: number) {}

	async acquire(): Promise<void> {
		if (this.running < this.maxConcurrent) {
			this.running++;
			return;
		}

		// Wait in queue
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

/**
 * Service for generating thumbnails and waveforms for various media types.
 * Supports images, videos, PDFs, and audio files with caching and concurrency control.
 */
export class ThumbnailService {
	// Limit to 4 concurrent thumbnail generations (adjust based on server resources)
	private thumbnailSemaphore = new ThumbnailSemaphore(4);

	readonly IMAGE_TYPES = [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/bmp",
		"image/tiff",
	] as const;

	readonly VIDEO_TYPES = [
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

	readonly DOCUMENT_TYPES = ["application/pdf"] as const;

	readonly AUDIO_TYPES = [
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

	/**
	 * Generates a thumbnail from a video file using ffmpeg.
	 * Extracts a frame at 1 second (or first frame if video is shorter).
	 */
	async generateVideoThumbnail(
		videoPath: string,
		outputPath: string,
		size: number,
	): Promise<Buffer> {
		const tempPng = `${outputPath}.tmp.png`;
		const startTime = performance.now();
		logger.debug(`[thumbnail:video] Starting generation for ${videoPath}`);

		try {
			// Extract frame at 1 second (or beginning if shorter)
			const result = await Bun.spawn([
				"ffmpeg",
				"-y", // Overwrite output
				"-ss",
				"1", // Seek to 1 second
				"-i",
				videoPath,
				"-vframes",
				"1", // Extract 1 frame
				"-vf",
				`scale=${size}:${size}:force_original_aspect_ratio=decrease`,
				tempPng,
			]).exited;

			if (result !== 0) {
				logger.debug(
					"[thumbnail:video] First attempt failed, trying from beginning",
				);
				// Try extracting from the beginning if 1 second seek failed
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

			// Convert PNG to WebP using sharp
			const thumbnail = await sharp(tempPng).webp({ quality: 80 }).toBuffer();

			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(
				`[thumbnail:video] Generated ${thumbnail.length} bytes in ${elapsed}ms`,
			);

			// Clean up temp file
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}

			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:video] Failed after ${elapsed}ms: ${error}`);
			// Clean up temp file on error
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	/**
	 * Generates a thumbnail from a PDF file using pdftoppm (poppler-utils).
	 * Renders the first page as an image.
	 */
	async generatePdfThumbnail(
		pdfPath: string,
		outputPath: string,
		size: number,
	): Promise<Buffer> {
		const tempPrefix = `${outputPath}.tmp`;
		const startTime = performance.now();
		logger.debug(`[thumbnail:pdf] Starting generation for ${pdfPath}`);

		try {
			// Use pdftoppm to render first page
			// -png: output as PNG
			// -f 1 -l 1: first page only
			// -scale-to: scale to fit within size
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

			// pdftoppm outputs as {prefix}.png
			const tempPng = `${tempPrefix}.png`;

			// Convert PNG to WebP using sharp
			const thumbnail = await sharp(tempPng)
				.resize(size, size, {
					fit: "inside",
					withoutEnlargement: true,
				})
				.webp({ quality: 80 })
				.toBuffer();

			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(
				`[thumbnail:pdf] Generated ${thumbnail.length} bytes in ${elapsed}ms`,
			);

			// Clean up temp file
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}

			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:pdf] Failed after ${elapsed}ms: ${error}`);
			// Clean up temp files on error
			try {
				await unlink(`${tempPrefix}.png`);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	/**
	 * Generates a waveform image from an audio file using ffmpeg.
	 * Uses the showwavespic filter to create a visual representation.
	 */
	async generateAudioWaveform(
		audioPath: string,
		outputPath: string,
		width: number,
		height = 100,
	): Promise<Buffer> {
		const tempPng = `${outputPath}.tmp.png`;
		const startTime = performance.now();
		logger.debug(
			`[thumbnail:audio] Starting waveform generation for ${audioPath}`,
		);

		try {
			// Use ffmpeg showwavespic filter to generate waveform image
			// Colors: orange waveform (#f97316) on transparent background
			const result = await Bun.spawn([
				"ffmpeg",
				"-y",
				"-i",
				audioPath,
				"-filter_complex",
				`showwavespic=s=${width}x${height}:colors=#f97316`,
				"-frames:v",
				"1",
				tempPng,
			]).exited;

			if (result !== 0) {
				throw new Error("ffmpeg failed to generate audio waveform");
			}

			// Convert PNG to WebP using sharp
			const waveform = await sharp(tempPng).webp({ quality: 90 }).toBuffer();

			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(
				`[thumbnail:audio] Generated waveform ${waveform.length} bytes in ${elapsed}ms`,
			);

			// Clean up temp file
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}

			return waveform;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:audio] Failed after ${elapsed}ms: ${error}`);
			// Clean up temp file on error
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	/**
	 * Generates a thumbnail for an image, video, PDF, or audio file.
	 * Thumbnails are cached in a .thumbnails directory.
	 * Uses a semaphore to limit concurrent generation (prevents server overload).
	 */
	async generateThumbnail(
		currentPath: string,
		contentType: string,
		storagePath: string,
		key: string,
		size = 300,
	): Promise<{ buffer: Buffer; contentType: string } | null> {
		const isImage = this.IMAGE_TYPES.includes(
			contentType as (typeof this.IMAGE_TYPES)[number],
		);
		const isVideo = this.VIDEO_TYPES.includes(
			contentType as (typeof this.VIDEO_TYPES)[number],
		);
		const isPdf = this.DOCUMENT_TYPES.includes(
			contentType as (typeof this.DOCUMENT_TYPES)[number],
		);
		const isAudio = this.AUDIO_TYPES.includes(
			contentType as (typeof this.AUDIO_TYPES)[number],
		);

		if (!isImage && !isVideo && !isPdf && !isAudio) {
			return null;
		}

		// Cache directory for thumbnails
		const thumbDir = join(storagePath, ".thumbnails");
		const thumbPath = join(thumbDir, `${key}_${size}.webp`);

		// Check if cached thumbnail exists and is newer than source
		if (existsSync(thumbPath)) {
			try {
				const thumbStat = await stat(thumbPath);
				const fileStat = await stat(currentPath);
				if (thumbStat.mtime >= fileStat.mtime) {
					logger.debug(`[thumbnail] Cache hit for ${key}`);
					const cached = await Bun.file(thumbPath).arrayBuffer();
					return { buffer: Buffer.from(cached), contentType: "image/webp" };
				}
				logger.debug(`[thumbnail] Cache stale for ${key}, regenerating`);
			} catch {
				// Cache check failed, regenerate
			}
		}

		// Acquire semaphore slot to limit concurrent generation
		const stats = this.thumbnailSemaphore.stats;
		logger.debug(
			`[thumbnail] Waiting for slot (running: ${stats.running}, queued: ${stats.queued}) for ${key}`,
		);
		await this.thumbnailSemaphore.acquire();

		try {
			// Double-check cache after waiting (another request might have generated it)
			if (existsSync(thumbPath)) {
				try {
					const thumbStat = await stat(thumbPath);
					const fileStat = await stat(currentPath);
					if (thumbStat.mtime >= fileStat.mtime) {
						logger.debug(`[thumbnail] Cache hit after wait for ${key}`);
						const cached = await Bun.file(thumbPath).arrayBuffer();
						return { buffer: Buffer.from(cached), contentType: "image/webp" };
					}
				} catch {
					// Continue with generation
				}
			}

			// Generate thumbnail
			await mkdir(thumbDir, { recursive: true });

			const mediaType = isImage
				? "image"
				: isVideo
					? "video"
					: isAudio
						? "audio"
						: "pdf";
			logger.debug(`[thumbnail] Generating ${mediaType} thumbnail for ${key}`);

			let thumbnail: Buffer;

			if (isImage) {
				thumbnail = await sharp(currentPath)
					.resize(size, size, {
						fit: "inside",
						withoutEnlargement: true,
					})
					.webp({ quality: 80 })
					.toBuffer();
			} else if (isVideo) {
				thumbnail = await this.generateVideoThumbnail(
					currentPath,
					thumbPath,
					size,
				);
			} else if (isAudio) {
				// For audio, generate a wider waveform image
				thumbnail = await this.generateAudioWaveform(
					currentPath,
					thumbPath,
					size,
					100,
				);
			} else {
				// PDF
				thumbnail = await this.generatePdfThumbnail(
					currentPath,
					thumbPath,
					size,
				);
			}

			// Cache the thumbnail
			await Bun.write(thumbPath, thumbnail);
			logger.debug(
				`[thumbnail] Cached ${thumbnail.length} bytes to ${thumbPath}`,
			);

			return { buffer: thumbnail, contentType: "image/webp" };
		} catch (error) {
			logger.error(`[thumbnail] Error generating thumbnail for ${key}:`, error);
			return null;
		} finally {
			this.thumbnailSemaphore.release();
		}
	}
}
