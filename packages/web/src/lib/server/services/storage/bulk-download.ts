import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import type { Readable } from "node:stream";
import archiver from "archiver";
import type { FileMetadata } from "$lib/server/schema";
import { logger } from "./constants";

/**
 * Gets the display name for a file by reading its metadata.
 * Falls back to the filesystem name if metadata is unavailable.
 */
async function getDisplayName(fullPath: string): Promise<string> {
	const metaPath = `${fullPath}.meta.json`;
	try {
		const metaFile = Bun.file(metaPath);
		if (await metaFile.exists()) {
			const meta: FileMetadata = await metaFile.json();
			return meta.name ?? basename(fullPath);
		}
	} catch {
		// Fallback to basename
	}
	return basename(fullPath);
}

/**
 * Gets the display name for a folder from its .keep.meta.json.
 */
async function getFolderDisplayName(folderPath: string): Promise<string> {
	const keepMetaPath = join(folderPath, ".keep.meta.json");
	try {
		const keepMeta = Bun.file(keepMetaPath);
		if (await keepMeta.exists()) {
			const meta: FileMetadata = await keepMeta.json();
			return meta.name ?? basename(folderPath);
		}
	} catch {
		// Fallback to basename
	}
	return basename(folderPath);
}

/**
 * Recursively walks a directory and returns file paths with their display names.
 * @param dirPath - The current directory being walked
 * @param displayPrefix - The display path prefix (built from parent folder display names)
 */
async function walkDirectoryWithNames(
	dirPath: string,
	displayPrefix: string,
): Promise<Array<{ fullPath: string; displayPath: string }>> {
	const results: Array<{ fullPath: string; displayPath: string }> = [];
	const entries = await readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dirPath, entry.name);

		// Skip metadata files, .keep, and .thumbnails
		if (
			entry.name.endsWith(".meta.json") ||
			entry.name === ".keep" ||
			entry.name === ".thumbnails"
		) {
			continue;
		}

		if (entry.isDirectory()) {
			// Get folder display name
			const folderDisplayName = await getFolderDisplayName(fullPath);
			const newPrefix = displayPrefix
				? `${displayPrefix}/${folderDisplayName}`
				: folderDisplayName;

			// Recurse into subdirectory
			const subEntries = await walkDirectoryWithNames(fullPath, newPrefix);
			results.push(...subEntries);
		} else {
			// Regular file - get display name
			const displayName = await getDisplayName(fullPath);
			results.push({
				fullPath,
				displayPath: displayPrefix
					? `${displayPrefix}/${displayName}`
					: displayName,
			});
		}
	}

	return results;
}

/**
 * Creates a streaming zip archive from multiple file paths.
 * Files are added to the archive as they're read, minimizing memory usage.
 * Uses display names from metadata instead of filesystem UUIDs.
 */
export async function createZipFromPaths(
	storagePath: string,
	filePaths: string[],
): Promise<{ stream: Readable; archive: archiver.Archiver }> {
	const archive = archiver("zip", {
		zlib: { level: 6 }, // Balanced compression
	});

	const startTime = performance.now();
	logger.debug(
		`[bulk-download] Creating zip with ${filePaths.length} items from ${storagePath}`,
	);

	// Track errors
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

	// Add files to archive with display names
	for (const filePath of filePaths) {
		const fullPath = join(storagePath, filePath);

		if (!existsSync(fullPath)) {
			logger.warn(`[bulk-download] Skipping missing file: ${filePath}`);
			continue;
		}

		const fileStat = await stat(fullPath);

		if (fileStat.isDirectory()) {
			// Add directory recursively with display names
			logger.debug(`[bulk-download] Adding directory: ${filePath}`);

			// Get folder display name
			const folderDisplayName = await getFolderDisplayName(fullPath);
			const files = await walkDirectoryWithNames(fullPath, "");

			for (const file of files) {
				archive.file(file.fullPath, {
					name: `${folderDisplayName}/${file.displayPath}`,
				});
			}
		} else if (!filePath.endsWith(".meta.json")) {
			// Add file with display name
			const displayName = await getDisplayName(fullPath);
			logger.debug(
				`[bulk-download] Adding file: ${filePath} as ${displayName}`,
			);
			archive.file(fullPath, { name: displayName });
		}
	}

	// Finalize must be called after adding all files
	// Don't await - let it stream
	archive.finalize().then(() => {
		const elapsed = (performance.now() - startTime).toFixed(0);
		logger.debug(`[bulk-download] Archive finalized in ${elapsed}ms`);
	});

	return { stream: archive as unknown as Readable, archive };
}

/**
 * Creates a streaming zip archive from a folder path.
 * Recursively includes all files and subdirectories with display names.
 */
export async function createZipFromFolder(
	storagePath: string,
	folderPath: string,
): Promise<{ stream: Readable; archive: archiver.Archiver }> {
	const fullPath = join(storagePath, folderPath);

	if (!existsSync(fullPath)) {
		throw new Error(`Folder not found: ${folderPath}`);
	}

	const archive = archiver("zip", {
		zlib: { level: 6 },
	});

	const startTime = performance.now();

	// Get folder display name from metadata
	const folderDisplayName =
		(await getFolderDisplayName(fullPath)) || "download";

	logger.debug(
		`[bulk-download] Creating zip for folder: ${folderPath} as ${folderDisplayName}`,
	);

	archive.on("error", (err) => {
		logger.error("[bulk-download] Archive error:", err);
		throw err;
	});

	// Walk directory and add files with display names
	const files = await walkDirectoryWithNames(fullPath, "");

	for (const file of files) {
		archive.file(file.fullPath, {
			name: `${folderDisplayName}/${file.displayPath}`,
		});
	}

	archive.finalize().then(() => {
		const elapsed = (performance.now() - startTime).toFixed(0);
		logger.debug(`[bulk-download] Folder archive finalized in ${elapsed}ms`);
	});

	return { stream: archive as unknown as Readable, archive };
}

/**
 * Generates a filename for the zip download.
 * Always returns "opendrive-download.zip" for consistency.
 */
export function generateZipFilename(_paths: string[]): string {
	return "opendrive-download.zip";
}
