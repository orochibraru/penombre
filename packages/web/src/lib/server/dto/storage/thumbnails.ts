import { existsSync } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { logger } from "./constants";

export const IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
	"image/tiff",
] as const;

export const VIDEO_TYPES = [
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

/**
 * Generates a thumbnail from a video file using ffmpeg.
 * Extracts a frame at 1 second (or first frame if video is shorter).
 */
export async function generateVideoThumbnail(
	videoPath: string,
	outputPath: string,
	size: number,
): Promise<Buffer> {
	const tempPng = `${outputPath}.tmp.png`;

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

		// Clean up temp file
		try {
			await unlink(tempPng);
		} catch {
			// Ignore cleanup errors
		}

		return thumbnail;
	} catch (error) {
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
 * Generates a thumbnail for an image or video file.
 * Thumbnails are cached in a .thumbnails directory.
 */
export async function generateThumbnail(
	currentPath: string,
	contentType: string,
	storagePath: string,
	key: string,
	size = 300,
): Promise<{ buffer: Buffer; contentType: string } | null> {
	try {
		const isImage = IMAGE_TYPES.includes(
			contentType as (typeof IMAGE_TYPES)[number],
		);
		const isVideo = VIDEO_TYPES.includes(
			contentType as (typeof VIDEO_TYPES)[number],
		);

		if (!isImage && !isVideo) {
			return null;
		}

		// Cache directory for thumbnails
		const thumbDir = join(storagePath, ".thumbnails");
		const thumbPath = join(thumbDir, `${key}_${size}.webp`);

		// Check if cached thumbnail exists and is newer than source
		if (existsSync(thumbPath)) {
			const thumbStat = await stat(thumbPath);
			const fileStat = await stat(currentPath);
			if (thumbStat.mtime >= fileStat.mtime) {
				const cached = await Bun.file(thumbPath).arrayBuffer();
				return { buffer: Buffer.from(cached), contentType: "image/webp" };
			}
		}

		// Generate thumbnail
		await mkdir(thumbDir, { recursive: true });

		let thumbnail: Buffer;

		if (isImage) {
			thumbnail = await sharp(currentPath)
				.resize(size, size, {
					fit: "inside",
					withoutEnlargement: true,
				})
				.webp({ quality: 80 })
				.toBuffer();
		} else {
			thumbnail = await generateVideoThumbnail(currentPath, thumbPath, size);
		}

		// Cache the thumbnail
		await Bun.write(thumbPath, thumbnail);

		return { buffer: thumbnail, contentType: "image/webp" };
	} catch (error) {
		logger.error("Error generating thumbnail:", error);
		return null;
	}
}
