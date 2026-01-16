import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { BunFile } from "bun";
import { parseFile } from "music-metadata";
import { FileOrFolderNotFoundError } from "$lib/server/errors";
import type {
	FileMetadata,
	NewFile,
	ObjectItem,
	UpdateFile,
	UploadResult,
} from "$lib/server/schema";
import { StorageServiceBase } from "./base";
import { logger } from "./constants";
import { determineCategory, determineContentType } from "./content-type";
import { generateThumbnail } from "./thumbnails";

/**
 * File operations for the storage service.
 * Handles all file-specific CRUD operations.
 */
export abstract class FileOperations extends StorageServiceBase {
	/**
	 * Gets a file's metadata and info by key.
	 */
	public async getFile(path: string): Promise<ObjectItem> {
		const { currentPath: filePath } = await this.resolveFileLocation(path);
		const file = Bun.file(filePath);
		const fileMeta = Bun.file(`${filePath}.meta.json`);

		if (!(await fileMeta.exists())) {
			const baseName = filePath.split("/").pop() || filePath;
			const metadata = this.generateMeta(baseName);
			await Bun.write(`${filePath}.meta.json`, JSON.stringify(metadata));
		}

		const metadata = await Bun.file(`${filePath}.meta.json`).json();
		this.permissionsCheck(metadata);

		const sanitizedNameWithoutFullPath = filePath.split("/").pop() || filePath;
		return {
			key: sanitizedNameWithoutFullPath,
			size: file.size,
			type: "file",
			updatedAt: new Date(file.lastModified),
			metadata: metadata,
		};
	}

	/**
	 * Writes a file to storage with optional metadata.
	 */
	public async writeFile(
		path: string,
		contents?: Blob | Buffer | Uint8Array,
		metadata?: FileMetadata,
		size?: number,
	): Promise<void> {
		if (contents) {
			logger.info(`Writing file at path: ${path}`);
			await Bun.write(join(this.storagePath, path), contents);
		} else if (!(await this.fileExists(path))) {
			const file = new Uint8Array(size || 0);
			logger.info(`Creating empty file at path: ${path} with size: ${size}`);
			await Bun.write(join(this.storagePath, path), file);
		}

		if (metadata) {
			await Bun.write(
				join(this.storagePath, `${path}.meta.json`),
				JSON.stringify(metadata),
			);
			await this.activityService.register({
				userId: this.user.id,
				action: "update",
				message: `Updated metadata for file: ${path}`,
				level: "info",
			});
		}

		// Invalidate listing caches after file mutation
		this.invalidateListingCaches();
	}

	/**
	 * Updates a file's metadata.
	 */
	public async updateFile(name: string, data: UpdateFile): Promise<void> {
		const { currentPath, currentMetaPath } =
			await this.resolveFileLocation(name);

		let metadata: FileMetadata;
		const metaFile = Bun.file(currentMetaPath);
		if (await metaFile.exists()) {
			metadata = await metaFile.json();
		} else {
			const baseName = currentPath.split("/").pop() || name;
			metadata = this.generateMeta(baseName);
		}
		this.permissionsCheck(metadata);

		if (data.contentType !== undefined) metadata.contentType = data.contentType;
		if (data.category !== undefined) metadata.category = data.category;
		if (data.tags !== undefined) metadata.tags = data.tags;
		if (typeof data.isTrashed === "boolean")
			metadata.isTrashed = data.isTrashed;
		if (typeof data.isStarred === "boolean")
			metadata.isStarred = data.isStarred;
		if (data.key && data.key.trim().length > 0) {
			metadata.name = data.key.trim();
			metadata.contentType = determineContentType(metadata.name);
			metadata.category = determineCategory(metadata.name);
		}

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Updated metadata for file: ${name}`,
			level: "info",
		});

		await Bun.write(currentMetaPath, JSON.stringify(metadata));

		// Invalidate listing caches after metadata update
		this.invalidateListingCaches();
	}

	/**
	 * Moves a file to a different folder.
	 */
	public async moveFile(
		fileKey: string,
		destinationFolder: string,
	): Promise<void> {
		const { currentPath, currentMetaPath } =
			await this.resolveFileLocation(fileKey);

		const metaFile = Bun.file(currentMetaPath);
		if (!(await metaFile.exists())) {
			throw new FileOrFolderNotFoundError("File metadata not found");
		}
		const metadata: FileMetadata = await metaFile.json();
		this.permissionsCheck(metadata);

		const uniqueName = await this.getUniqueDisplayName(
			metadata.name || fileKey.split("/").pop() || fileKey,
			destinationFolder || undefined,
			"file",
		);

		const fileName = currentPath.split("/").pop() || fileKey;
		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const destPath = normalizedDest
			? join(this.storagePath, normalizedDest, fileName)
			: join(this.storagePath, fileName);
		const destMetaPath = `${destPath}.meta.json`;

		if (normalizedDest) {
			const destDir = join(this.storagePath, normalizedDest);
			if (!existsSync(destDir)) {
				await mkdir(destDir, { recursive: true });
			}
		}

		const fileContent = await Bun.file(currentPath).arrayBuffer();
		await Bun.write(destPath, fileContent);

		metadata.name = uniqueName;
		await Bun.write(destMetaPath, JSON.stringify(metadata));

		await fs.promises.unlink(currentPath);
		await fs.promises.unlink(currentMetaPath);

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved file "${uniqueName}" to ${normalizedDest || "root"}`,
			level: "info",
		});

		// Invalidate listing caches after file move
		this.invalidateListingCaches();
	}

	/**
	 * Duplicates a file with a new UUID and unique display name.
	 */
	public async duplicateFile(fileKey: string): Promise<ObjectItem> {
		const { currentPath, currentMetaPath } =
			await this.resolveFileLocation(fileKey);

		const metaFile = Bun.file(currentMetaPath);
		if (!(await metaFile.exists())) {
			throw new FileOrFolderNotFoundError("File metadata not found");
		}
		const sourceMetadata: FileMetadata = await metaFile.json();
		this.permissionsCheck(sourceMetadata);

		const parentFolder = fileKey.includes("/")
			? fileKey.slice(0, fileKey.lastIndexOf("/"))
			: undefined;

		const sourceName =
			sourceMetadata.name || fileKey.split("/").pop() || fileKey;
		const uniqueName = await this.getUniqueDisplayName(
			sourceName,
			parentFolder,
			"file",
		);

		const newMeta: FileMetadata = {
			...sourceMetadata,
			id: crypto.randomUUID(),
			name: uniqueName,
			createdAt: new Date(),
			isTrashed: false,
			isStarred: false,
		};

		const newFilePath = parentFolder
			? join(this.storagePath, parentFolder, newMeta.id)
			: join(this.storagePath, newMeta.id);
		const newMetaPath = `${newFilePath}.meta.json`;

		const fileContent = await Bun.file(currentPath).arrayBuffer();
		await Bun.write(newFilePath, fileContent);
		await Bun.write(newMetaPath, JSON.stringify(newMeta));

		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Duplicated file "${sourceName}" as "${uniqueName}"`,
			level: "info",
		});

		// Invalidate listing caches after file duplication
		this.invalidateListingCaches();

		const file = Bun.file(newFilePath);
		return {
			key: newMeta.id,
			size: file.size,
			type: "file",
			updatedAt: new Date(file.lastModified),
			metadata: newMeta,
		};
	}

	/**
	 * Creates a new file entry with metadata.
	 */
	public async createFile(
		file: NewFile,
		folder?: string,
	): Promise<UploadResult> {
		const basename = file.name.includes("/")
			? file.name.split("/").pop() || file.name
			: file.name;
		const normalizedFolder = folder
			? folder.endsWith("/")
				? folder.slice(0, -1)
				: folder
			: undefined;
		const uniqueName = await this.getUniqueDisplayName(
			basename,
			normalizedFolder,
			"file",
		);
		const meta = this.generateMeta(uniqueName);
		const idFilePath = normalizedFolder
			? `${normalizedFolder}/${meta.id}`
			: meta.id;
		await this.writeFile(idFilePath, new Uint8Array(), meta, file.size);
		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Created file: ${basename}`,
			level: "info",
		});

		// Invalidate listing caches after file creation
		this.invalidateListingCaches();

		return {
			id: meta.id,
			finalName: idFilePath,
			metadata: meta,
		};
	}

	/**
	 * Uploads the actual file content and extracts media metadata.
	 */
	public async uploadFileBody(
		key: string,
		body: Blob | Buffer | Uint8Array,
	): Promise<void> {
		try {
			await this.writeFile(key, body);
			const file = await this.getFile(key);
			const displayName = file.metadata.name || key;
			const category = determineCategory(displayName);
			const isMedia = category === "MUSIC" || category === "VIDEO";

			if (isMedia) {
				try {
					const mediaMeta = await parseFile(join(this.storagePath, key));
					const duration = mediaMeta.format.duration || 0;

					if (category === "MUSIC") {
						file.metadata.music = file.metadata.music || {};
						file.metadata.music.duration = duration;
					} else if (category === "VIDEO") {
						file.metadata.video = file.metadata.video || {};
						file.metadata.video.duration = duration;
					}

					await this.writeFile(key, undefined, file.metadata);
				} catch (metaError) {
					logger.warn(`Failed to extract metadata for ${key}:`, metaError);
				}
			}
		} catch (error) {
			logger.error("Error uploading file body:", error);
			await this.activityService.register({
				userId: this.user.id,
				action: "update",
				message: `Failed to upload file body for key: ${key}`,
				level: "error",
			});
			throw new Error(`Error uploading file body for key: ${key}`);
		}
	}

	/**
	 * Deletes a file and its metadata.
	 */
	public async deleteFile(key: string): Promise<void> {
		try {
			const { currentPath: filePath } = await this.resolveFileLocation(key);
			const file = Bun.file(filePath);

			const metaPath = `${filePath}.meta.json`;
			const metaFile = Bun.file(metaPath);
			if (await metaFile.exists()) {
				await this.getFile(key);

				await metaFile.delete();
				await this.activityService.register({
					userId: this.user.id,
					action: "delete",
					message: `Deleted file: ${key}`,
					level: "info",
				});
			}

			await file.delete();
			await this.deleteThumbnails(key);

			// Invalidate listing caches after file deletion
			this.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting file:", error);
			throw new Error(`Error deleting file with key: ${key}`);
		}
	}

	/**
	 * Deletes cached thumbnails for a file.
	 */
	private async deleteThumbnails(key: string): Promise<void> {
		try {
			const thumbDir = join(this.storagePath, ".thumbnails");
			if (!existsSync(thumbDir)) return;

			const thumbFiles = await readdir(thumbDir);
			for (const thumbFile of thumbFiles) {
				if (thumbFile.startsWith(`${key}_`)) {
					const thumbPath = join(thumbDir, thumbFile);
					await Bun.file(thumbPath).delete();
				}
			}
		} catch (error) {
			logger.warn("Error deleting thumbnails:", error);
		}
	}

	/**
	 * Gets the raw file data for streaming.
	 */
	public async getRawFileData(
		key: string,
	): Promise<{ file: BunFile; meta: ObjectItem } | null> {
		const { currentPath } = await this.resolveFileLocation(key);
		const file = Bun.file(currentPath);
		const meta = await this.getFile(key);
		return { file, meta };
	}

	/**
	 * Gets a thumbnail for an image or video file.
	 */
	public async getThumbnail(
		key: string,
		size = 300,
	): Promise<{ buffer: Buffer; contentType: string } | null> {
		const { currentPath } = await this.resolveFileLocation(key);
		const meta = await this.getFile(key);
		return generateThumbnail(
			currentPath,
			meta.metadata.contentType,
			this.storagePath,
			key,
			size,
		);
	}

	/**
	 * Generates headers for range requests (partial content).
	 */
	public generateRangeHeaders({
		file,
		object,
		headers,
	}: {
		file: BunFile;
		object: ObjectItem;
		headers: Record<string, string>;
	}): { headers: Headers; chunk: Blob } {
		const range = headers.range || headers.Range;
		if (!range) {
			throw new Error("Range header is required for partial content");
		}
		const size = file.size;
		const parts = range.replace(/bytes=/, "").split("-");
		const start = Number(parts[0]);
		const end = parts[1] ? Number(parts[1]) : undefined;

		if (Number.isNaN(start)) {
			throw new Error("Invalid range");
		}

		const chunkEnd = end || size - 1;
		const chunk = file.slice(start, chunkEnd + 1);

		const newHeaders = new Headers();
		newHeaders.set("Content-Type", object.metadata.contentType);
		newHeaders.set("Content-Range", `bytes ${start}-${chunkEnd}/${size}`);
		newHeaders.set("Content-Length", String(chunkEnd - start + 1));
		newHeaders.set("Accept-Ranges", "bytes");

		return { headers: newHeaders, chunk };
	}

	/**
	 * Generates headers for raw file downloads.
	 */
	public generateRawFileHeaders({
		file,
		object,
	}: {
		file: BunFile;
		object: ObjectItem;
	}): Headers {
		const newHeaders = new Headers();
		newHeaders.append("Content-Type", object.metadata.contentType);
		newHeaders.append("Accept-Ranges", "bytes");
		newHeaders.append("Cache-Control", "public, max-age=31536000, immutable");
		newHeaders.append("Content-Length", file.size.toString());
		return newHeaders;
	}

	/**
	 * Gets a unique display name for a file or folder.
	 * Must be implemented by a subclass that has access to listing operations.
	 */
	protected abstract getUniqueDisplayName(
		name: string,
		folder?: string,
		type?: "file" | "folder",
	): Promise<string>;
}
