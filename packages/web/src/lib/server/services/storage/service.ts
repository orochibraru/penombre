import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readdir, rmdir, stat, unlink } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { cwd } from "node:process";
import type { Readable } from "node:stream";
import archiver from "archiver";
import type { User } from "better-auth";
import type { BunFile } from "bun";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { dev } from "$app/environment";
import { FileCategoryEnum } from "$lib/file-helpers";
import { Logger } from "$lib/logger";
import { getDb } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import {
	FileOrFolderNotFoundError,
	UnauthorizedError,
} from "$lib/server/errors";
import type {
	DirectoryList,
	FileCategory,
	FileContentType,
	FileMetadata,
	FolderItem,
	NewFile,
	ObjectItem,
	ObjectList,
	UpdateFile,
	UploadResult,
} from "$lib/server/schema";
import { ActivityService } from "$lib/server/services/activity";
import { CacheKeys, CacheManager, type MemoryCache } from "./cache";
import { DEFAULT_STORAGE_PATH, logger } from "./constants";
import fileTypesData from "./file-types.json";

// =========================================================================
// Module-level singletons
// =========================================================================

const cacheManager = new CacheManager();
const proxyLogger = new Logger("FileProxyService");

interface FileTypesMapping {
	contentTypes: Record<string, FileContentType>;
	categories: Record<string, FileCategory>;
}

const fileTypes = fileTypesData as FileTypesMapping;

// =========================================================================
// Thumbnail concurrency control
// =========================================================================

class ThumbnailSemaphore {
	private running = 0;
	private queue: Array<() => void> = [];

	constructor(private maxConcurrent: number) {}

	async acquire(): Promise<void> {
		if (this.running < this.maxConcurrent) {
			this.running++;
			return;
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
		if (next) next();
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

export interface FileProxyRequest {
	itemName: string;
	raw?: boolean;
	thumbnail?: boolean;
	size?: "small" | "medium" | "large";
	ifNoneMatch?: string;
	rangeHeader?: string;
}

/**
 * Unified storage service handling all file, folder, listing, thumbnail,
 * content-type, bulk-download, file-proxy, and admin operations.
 */
export class StorageService {
	private storagePath: string;
	private userFolder: string;
	private user: User;
	private activityService: ActivityService = new ActivityService();
	private cache: MemoryCache;
	private static thumbnailSemaphore = new ThumbnailSemaphore(4);

	constructor(user: User) {
		this.userFolder = `user-${user.id}`;
		this.storagePath = join(DEFAULT_STORAGE_PATH, this.userFolder);
		this.user = user;
		this.cache = cacheManager.getUserCache(user.id);
	}

	// =========================================================================
	// CACHE
	// =========================================================================

	private invalidateListingCaches(): void {
		this.cache.deleteByPrefix("list:");
		this.cache.deleteByPrefix("folders:");
		this.cache.deleteByPrefix("folder-size:");
		this.cache.delete(CacheKeys.starred());
		this.cache.delete(CacheKeys.trashed());
		this.cache.delete(CacheKeys.recent());
		this.cache.delete(CacheKeys.counts());
		this.cache.deleteByPrefix("category:");
	}

	// =========================================================================
	// CONTENT TYPE
	// =========================================================================

	private determineContentType(key: string): FileContentType {
		const extension = key.split(".").pop()?.toLowerCase();
		if (!extension) return "application/octet-stream";
		return fileTypes.contentTypes[extension] || "application/octet-stream";
	}

	private determineCategory(key: string): FileCategory {
		const extension = key.split(".").pop()?.toLowerCase();
		if (!extension) return FileCategoryEnum.UNKNOWN;
		return fileTypes.categories[extension] || FileCategoryEnum.UNKNOWN;
	}

	// =========================================================================
	// UTILITY
	// =========================================================================

	public async ensureUserDirectory(): Promise<void> {
		try {
			if (!existsSync(this.storagePath)) {
				logger.info(
					`Creating user storage folder at path: ${this.storagePath}...`,
				);
				await mkdir(this.storagePath, { recursive: true });
			}
		} catch (error) {
			logger.error("Error creating storage folder:", error);
			throw new Error("Failed to create storage folder");
		}
	}

	public getStoragePath(): string {
		return this.storagePath;
	}

	public getUserFolder(): string {
		return this.userFolder;
	}

	private async resolveFileLocation(key: string): Promise<{
		currentPath: string;
		currentMetaPath: string;
	}> {
		let currentPath = join(this.storagePath, key);
		let currentMetaPath = `${currentPath}.meta.json`;

		if (!(await Bun.file(currentPath).exists())) {
			const parentDir = key.includes("/")
				? key.slice(0, key.lastIndexOf("/"))
				: "";
			const sDir = join(this.storagePath, parentDir);
			const name = key.includes("/")
				? key.slice(key.lastIndexOf("/") + 1)
				: key;

			try {
				const entries = await readdir(sDir, { withFileTypes: true });
				for (const e of entries) {
					if (e.isDirectory()) continue;
					if (e.name.endsWith(".meta.json")) continue;
					const abs = join(sDir, e.name);
					const m = Bun.file(`${abs}.meta.json`);
					if (await m.exists()) {
						const md: FileMetadata = await m.json();
						if (md.name === name) {
							currentPath = abs;
							currentMetaPath = `${abs}.meta.json`;
							return { currentPath, currentMetaPath };
						}
					}
				}
			} catch {
				// Directory doesn't exist or not readable
			}

			if (!(await Bun.file(currentPath).exists())) {
				throw new FileOrFolderNotFoundError("File not found");
			}
		}

		return { currentPath, currentMetaPath };
	}

	private async generateMeta(
		name: string,
		filePath?: string,
	): Promise<FileMetadata> {
		logger.debug(`Generating meta for ${name}`);
		const meta: FileMetadata = {
			id: crypto.randomUUID(),
			name,
			createdAt: new Date().toLocaleString(),
			owner: this.user.id,
			category: this.determineCategory(name),
			contentType: this.determineContentType(name),
			isTrashed: false,
			isStarred: false,
		};
		if (filePath) {
			await Bun.write(`${filePath}.meta.json`, JSON.stringify(meta));
		}
		return meta;
	}

	private getFolderMetaPath(folderPath: string): string {
		return join(folderPath, ".keep.meta.json");
	}

	private async readFolderMeta(
		folderPath: string,
	): Promise<FileMetadata | null> {
		try {
			const metaFile = Bun.file(this.getFolderMetaPath(folderPath));
			if (await metaFile.exists()) {
				return await metaFile.json();
			}
			return null;
		} catch {
			return null;
		}
	}

	private async readFolderMetadataOrGenerate(
		folderPath: string,
	): Promise<FileMetadata> {
		return (
			(await this.readFolderMeta(folderPath)) ??
			(await this.generateMeta(folderPath))
		);
	}

	private async readFileMetadata(
		metaPath: string,
		fileName: string,
	): Promise<FileMetadata> {
		const fileMeta = Bun.file(metaPath);
		if (await fileMeta.exists()) {
			return await fileMeta.json();
		}
		return await this.generateMeta(fileName);
	}

	private generateFileNameWithExtension(displayName: string): string {
		const uuid = crypto.randomUUID();
		const parts = displayName.split(".");
		if (parts.length === 1) return uuid;
		const extension = parts.slice(1).join(".");
		return `${uuid}.${extension}`;
	}

	private extractExtension(filename: string): string {
		const parts = filename.split(".");
		if (parts.length === 1) return "";
		return parts.slice(1).join(".");
	}

	private permissionsCheck(metadata: FileMetadata): void {
		if (metadata.owner !== this.user.id) {
			throw new UnauthorizedError("Unauthorized access to file");
		}
	}

	private async walkFilesRecursively(basePath: string): Promise<string[]> {
		const results: string[] = [];
		const entries = await readdir(basePath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(basePath, entry.name);
			if (entry.isDirectory()) {
				const nested = await this.walkFilesRecursively(fullPath);
				results.push(...nested);
				continue;
			}
			if (entry.name.endsWith(".meta.json")) continue;
			results.push(fullPath);
		}

		return results;
	}

	// =========================================================================
	// FILE OPERATIONS
	// =========================================================================

	public async getFile(path: string): Promise<ObjectItem> {
		const { currentPath: filePath } = await this.resolveFileLocation(path);
		const file = Bun.file(filePath);
		const fileMeta = Bun.file(`${filePath}.meta.json`);

		if (!(await fileMeta.exists())) {
			throw new FileOrFolderNotFoundError(
				`File metadata not found for: ${path}`,
			);
		}

		const metadata = await fileMeta.json();
		this.permissionsCheck(metadata);

		const sanitizedNameWithoutFullPath = filePath.split("/").pop() || filePath;
		return {
			key: sanitizedNameWithoutFullPath,
			size: file.size,
			type: "file",
			updatedAt: new Date(file.lastModified).toLocaleString(),
			metadata,
		};
	}

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

		this.invalidateListingCaches();
	}

	public async updateFile(name: string, data: UpdateFile): Promise<void> {
		const { currentPath, currentMetaPath } =
			await this.resolveFileLocation(name);

		let metadata: FileMetadata;
		const metaFile = Bun.file(currentMetaPath);
		if (await metaFile.exists()) {
			metadata = await metaFile.json();
		} else {
			const baseName = currentPath.split("/").pop() || name;
			metadata = await this.generateMeta(baseName);
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
			metadata.contentType = this.determineContentType(metadata.name);
			metadata.category = this.determineCategory(metadata.name);
		}

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Updated metadata for file: ${name}`,
			level: "info",
		});

		await Bun.write(currentMetaPath, JSON.stringify(metadata));
		this.invalidateListingCaches();
	}

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

		const currentFileName = currentPath.split("/").pop() || fileKey;
		const extension = this.extractExtension(currentFileName);
		const newUUID = crypto.randomUUID();
		const newFileName = extension ? `${newUUID}.${extension}` : newUUID;

		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const destPath = normalizedDest
			? join(this.storagePath, normalizedDest, newFileName)
			: join(this.storagePath, newFileName);
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

		this.invalidateListingCaches();
	}

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
			createdAt: new Date().toLocaleString(),
			isTrashed: false,
			isStarred: false,
		};

		const newFileNameWithExt = this.generateFileNameWithExtension(uniqueName);
		const newFilePath = parentFolder
			? join(this.storagePath, parentFolder, newFileNameWithExt)
			: join(this.storagePath, newFileNameWithExt);
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

		this.invalidateListingCaches();

		const file = Bun.file(newFilePath);
		return {
			key: newFileNameWithExt,
			size: file.size,
			type: "file",
			updatedAt: new Date(file.lastModified).toLocaleString(),
			metadata: newMeta,
		};
	}

	public async createFile(
		file: NewFile,
		folder?: string,
	): Promise<UploadResult> {
		const name = file.name.includes("/")
			? file.name.split("/").pop() || file.name
			: file.name;
		const normalizedFolder = folder
			? folder.endsWith("/")
				? folder.slice(0, -1)
				: folder
			: undefined;
		const uniqueName = await this.getUniqueDisplayName(
			name,
			normalizedFolder,
			"file",
		);

		const fileNameWithExt = this.generateFileNameWithExtension(uniqueName);
		const uuidWithExt = fileNameWithExt;
		const idFilePath = normalizedFolder
			? `${normalizedFolder}/${uuidWithExt}`
			: uuidWithExt;
		const meta = await this.generateMeta(
			uniqueName,
			join(this.storagePath, idFilePath),
		);
		await this.writeFile(idFilePath, new Uint8Array(), undefined, file.size);
		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Created file: ${name}`,
			level: "info",
		});

		this.invalidateListingCaches();

		return {
			id: uuidWithExt,
			finalName: idFilePath,
			metadata: meta,
		};
	}

	public async createBatchFiles(
		files: NewFile[],
		folder?: string,
	): Promise<UploadResult[]> {
		const results: UploadResult[] = [];
		const normalizedFolder = folder
			? folder.endsWith("/")
				? folder.slice(0, -1)
				: folder
			: undefined;

		for (const file of files) {
			const name = file.name.includes("/")
				? file.name.split("/").pop() || file.name
				: file.name;

			const uniqueName = await this.getUniqueDisplayName(
				name,
				normalizedFolder,
				"file",
			);

			const fileNameWithExt = this.generateFileNameWithExtension(uniqueName);
			const uuidWithExt = fileNameWithExt;
			const idFilePath = normalizedFolder
				? `${normalizedFolder}/${uuidWithExt}`
				: uuidWithExt;
			const meta = await this.generateMeta(
				uniqueName,
				join(this.storagePath, idFilePath),
			);
			await this.writeFile(idFilePath, new Uint8Array(), undefined, file.size);

			results.push({
				id: uuidWithExt,
				finalName: idFilePath,
				metadata: meta,
			});
		}

		const fileCount = files.length;
		const folderDisplay = normalizedFolder || "root";
		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Created ${fileCount} file${fileCount === 1 ? "" : "s"} in ${folderDisplay}`,
			level: "info",
		});

		this.invalidateListingCaches();
		return results;
	}

	public async findFileById(id: string): Promise<string | null> {
		try {
			const allFiles = await this.walkFilesRecursively(this.storagePath);
			for (const filePath of allFiles) {
				const metaFile = Bun.file(`${filePath}.meta.json`);
				if (await metaFile.exists()) {
					const metadata: FileMetadata = await metaFile.json();
					if (metadata.id === id) {
						return filePath.slice(this.storagePath.length + 1);
					}
				}
			}
			return null;
		} catch {
			return null;
		}
	}

	public async uploadFileBody(
		id: string,
		body: Blob | Buffer | Uint8Array,
	): Promise<void> {
		const key = await this.findFileById(id);

		if (!key) {
			throw new Error("Failed to find file");
		}

		try {
			await this.writeFile(key, body);
			const file = await this.getFile(key);
			const displayName = file.metadata.name || key;
			const category = this.determineCategory(displayName);
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
			this.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting file:", error);
			throw new Error(`Error deleting file with key: ${key}`);
		}
	}

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

	public async fileExists(key: string): Promise<boolean> {
		try {
			const filePath = join(this.storagePath, key);
			return await Bun.file(filePath).exists();
		} catch {
			return false;
		}
	}

	public async fileExistsById(id: string): Promise<boolean> {
		try {
			const allFiles = await this.walkFilesRecursively(this.storagePath);
			for (const filePath of allFiles) {
				const metaFile = Bun.file(`${filePath}.meta.json`);
				if (await metaFile.exists()) {
					const metadata: FileMetadata = await metaFile.json();
					if (metadata.id === id) return true;
				}
			}
			return false;
		} catch {
			return false;
		}
	}

	public async getRawFileData(
		key: string,
	): Promise<{ file: BunFile; meta: ObjectItem } | null> {
		const { currentPath } = await this.resolveFileLocation(key);
		const file = Bun.file(currentPath);
		const meta = await this.getFile(key);
		return { file, meta };
	}

	public async getThumbnail(
		key: string,
		size = 300,
	): Promise<{ buffer: Buffer; contentType: string } | null> {
		const { currentPath } = await this.resolveFileLocation(key);
		const meta = await this.getFile(key);
		return this.generateThumbnail(
			currentPath,
			meta.metadata.contentType,
			key,
			size,
		);
	}

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
		newHeaders.append("Content-Length", file.size.toString());

		const displayName = object.metadata.name || object.key;
		const encodedName = encodeURIComponent(displayName);
		newHeaders.append(
			"Content-Disposition",
			`inline; filename*=UTF-8''${encodedName}`,
		);

		return newHeaders;
	}

	// =========================================================================
	// FOLDER OPERATIONS
	// =========================================================================

	public async getFolder(folderId: string): Promise<string> {
		const folderPrefix = folderId.endsWith("/") ? folderId : `${folderId}/`;
		const dirPath = join(this.storagePath, folderPrefix);

		if (!existsSync(dirPath)) {
			throw new FileOrFolderNotFoundError(
				`Folder not found: ${folderId}. Folders must be referenced by UUID.`,
			);
		}

		if (!existsSync(this.getFolderMetaPath(dirPath))) {
			logger.warn(
				`Folder ${folderId} exists but has no metadata. This may be a legacy folder.`,
			);
		}

		return folderPrefix;
	}

	public async moveFolder(
		folderKey: string,
		destinationFolder: string,
	): Promise<void> {
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;
		const folderPath = join(this.storagePath, normalizedKey);

		if (!existsSync(folderPath)) {
			throw new FileOrFolderNotFoundError("Folder not found");
		}

		const metadata = await this.readFolderMeta(folderPath);
		if (metadata) {
			this.permissionsCheck(metadata);
		}

		const folderName =
			metadata?.name || normalizedKey.split("/").pop() || normalizedKey;

		const uniqueName = await this.getUniqueDisplayName(
			folderName,
			destinationFolder || undefined,
			"folder",
		);

		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const physicalFolderName = normalizedKey.split("/").pop() || normalizedKey;
		const destPath = normalizedDest
			? join(this.storagePath, normalizedDest, physicalFolderName)
			: join(this.storagePath, physicalFolderName);

		if (destPath.startsWith(folderPath)) {
			throw new Error("Cannot move a folder into itself");
		}

		if (normalizedDest) {
			const destDir = join(this.storagePath, normalizedDest);
			if (!existsSync(destDir)) {
				await mkdir(destDir, { recursive: true });
			}
		}

		await fs.promises.rename(folderPath, destPath);

		if (metadata && uniqueName !== folderName) {
			metadata.name = uniqueName;
			await Bun.write(
				this.getFolderMetaPath(destPath),
				JSON.stringify(metadata),
			);
		}

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved folder "${uniqueName}" to ${normalizedDest || "root"}`,
			level: "info",
		});

		this.invalidateListingCaches();
	}

	public async createFolder(
		name: string,
		parent?: string,
	): Promise<{ id: string; name: string }> {
		logger.info(`Creating folder: name=${name}, parent=${parent}`);

		const normalizedParent = parent
			? parent.endsWith("/")
				? parent.slice(0, -1)
				: parent
			: undefined;

		const uniqueName = await this.getUniqueDisplayName(
			name,
			normalizedParent,
			"folder",
		);

		const folderMeta: FileMetadata = await this.generateMeta(uniqueName);

		const folderKey = normalizedParent
			? `${normalizedParent}/${folderMeta.id}`
			: folderMeta.id;
		const folderPath = join(this.storagePath, folderKey);

		try {
			await mkdir(folderPath);
			await Bun.write(join(folderPath, ".keep"), new Uint8Array());
			await Bun.write(
				this.getFolderMetaPath(folderPath),
				JSON.stringify(folderMeta),
			);
			await this.activityService.register({
				userId: this.user.id,
				action: "create",
				message: `Created folder: ${uniqueName}`,
				level: "info",
			});
			logger.info(
				`Folder created: UUID=${folderMeta.id}, name=${uniqueName}, path=${folderPath}`,
			);

			this.invalidateListingCaches();
			return { id: folderMeta.id, name: uniqueName };
		} catch (error) {
			logger.error("Error creating folder:", error);
			throw new Error("Failed to create folder");
		}
	}

	public async deleteFolder(key: string): Promise<void> {
		try {
			const folderPrefix = key.endsWith("/") ? key : `${key}/`;
			const dirPath = join(this.storagePath, folderPrefix);
			const dir = await readdir(dirPath, { withFileTypes: true });
			if (!dir) {
				throw new Error("Folder not found");
			}

			await rmdir(dirPath, { recursive: true });
			await this.activityService.register({
				userId: this.user.id,
				action: "delete",
				message: `Deleted folder: ${folderPrefix}`,
				level: "info",
			});
			logger.info(`Folder deleted at path: ${dirPath}`);
			this.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting folder:", error);
			throw new Error(`Error deleting folder with key: ${key}`);
		}
	}

	public async trashFolder(key: string): Promise<void> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		if (!existsSync(dirPath)) {
			throw new Error("Folder not found");
		}

		const files = await this.walkFilesRecursively(dirPath);
		for (const abs of files) {
			const relKey = abs.replace(`${this.storagePath}/`, "");
			const metaPath = `${abs}.meta.json`;
			let metadata: FileMetadata = await this.generateMeta(
				relKey.split("/").pop() || relKey,
			);
			const metaFile = Bun.file(metaPath);
			if (await metaFile.exists()) {
				metadata = await metaFile.json();
			}
			metadata.isTrashed = true;
			await this.writeFile(relKey, undefined, metadata);
		}

		await this.updateFolderMeta(folderPrefix, { isTrashed: true });

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved folder to trash: ${folderPrefix}`,
			level: "info",
		});

		this.invalidateListingCaches();
	}

	public async restoreFolder(key: string): Promise<void> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		if (!existsSync(dirPath)) {
			throw new Error("Folder not found");
		}

		const files = await this.walkFilesRecursively(dirPath);
		for (const abs of files) {
			const relKey = abs.replace(`${this.storagePath}/`, "");
			const metaPath = `${abs}.meta.json`;
			const metaFile = Bun.file(metaPath);
			if (await metaFile.exists()) {
				const metadata: FileMetadata = await metaFile.json();
				metadata.isTrashed = false;
				await this.writeFile(relKey, undefined, metadata);
			}
		}

		await this.updateFolderMeta(folderPrefix, { isTrashed: false });

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Restored folder from trash: ${folderPrefix}`,
			level: "info",
		});

		this.invalidateListingCaches();
	}

	public async updateFolderMeta(
		id: string,
		data: {
			isTrashed?: boolean;
			isStarred?: boolean;
			tags?: string[];
			name?: string;
		},
	): Promise<void> {
		const folderPrefix = id.endsWith("/") ? id : `${id}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		if (!existsSync(dirPath)) {
			throw new Error("Folder not found");
		}

		const keepMetaPath = this.getFolderMetaPath(dirPath);
		const metadata =
			(await this.readFolderMeta(dirPath)) ??
			(await this.generateMeta(folderPrefix));

		if (typeof data.isTrashed === "boolean") {
			metadata.isTrashed = data.isTrashed;
		}
		if (typeof data.isStarred === "boolean") {
			metadata.isStarred = data.isStarred;
		}
		if (Array.isArray(data.tags)) {
			metadata.tags = data.tags;
		}
		if (typeof data.name === "string") {
			metadata.name = data.name;
		}

		await Bun.write(keepMetaPath, JSON.stringify(metadata));
		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Updated folder metadata: ${folderPrefix}`,
			level: "info",
		});

		this.invalidateListingCaches();
	}

	public async getFolderMeta(folderId: string): Promise<FileMetadata | null> {
		const folderPrefix = folderId.endsWith("/") ? folderId : `${folderId}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		if (!existsSync(dirPath)) {
			logger.warn(`Folder not found by UUID: ${folderId}`);
			return null;
		}
		const metadata = await this.readFolderMeta(dirPath);
		if (metadata) {
			logger.debug(
				`Retrieved folder metadata: UUID=${folderId}, name=${metadata.name}`,
			);
			return metadata;
		}
		logger.warn(`Folder ${folderId} missing metadata - may be legacy folder`);
		return null;
	}

	public getFullFolderPath(folderId: string, parentId?: string): string {
		const folderPrefix = folderId.endsWith("/") ? folderId : `${folderId}/`;
		if (parentId) {
			const parentPrefix = parentId.endsWith("/") ? parentId : `${parentId}/`;
			return `${parentPrefix}${folderPrefix}`;
		}
		return folderPrefix;
	}

	public async folderExists(key: string): Promise<boolean> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		try {
			const dirPath = join(this.storagePath, folderPrefix);
			return existsSync(dirPath);
		} catch {
			return false;
		}
	}

	public async listFolders(
		prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<DirectoryList> {
		const normalizedPrefix = !prefix || prefix === "/" ? "" : prefix;

		const cacheKey = CacheKeys.folders(
			normalizedPrefix,
			Boolean(options?.onlyTrashed),
		);
		const cached = this.cache.get<DirectoryList>(cacheKey);
		if (cached) return cached;

		const dirPath = join(this.storagePath, normalizedPrefix);
		const dir = await readdir(dirPath, { withFileTypes: true });
		if (!dir) {
			throw new Error("Directory not found");
		}

		const folders: string[] = [];

		for (const dirent of dir) {
			if (!dirent.isDirectory()) continue;
			if (dirent.name === ".trash" || dirent.name === ".thumbnails") continue;

			const folderPath = join(dirPath, dirent.name);
			let isTrashed = false;

			const meta = await this.readFolderMeta(folderPath);
			if (meta) {
				isTrashed = Boolean(meta.isTrashed);
			}

			if (options?.onlyTrashed) {
				if (isTrashed) folders.push(dirent.name);
				continue;
			}
			if (!options?.includeTrashed && isTrashed) continue;
			folders.push(dirent.name);
		}

		this.cache.set(cacheKey, folders);
		return folders;
	}

	public async listFoldersWithMetadata(
		prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<FolderItem[]> {
		const results: FolderItem[] = [];

		const collectFolders = async (currentPrefix: string) => {
			const normalizedPrefix =
				!currentPrefix || currentPrefix === "/" ? "" : currentPrefix;
			const dirPath = join(this.storagePath, normalizedPrefix);

			let dir: { name: string; isDirectory: () => boolean }[];
			try {
				dir = (await readdir(dirPath, {
					withFileTypes: true,
				})) as unknown as typeof dir;
			} catch {
				return;
			}

			for (const dirent of dir) {
				if (!dirent.isDirectory()) continue;
				if (dirent.name === ".trash" || dirent.name === ".thumbnails") continue;

				const folderId = dirent.name;
				const folderPath = join(dirPath, folderId);
				const relativePath = normalizedPrefix
					? `${normalizedPrefix}/${folderId}`
					: folderId;

				const meta = await this.readFolderMeta(folderPath);
				const isTrashed = meta ? Boolean(meta.isTrashed) : false;
				const displayName = meta?.name || folderId;

				if (options?.onlyTrashed && !isTrashed) continue;
				if (!options?.includeTrashed && isTrashed) continue;

				results.push({
					id: folderId,
					name: displayName,
					path: relativePath,
				});

				await collectFolders(relativePath);
			}
		};

		await collectFolders(prefix);
		return results;
	}

	public async calculateFolderSize(folderKey: string): Promise<number> {
		logger.info(`Calculating size for folder: ${folderKey}`);
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;

		const cacheKey = `folder-size:${normalizedKey}`;
		const cached = this.cache.get<number>(cacheKey);
		if (cached !== undefined) return cached;

		const folderPath = join(this.storagePath, normalizedKey);

		logger.debug(`Resolved folder path for size calculation: ${folderPath}`);

		if (!existsSync(folderPath)) {
			logger.debug(`Folder not found for size calculation: ${folderKey}`);
			throw new FileOrFolderNotFoundError("Folder not found");
		}

		let totalSize = 0;

		const walkFolder = async (dirPath: string): Promise<void> => {
			try {
				logger.debug(`Walking folder for size calculation: ${dirPath}`);
				const entries = await readdir(dirPath, { withFileTypes: true });
				logger.debug(`Found ${entries.length} entries in folder: ${dirPath}`);
				for (const entry of entries) {
					if (entry.name.endsWith(".meta.json") || entry.name.startsWith(".")) {
						logger.debug(
							`Skipping entry during size calculation: ${entry.name}`,
						);
						continue;
					}

					const fullPath = join(dirPath, entry.name);
					if (entry.isDirectory()) {
						await walkFolder(fullPath);
					} else {
						const stats = await fs.promises.stat(fullPath);
						totalSize += stats.size;
					}
				}
			} catch (error) {
				logger.warn(`Error reading directory ${dirPath}:`, error);
			}
		};

		logger.debug(`Starting folder size calculation for: ${folderPath}`);
		await walkFolder(folderPath);

		this.cache.set(cacheKey, totalSize, 300);
		logger.info(
			`Calculated size for folder: ${folderKey}, size: ${totalSize} bytes`,
		);
		return totalSize;
	}

	public async calculateFolderSizes(
		prefix: string,
	): Promise<Map<string, number>> {
		const sizes = new Map<string, number>();

		try {
			const folders = await this.listFolders(prefix, {
				includeTrashed: true,
			});

			for (const folderName of folders) {
				const folderKey = prefix ? `${prefix}/${folderName}` : folderName;
				try {
					const size = await this.calculateFolderSize(folderKey);
					sizes.set(folderName, size);
				} catch (error) {
					logger.warn(
						`Failed to calculate size for folder ${folderKey}:`,
						error,
					);
					sizes.set(folderName, 0);
				}
			}
		} catch (error) {
			logger.error(
				`Failed to calculate folder sizes for prefix ${prefix}:`,
				error,
			);
		}

		return sizes;
	}

	// =========================================================================
	// LISTING OPERATIONS
	// =========================================================================

	public async abstractListFiles(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
		recursive?: boolean;
		limit?: number;
		offset?: number;
	}): Promise<ObjectList> {
		const prefix = options.parent || "";
		const cacheKey = CacheKeys.listing(prefix, JSON.stringify(options));

		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const dirPath = join(this.storagePath, prefix);
		if (!existsSync(dirPath)) {
			const empty: ObjectList = { list: [], count: 0, total: 0 };
			this.cache.set(cacheKey, empty);
			return empty;
		}

		const entries = (await readdir(dirPath, { withFileTypes: true })).filter(
			(e) =>
				e.name !== this.userFolder &&
				e.name !== ".keep" &&
				!e.name.endsWith(".meta.json") &&
				!(e.isDirectory() && (e.name === ".trash" || e.name === ".thumbnails")),
		);

		const items: ObjectItem[] = [];

		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name);
			const statResult = await stat(fullPath).catch(() => null);
			if (!statResult) continue;

			const updatedAt = new Date(statResult.mtimeMs).toLocaleString();

			if (entry.isDirectory()) {
				const metadata = await this.readFolderMetadataOrGenerate(fullPath);
				if (!options.includeTrashed && metadata.isTrashed) continue;

				if (options.recursive) {
					const subPath = prefix ? `${prefix}/${entry.name}` : entry.name;
					const subResult = await this.abstractListFiles({
						...options,
						parent: subPath,
					});
					const folderName = metadata.name || entry.name;
					for (const item of subResult.list) {
						if (item.type === "file") {
							items.push({
								...item,
								key: `${entry.name}/${item.key}`,
								parent: item.parent
									? `${folderName}/${item.parent}`
									: folderName,
								parentKey: item.parentKey
									? `${entry.name}/${item.parentKey}`
									: entry.name,
							});
						}
					}
				} else {
					items.push({
						key: `${entry.name}/`,
						size: 0,
						updatedAt,
						metadata,
						type: "folder",
					});
				}
			} else {
				const metadata = await this.readFileMetadata(
					`${fullPath}.meta.json`,
					entry.name,
				);
				try {
					this.permissionsCheck(metadata);
				} catch {
					continue;
				}
				items.push({
					key: entry.name,
					size: statResult.size,
					updatedAt,
					metadata,
					type: "file",
				});
			}
		}

		let filtered = items.filter((item) => {
			if (!options.includeTrashed && item.metadata.isTrashed) return false;
			if (options.category && item.metadata.category !== options.category)
				return false;
			return true;
		});

		const total = filtered.length;
		filtered.sort((a, b) => a.key.localeCompare(b.key));

		const offset = options.offset || 0;
		if (options.limit || offset) {
			filtered = filtered.slice(
				offset,
				options.limit ? offset + options.limit : undefined,
			);
		}

		const result: ObjectList = {
			list: filtered,
			count: filtered.length,
			total,
		};
		this.cache.set(cacheKey, result);
		return result;
	}

	public async listTrashFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.trashed();
		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const files = await this.abstractListFiles({ includeTrashed: true });
		const filtered = files.list.filter((item) => item.metadata.isTrashed);
		const result: ObjectList = {
			list: filtered,
			count: filtered.length,
			total: filtered.length,
		};

		this.cache.set(cacheKey, result);
		return result;
	}

	public async listFilesPerCategory(
		category: FileCategory,
	): Promise<ObjectList> {
		return await this.abstractListFiles({ category, recursive: true });
	}

	public async listFiles(
		prefix?: string,
		options?: { limit?: number; offset?: number },
	): Promise<ObjectList> {
		const normalizedPrefix =
			prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix;
		return await this.abstractListFiles({
			parent: normalizedPrefix,
			...options,
		});
	}

	public async listRecentFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.recent();
		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const allFiles = await this.abstractListFiles({ recursive: true });
		const recentFiles = allFiles.list
			.filter((item) => item.type === "file")
			.sort((a, b) => {
				const aTime = new Date(a.updatedAt || 0).getTime();
				const bTime = new Date(b.updatedAt || 0).getTime();
				return bTime - aTime;
			})
			.slice(0, 25);

		const result: ObjectList = {
			list: recentFiles,
			count: recentFiles.length,
			total: allFiles.total,
		};

		this.cache.set(cacheKey, result);
		return result;
	}

	public async listStarredFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.starred();
		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const allFiles = await this.abstractListFiles({ recursive: true });
		const starredFiles = allFiles.list.filter(
			(item) => item.metadata.isStarred,
		);

		const starredFolders = await this.collectStarredFolders("");

		const combined = [...starredFolders, ...starredFiles];
		combined.sort((a, b) => {
			const aIsFolder = a.type === "folder";
			const bIsFolder = b.type === "folder";
			if (aIsFolder && !bIsFolder) return -1;
			if (!aIsFolder && bIsFolder) return 1;
			return (a.metadata.name || a.key).localeCompare(b.metadata.name || b.key);
		});

		const result: ObjectList = {
			list: combined,
			count: combined.length,
			total: combined.length,
		};

		this.cache.set(cacheKey, result);
		return result;
	}

	private async collectStarredFolders(prefix: string): Promise<ObjectItem[]> {
		const dirPath = join(this.storagePath, prefix);

		let dir: { name: string; isDirectory: () => boolean }[];
		try {
			dir = (await readdir(dirPath, {
				withFileTypes: true,
			})) as unknown as typeof dir;
		} catch {
			return [];
		}

		const validDirs = dir.filter((dirent) => {
			if (!dirent.isDirectory()) return false;
			if (dirent.name === ".trash" || dirent.name === ".thumbnails")
				return false;
			if (dirent.name === this.userFolder) return false;
			return true;
		});

		const folderPromises = validDirs.map(async (dirent) => {
			const folderPath = join(dirPath, dirent.name);
			const relativePath = prefix ? `${prefix}/${dirent.name}` : dirent.name;

			const [statResult, metadata] = await Promise.all([
				stat(folderPath).catch(() => null),
				this.readFolderMetadataOrGenerate(folderPath),
			]);

			const updatedAt = statResult
				? new Date(statResult.mtimeMs).toLocaleString()
				: new Date().toLocaleString();

			if (metadata.isTrashed) return [];

			const results: ObjectItem[] = [];

			if (metadata.isStarred) {
				results.push({
					key: `${relativePath}/`,
					size: 0,
					updatedAt,
					metadata,
					type: "folder",
				});
			}

			const subResults = await this.collectStarredFolders(relativePath);
			return [...results, ...subResults];
		});

		const allResults = await Promise.all(folderPromises);
		return allResults.flat();
	}

	public async searchFiles(query: string, limit = 50): Promise<ObjectList> {
		if (!query || query.trim().length === 0) {
			return { list: [], count: 0, total: 0 };
		}

		const searchTerm = query.toLowerCase().trim();
		const allFiles = await this.abstractListFiles({ recursive: true });

		const matches = allFiles.list.filter((item) => {
			const displayName = (item.metadata.name || item.key).toLowerCase();
			return displayName.includes(searchTerm);
		});

		matches.sort((a, b) => {
			const aName = (a.metadata.name || a.key).toLowerCase();
			const bName = (b.metadata.name || b.key).toLowerCase();

			const aExact = aName === searchTerm;
			const bExact = bName === searchTerm;
			if (aExact && !bExact) return -1;
			if (bExact && !aExact) return 1;

			const aStarts = aName.startsWith(searchTerm);
			const bStarts = bName.startsWith(searchTerm);
			if (aStarts && !bStarts) return -1;
			if (bStarts && !aStarts) return 1;

			const aIsFolder = a.type === "folder" || a.key.endsWith("/");
			const bIsFolder = b.type === "folder" || b.key.endsWith("/");
			if (aIsFolder && !bIsFolder) return -1;
			if (bIsFolder && !aIsFolder) return 1;

			return aName.localeCompare(bName);
		});

		const limited = matches.slice(0, limit);

		return {
			list: limited,
			count: limited.length,
			total: matches.length,
		};
	}

	private async getUniqueDisplayName(
		name: string,
		folder?: string,
		type: "file" | "folder" = "file",
	): Promise<string> {
		const existingItems = await this.abstractListFiles({
			parent: folder,
			includeTrashed: false,
		});

		const existingNames = new Set(
			existingItems.list
				.filter((item) =>
					type === "folder" ? item.type === "folder" : item.type === "file",
				)
				.map((item) => item.metadata.name?.toLowerCase()),
		);

		if (!existingNames.has(name.toLowerCase())) {
			return name;
		}

		let baseName: string;
		let extension: string;
		if (type === "file" && name.includes(".")) {
			const lastDot = name.lastIndexOf(".");
			baseName = name.slice(0, lastDot);
			extension = name.slice(lastDot);
		} else {
			baseName = name;
			extension = "";
		}

		let counter = 1;
		let newName = `${baseName} (${counter})${extension}`;
		while (existingNames.has(newName.toLowerCase())) {
			counter++;
			newName = `${baseName} (${counter})${extension}`;
		}

		return newName;
	}

	// =========================================================================
	// COUNT OPERATIONS
	// =========================================================================

	public async countTrashedItems(): Promise<number> {
		const cacheKey = `${CacheKeys.counts()}:trashed`;
		const cached = this.cache.get<number>(cacheKey);
		if (cached !== undefined) return cached;

		const files = await this.abstractListFiles({ includeTrashed: true });
		const count = files.list.filter((item) => item.metadata.isTrashed).length;
		this.cache.set(cacheKey, count);
		return count;
	}

	public async countStarredItems(): Promise<number> {
		const cacheKey = `${CacheKeys.counts()}:starred`;
		const cached = this.cache.get<number>(cacheKey);
		if (cached !== undefined) return cached;

		const allFiles = await this.abstractListFiles({ recursive: true });
		const count = allFiles.list.filter(
			(item) => item.metadata.isStarred,
		).length;
		this.cache.set(cacheKey, count);
		return count;
	}

	// =========================================================================
	// THUMBNAIL GENERATION
	// =========================================================================

	private async generateVideoThumbnail(
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
				// Ignore cleanup errors
			}

			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:video] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	private async generatePdfThumbnail(
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

			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}

			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:pdf] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(`${tempPrefix}.png`);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	private async generateAudioWaveform(
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

			const waveform = await sharp(tempPng).webp({ quality: 90 }).toBuffer();

			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(
				`[thumbnail:audio] Generated waveform ${waveform.length} bytes in ${elapsed}ms`,
			);

			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}

			return waveform;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:audio] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	private async generateThumbnail(
		currentPath: string,
		contentType: string,
		key: string,
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

		if (!isImage && !isVideo && !isPdf && !isAudio) {
			return null;
		}

		const thumbDir = join(this.storagePath, ".thumbnails");
		const thumbPath = join(thumbDir, `${key}_${size}.webp`);

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

		const stats = StorageService.thumbnailSemaphore.stats;
		logger.debug(
			`[thumbnail] Waiting for slot (running: ${stats.running}, queued: ${stats.queued}) for ${key}`,
		);
		await StorageService.thumbnailSemaphore.acquire();

		try {
			// Double-check cache after waiting
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
				thumbnail = await this.generateAudioWaveform(
					currentPath,
					thumbPath,
					size,
					100,
				);
			} else {
				thumbnail = await this.generatePdfThumbnail(
					currentPath,
					thumbPath,
					size,
				);
			}

			await Bun.write(thumbPath, thumbnail);
			logger.debug(
				`[thumbnail] Cached ${thumbnail.length} bytes to ${thumbPath}`,
			);

			return { buffer: thumbnail, contentType: "image/webp" };
		} catch (error) {
			logger.error(`[thumbnail] Error generating thumbnail for ${key}:`, error);
			return null;
		} finally {
			StorageService.thumbnailSemaphore.release();
		}
	}

	// =========================================================================
	// BULK DOWNLOAD
	// =========================================================================

	private async getFileDisplayName(fullPath: string): Promise<string> {
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

	private async getFolderDisplayName(folderPath: string): Promise<string> {
		try {
			const metaFile = Bun.file(join(folderPath, ".keep.meta.json"));
			if (await metaFile.exists()) {
				const meta: FileMetadata = await metaFile.json();
				return meta.name ?? basename(folderPath);
			}
		} catch {
			// Fallback to basename
		}
		return basename(folderPath);
	}

	private async walkDirectoryWithNames(
		dirPath: string,
		displayPrefix: string,
	): Promise<Array<{ fullPath: string; displayPath: string }>> {
		const results: Array<{ fullPath: string; displayPath: string }> = [];
		const entries = await readdir(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name);

			if (
				entry.name.endsWith(".meta.json") ||
				entry.name === ".keep" ||
				entry.name === ".thumbnails"
			) {
				continue;
			}

			if (entry.isDirectory()) {
				const folderDisplayName = await this.getFolderDisplayName(fullPath);
				const newPrefix = displayPrefix
					? `${displayPrefix}/${folderDisplayName}`
					: folderDisplayName;

				const subEntries = await this.walkDirectoryWithNames(
					fullPath,
					newPrefix,
				);
				results.push(...subEntries);
			} else {
				const displayName = await this.getFileDisplayName(fullPath);
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

	public async createZipFromPaths(
		filePaths: string[],
	): Promise<{ stream: Readable; archive: archiver.Archiver }> {
		const archive = archiver("zip", {
			zlib: { level: 6 },
		});

		const startTime = performance.now();
		logger.debug(
			`[bulk-download] Creating zip with ${filePaths.length} items from ${this.storagePath}`,
		);

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

		for (const filePath of filePaths) {
			const fullPath = join(this.storagePath, filePath);

			if (!existsSync(fullPath)) {
				logger.warn(`[bulk-download] Skipping missing file: ${filePath}`);
				continue;
			}

			const fileStat = await stat(fullPath);

			if (fileStat.isDirectory()) {
				logger.debug(`[bulk-download] Adding directory: ${filePath}`);
				const folderDisplayName = await this.getFolderDisplayName(fullPath);
				const files = await this.walkDirectoryWithNames(fullPath, "");

				for (const file of files) {
					archive.file(file.fullPath, {
						name: `${folderDisplayName}/${file.displayPath}`,
					});
				}
			} else if (!filePath.endsWith(".meta.json")) {
				const displayName = await this.getFileDisplayName(fullPath);
				logger.debug(
					`[bulk-download] Adding file: ${filePath} as ${displayName}`,
				);
				archive.file(fullPath, { name: displayName });
			}
		}

		archive.finalize().then(() => {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[bulk-download] Archive finalized in ${elapsed}ms`);
		});

		return { stream: archive as unknown as Readable, archive };
	}

	public async createZipFromFolder(
		folderPath: string,
	): Promise<{ stream: Readable; archive: archiver.Archiver }> {
		const fullPath = join(this.storagePath, folderPath);

		if (!existsSync(fullPath)) {
			throw new Error(`Folder not found: ${folderPath}`);
		}

		const archive = archiver("zip", {
			zlib: { level: 6 },
		});

		const startTime = performance.now();

		const folderDisplayName =
			(await this.getFolderDisplayName(fullPath)) || "download";

		logger.debug(
			`[bulk-download] Creating zip for folder: ${folderPath} as ${folderDisplayName}`,
		);

		archive.on("error", (err) => {
			logger.error("[bulk-download] Archive error:", err);
			throw err;
		});

		const files = await this.walkDirectoryWithNames(fullPath, "");

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

	public generateZipFilename(_paths: string[]): string {
		return "opendrive-download.zip";
	}

	// =========================================================================
	// FILE PROXY
	// =========================================================================

	private generateETag(data: { size: number; mtime: number }): string {
		const hash = createHash("md5")
			.update(`${data.size}-${data.mtime}`)
			.digest("hex");
		return `"${hash}"`;
	}

	public async handleThumbnailRequest(
		itemName: string,
		size: "small" | "medium" | "large" = "medium",
		ifNoneMatch?: string,
	): Promise<Response | null> {
		proxyLogger.debug(`Fetching thumbnail for: ${itemName}`);

		const thumbSize = size === "small" ? 100 : size === "medium" ? 200 : 300;
		const thumbData = await this.getThumbnail(itemName, thumbSize);

		if (!thumbData) {
			proxyLogger.debug(
				`Thumbnail generation failed, falling back to raw for: ${itemName}`,
			);
			return null;
		}

		const etag = this.generateETag({
			size: thumbData.buffer.length,
			mtime: Date.now(),
		});

		if (ifNoneMatch === etag) {
			return new Response(null, { status: 304 });
		}

		return new Response(new Uint8Array(thumbData.buffer), {
			headers: {
				"Content-Type": thumbData.contentType,
				"Cache-Control": "public, max-age=31536000, immutable",
				"Content-Length": thumbData.buffer.length.toString(),
				ETag: etag,
			},
			status: 200,
		});
	}

	public async handleRawFile(
		itemName: string,
		ifNoneMatch?: string,
		rangeHeader?: string,
	): Promise<Response> {
		proxyLogger.debug(`Fetching raw file data for: ${itemName}`);

		const fileData = await this.getRawFileData(itemName);
		if (!fileData) {
			proxyLogger.debug(`File not found: ${itemName}`);
			throw new FileOrFolderNotFoundError(`File not found: ${itemName}`);
		}

		proxyLogger.debug(`Raw file data retrieved for: ${itemName}`);

		if (fileData.meta.metadata.owner !== this.user.id) {
			proxyLogger.debug(`Unauthorized access attempt by user: ${this.user.id}`);
			throw new Error("Unauthorized");
		}

		const etag = this.generateETag({
			size: fileData.file.size,
			mtime: fileData.file.lastModified,
		});

		if (ifNoneMatch === etag && !dev) {
			proxyLogger.debug("ETag match, returning 304 Not Modified");
			return new Response(null, {
				status: 304,
				headers: {
					ETag: etag,
					"Cache-Control": "public, max-age=3600",
				},
			});
		}

		if (rangeHeader) {
			proxyLogger.debug("Generating range headers for partial content");
			const { chunk, headers: newHeaders } = this.generateRangeHeaders({
				file: fileData.file,
				object: fileData.meta,
				headers: { range: rangeHeader },
			});

			newHeaders.set("ETag", etag);
			proxyLogger.debug("Returning partial content response with status 206");
			return new Response(chunk, {
				status: 206,
				headers: newHeaders,
			});
		}

		proxyLogger.debug("Returning full file response with status 200");
		const newHeaders = this.generateRawFileHeaders({
			file: fileData.file,
			object: fileData.meta,
		});

		newHeaders.set("ETag", etag);

		const buffer = await fileData.file.arrayBuffer();

		return new Response(buffer, {
			headers: newHeaders,
			status: 200,
		});
	}

	public async handleMetadata(itemName: string): Promise<ObjectItem> {
		proxyLogger.debug(`Fetching file metadata for: ${itemName}`);

		const file = await this.getFile(itemName);
		if (!file) {
			proxyLogger.debug(`File not found: ${itemName}`);
			throw new FileOrFolderNotFoundError(`File not found: ${itemName}`);
		}

		if (file.metadata.owner !== this.user.id) {
			proxyLogger.debug(`Unauthorized access attempt by user: ${this.user.id}`);
			throw new Error("Unauthorized");
		}

		return file;
	}

	public async handleProxyRequest(
		req: FileProxyRequest,
	): Promise<Response | ObjectItem> {
		const { itemName, raw, thumbnail, size, ifNoneMatch, rangeHeader } = req;

		if (thumbnail) {
			const thumbResponse = await this.handleThumbnailRequest(
				itemName,
				size,
				ifNoneMatch,
			);
			if (thumbResponse) {
				return thumbResponse;
			}
		}

		if (raw || thumbnail) {
			return this.handleRawFile(itemName, ifNoneMatch, rangeHeader);
		}

		return this.handleMetadata(itemName);
	}

	// =========================================================================
	// ADMIN (static — no user context needed)
	// =========================================================================

	public static getAdminStoragePath(): string {
		return resolve(DEFAULT_STORAGE_PATH);
	}

	public static getAvailableStorageSize(): number {
		const storagePath = StorageService.getAdminStoragePath();

		try {
			// biome-ignore lint/suspicious/noExplicitAny: Avoiding complex types for this
			const anyFs = fs as unknown as { statfsSync?: (path: string) => any };
			if (typeof anyFs.statfsSync === "function") {
				const sfs = anyFs.statfsSync(storagePath);
				const blockSize = Number(sfs?.bsize ?? sfs?.frsize ?? 4096);
				const availBlocks = Number(sfs?.bavail ?? sfs?.bfree ?? 0);
				if (Number.isFinite(blockSize) && Number.isFinite(availBlocks)) {
					return blockSize * availBlocks;
				}
			}
		} catch (err) {
			logger.warn("statfsSync unavailable or failed:", err);
		}

		try {
			const proc = Bun.spawnSync(["df", "-k", storagePath]);
			const output = new TextDecoder().decode(proc.stdout || new Uint8Array());
			const lines = output.trim().split("\n");
			if (lines.length >= 2) {
				if (!lines[0] || !lines[1]) {
					throw new Error("df output parsing error");
				}
				const headers = lines[0].trim().split(/\s+/);
				const values = lines[1].trim().split(/\s+/);
				let availIdx = headers.findIndex((h) => /avail|available/i.test(h));
				if (availIdx === -1) {
					const mountedIdx = headers.findIndex((h) => /mounted/i.test(h));
					if (mountedIdx > 0) {
						availIdx = mountedIdx - 2;
					} else if (values.length >= 4) {
						availIdx = values.length - 2;
					}
				}
				const availStr = values[availIdx];
				const availKiB = availStr ? Number.parseInt(availStr, 10) : Number.NaN;
				if (Number.isFinite(availKiB)) {
					return availKiB * 1024;
				}
			}
			logger.warn("Failed to parse df output:", output);
		} catch (err) {
			logger.warn("df command failed:", err);
		}

		return 0;
	}

	public static async cleanupDeletedUserStorage(): Promise<void> {
		const db = getDb();
		const usersList = await db.select().from(user);
		if (usersList.length === 0) {
			logger.info("No users found in database. Skipping storage cleanup.");
			return;
		}

		const storageBasePath = resolve(
			Bun.env.STORAGE_PATH || join(cwd(), "/data/storage"),
		);
		if (!existsSync(storageBasePath)) {
			logger.info(
				"Storage base path does not exist. Skipping storage cleanup.",
			);
			return;
		}
		const storageDir = await readdir(storageBasePath, { withFileTypes: true });

		const failures: { message: string; error: unknown }[] = [];
		for (const dirent of storageDir) {
			if (dirent.isDirectory() && dirent.name.startsWith("user-")) {
				const userId = dirent.name.replace("user-", "");
				const userExists = usersList.some((u) => u.id === userId);
				if (!userExists) {
					const userStoragePath = join(storageBasePath, dirent.name);
					try {
						await rmdir(userStoragePath, { recursive: true });
						logger.info(
							`Deleted storage for non-existent user ID: ${userId} at path: ${userStoragePath}`,
						);
					} catch (error) {
						failures.push({
							message: `Failed to delete storage for user ID: ${userId} at path: ${userStoragePath}`,
							error,
						});
					}
				}
			}
		}

		if (failures.length > 0) {
			logger.error(
				`Recorded ${failures.length} failures during storage cleanup:`,
			);
			for (const failure of failures) {
				logger.error(failure.message, failure.error);
			}
		}
	}
}
