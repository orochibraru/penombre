import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import type { Readable } from "node:stream";
import { Readable as NodeReadable } from "node:stream";
import archiver from "archiver";
import type { User } from "better-auth";
import {
	and,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	like,
	or,
	sql,
} from "drizzle-orm";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { dev } from "$app/environment";
import { FileCategoryEnum } from "$lib/file-helpers";
import { Logger } from "$lib/logger";
import type { CacheBackend } from "$lib/server/cache";
import { getDb } from "$lib/server/db";
import type { File as DbFile, Folder as DbFolder } from "$lib/server/db/schema";
import { files, folders, user } from "$lib/server/db/schema";
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
import { CacheKeys, CacheManager } from "./cache";
import {
	createUserStorageDriver,
	DEFAULT_STORAGE_PATH,
	logger,
} from "./constants";
import type { StorageDriver } from "./driver";
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
 * Phase 4: all metadata read/write via PostgreSQL; file I/O via StorageDriver.
 */
export class StorageService {
	/** Local filesystem base used for thumbnail caching (always local). */
	private storagePath: string;
	private userFolder: string;
	private user: User;
	private activityService: ActivityService = new ActivityService();
	private cache: CacheBackend;
	private driver: StorageDriver;
	private db: ReturnType<typeof getDb>;
	private static thumbnailSemaphore = new ThumbnailSemaphore(4);

	constructor(user: User) {
		this.userFolder = `user-${user.id}`;
		this.storagePath = join(DEFAULT_STORAGE_PATH, this.userFolder);
		this.user = user;
		this.cache = cacheManager.getUserCache(user.id);
		this.driver = createUserStorageDriver(this.userFolder);
		this.db = getDb();
	}

	// =========================================================================
	// CACHE
	// =========================================================================

	private async invalidateListingCaches(): Promise<void> {
		await Promise.all([
			this.cache.deleteByPrefix("list:"),
			this.cache.deleteByPrefix("folders:"),
			this.cache.deleteByPrefix("folder-size:"),
			this.cache.delete(CacheKeys.starred()),
			this.cache.delete(CacheKeys.trashed()),
			this.cache.delete(CacheKeys.recent()),
			this.cache.delete(CacheKeys.counts()),
			this.cache.deleteByPrefix("category:"),
			this.cache.delete(CacheKeys.fileIdIndex()),
		]);
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
	// DB → SCHEMA CONVERTERS
	// =========================================================================

	private fileDbToMetadata(file: DbFile): FileMetadata {
		return {
			id: file.id,
			name: file.name,
			category: file.category as FileCategory,
			contentType: file.contentType as FileContentType,
			tags: file.tags ?? [],
			createdAt: file.createdAt.toISOString(),
			owner: file.ownerId,
			isTrashed: file.isTrashed,
			isStarred: file.isStarred,
			music:
				file.musicDuration != null
					? { duration: file.musicDuration }
					: undefined,
			video:
				file.videoDuration != null
					? { duration: file.videoDuration }
					: undefined,
		};
	}

	private folderDbToMetadata(folder: DbFolder): FileMetadata {
		return {
			id: folder.id,
			name: folder.name,
			category: FileCategoryEnum.UNKNOWN,
			contentType: "application/octet-stream",
			tags: folder.tags ?? [],
			createdAt: folder.createdAt.toISOString(),
			owner: folder.ownerId,
			isTrashed: folder.isTrashed,
			isStarred: folder.isStarred,
		};
	}

	private fileDbToObjectItem(file: DbFile): ObjectItem {
		const pathSegment = file.path.includes("/")
			? (file.path.split("/").pop() ?? file.path)
			: file.path;
		return {
			key: pathSegment,
			size: file.size,
			updatedAt: file.updatedAt.toISOString(),
			metadata: this.fileDbToMetadata(file),
			type: "file",
		};
	}

	private folderDbToObjectItem(folder: DbFolder): ObjectItem {
		const pathSegment = folder.path.includes("/")
			? (folder.path.split("/").pop() ?? folder.path)
			: folder.path;
		return {
			key: `${pathSegment}/`,
			size: 0,
			updatedAt: folder.updatedAt.toISOString(),
			metadata: this.folderDbToMetadata(folder),
			type: "folder",
		};
	}

	/** Resolve a folder's DB id from its storage path. Returns null for root. */
	private async getFolderIdByPath(path: string): Promise<string | null> {
		const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
		if (!normalized) return null;
		const [folder] = await this.db
			.select({ id: folders.id })
			.from(folders)
			.where(
				and(eq(folders.path, normalized), eq(folders.ownerId, this.user.id)),
			);
		return folder?.id ?? null;
	}

	// =========================================================================
	// UTILITY
	// =========================================================================

	public async ensureUserDirectory(): Promise<void> {
		await this.driver.ensureRootExists();
	}

	public getStoragePath(): string {
		return this.storagePath;
	}

	public getUserFolder(): string {
		return this.userFolder;
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

	// =========================================================================
	// FILE OPERATIONS
	// =========================================================================

	public async getFile(path: string): Promise<ObjectItem> {
		const [file] = await this.db
			.select()
			.from(files)
			.where(and(eq(files.path, path), eq(files.ownerId, this.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${path}`);
		}
		return this.fileDbToObjectItem(file);
	}

	public async writeFile(
		path: string,
		contents?: Blob | Buffer | Uint8Array,
		metadata?: FileMetadata,
		size?: number,
	): Promise<void> {
		if (contents) {
			await this.driver.writeObject(path, contents);
		} else if (!(await this.fileExists(path))) {
			await this.driver.writeObject(path, new Uint8Array(size ?? 0));
		}

		if (metadata) {
			await this.db
				.update(files)
				.set({
					name: metadata.name ?? undefined,
					contentType: metadata.contentType,
					category: metadata.category,
					tags: metadata.tags ?? [],
					isTrashed: metadata.isTrashed,
					isStarred: metadata.isStarred,
					musicDuration: metadata.music?.duration ?? null,
					videoDuration: metadata.video?.duration ?? null,
					updatedAt: new Date(),
				})
				.where(and(eq(files.path, path), eq(files.ownerId, this.user.id)));
		}

		await this.invalidateListingCaches();
	}

	public async updateFile(name: string, data: UpdateFile): Promise<void> {
		const [file] = await this.db
			.select()
			.from(files)
			.where(and(eq(files.path, name), eq(files.ownerId, this.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${name}`);
		}

		const updates: Partial<typeof files.$inferInsert> = {
			updatedAt: new Date(),
		};
		if (data.contentType !== undefined) updates.contentType = data.contentType;
		if (data.category !== undefined) updates.category = data.category;
		if (data.tags !== undefined) updates.tags = data.tags;
		if (typeof data.isTrashed === "boolean") updates.isTrashed = data.isTrashed;
		if (typeof data.isStarred === "boolean") updates.isStarred = data.isStarred;
		if (data.key && data.key.trim().length > 0) {
			const newName = data.key.trim();
			updates.name = newName;
			updates.contentType = this.determineContentType(newName);
			updates.category = this.determineCategory(newName);
		}

		await this.db
			.update(files)
			.set(updates)
			.where(and(eq(files.path, name), eq(files.ownerId, this.user.id)));

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Updated metadata for file: ${name}`,
			level: "info",
		});

		await this.invalidateListingCaches();
	}

	public async moveFile(
		fileKey: string,
		destinationFolder: string,
	): Promise<void> {
		const [file] = await this.db
			.select()
			.from(files)
			.where(and(eq(files.path, fileKey), eq(files.ownerId, this.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${fileKey}`);
		}

		const uniqueName = await this.getUniqueDisplayName(
			file.name,
			destinationFolder || undefined,
			"file",
		);

		const currentFileName = fileKey.includes("/")
			? (fileKey.split("/").pop() ?? fileKey)
			: fileKey;
		const extension = this.extractExtension(currentFileName);
		const newUUID = crypto.randomUUID();
		const newFileName = extension ? `${newUUID}.${extension}` : newUUID;

		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const newPath = normalizedDest
			? `${normalizedDest}/${newFileName}`
			: newFileName;

		await this.driver.copyObject(fileKey, newPath);
		await this.driver.deleteObject(fileKey);

		const newFolderId = normalizedDest
			? await this.getFolderIdByPath(normalizedDest)
			: null;

		await this.db
			.update(files)
			.set({
				path: newPath,
				name: uniqueName,
				folderId: newFolderId,
				updatedAt: new Date(),
			})
			.where(and(eq(files.id, file.id), eq(files.ownerId, this.user.id)));

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved file "${uniqueName}" to ${normalizedDest || "root"}`,
			level: "info",
		});

		await this.invalidateListingCaches();
	}

	public async duplicateFile(fileKey: string): Promise<ObjectItem> {
		const [file] = await this.db
			.select()
			.from(files)
			.where(and(eq(files.path, fileKey), eq(files.ownerId, this.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${fileKey}`);
		}

		const parentFolder = fileKey.includes("/")
			? fileKey.slice(0, fileKey.lastIndexOf("/"))
			: undefined;

		const uniqueName = await this.getUniqueDisplayName(
			file.name,
			parentFolder,
			"file",
		);

		const newFileNameWithExt = this.generateFileNameWithExtension(uniqueName);
		const newPath = parentFolder
			? `${parentFolder}/${newFileNameWithExt}`
			: newFileNameWithExt;

		await this.driver.copyObject(fileKey, newPath);

		const newId = crypto.randomUUID();
		const [newFile] = await this.db
			.insert(files)
			.values({
				id: newId,
				name: uniqueName,
				ownerId: this.user.id,
				path: newPath,
				folderId: file.folderId,
				contentType: file.contentType,
				category: file.category,
				size: file.size,
				isTrashed: false,
				isStarred: false,
				tags: [],
				musicDuration: file.musicDuration,
				videoDuration: file.videoDuration,
			})
			.returning();

		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Duplicated file "${file.name}" as "${uniqueName}"`,
			level: "info",
		});

		if (!newFile)
			throw new Error("Failed to insert duplicated file into database");
		await this.invalidateListingCaches();
		return this.fileDbToObjectItem(newFile);
	}

	public async createFile(
		file: NewFile,
		folder?: string,
	): Promise<UploadResult> {
		const name = file.name.includes("/")
			? (file.name.split("/").pop() ?? file.name)
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
		const filePath = normalizedFolder
			? `${normalizedFolder}/${fileNameWithExt}`
			: fileNameWithExt;

		const folderId = normalizedFolder
			? await this.getFolderIdByPath(normalizedFolder)
			: null;

		const id = crypto.randomUUID();
		const [newFile] = await this.db
			.insert(files)
			.values({
				id,
				name: uniqueName,
				ownerId: this.user.id,
				path: filePath,
				folderId,
				contentType: this.determineContentType(uniqueName),
				category: this.determineCategory(uniqueName),
				size: file.size,
				isTrashed: false,
				isStarred: false,
				tags: [],
			})
			.returning();

		await this.driver.writeObject(filePath, new Uint8Array());

		if (!newFile) throw new Error("Failed to insert file into database");
		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Created file: ${name}`,
			level: "info",
		});

		await this.invalidateListingCaches();

		return {
			id: newFile.id,
			finalName: filePath,
			metadata: this.fileDbToMetadata(newFile),
		};
	}

	public async createBatchFiles(
		fileList: NewFile[],
		folder?: string,
	): Promise<UploadResult[]> {
		const results: UploadResult[] = [];
		const normalizedFolder = folder
			? folder.endsWith("/")
				? folder.slice(0, -1)
				: folder
			: undefined;

		const folderId = normalizedFolder
			? await this.getFolderIdByPath(normalizedFolder)
			: null;

		for (const file of fileList) {
			const name = file.name.includes("/")
				? (file.name.split("/").pop() ?? file.name)
				: file.name;
			const uniqueName = await this.getUniqueDisplayName(
				name,
				normalizedFolder,
				"file",
			);
			const fileNameWithExt = this.generateFileNameWithExtension(uniqueName);
			const filePath = normalizedFolder
				? `${normalizedFolder}/${fileNameWithExt}`
				: fileNameWithExt;

			const id = crypto.randomUUID();
			const [newFile] = await this.db
				.insert(files)
				.values({
					id,
					name: uniqueName,
					ownerId: this.user.id,
					path: filePath,
					folderId,
					contentType: this.determineContentType(uniqueName),
					category: this.determineCategory(uniqueName),
					size: file.size,
					isTrashed: false,
					isStarred: false,
					tags: [],
				})
				.returning();

			await this.driver.writeObject(filePath, new Uint8Array());

			if (!newFile) throw new Error("Failed to insert file into database");
			results.push({
				id: newFile.id,
				finalName: filePath,
				metadata: this.fileDbToMetadata(newFile),
			});
		}

		const fileCount = fileList.length;
		const folderDisplay = normalizedFolder || "root";
		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Created ${fileCount} file${fileCount === 1 ? "" : "s"} in ${folderDisplay}`,
			level: "info",
		});

		await this.invalidateListingCaches();
		return results;
	}

	public async findFileById(id: string): Promise<string | null> {
		const [file] = await this.db
			.select({ path: files.path })
			.from(files)
			.where(and(eq(files.id, id), eq(files.ownerId, this.user.id)));
		return file?.path ?? null;
	}

	public async uploadFileBody(
		id: string,
		body: Blob | Buffer | Uint8Array,
	): Promise<void> {
		const [file] = await this.db
			.select()
			.from(files)
			.where(and(eq(files.id, id), eq(files.ownerId, this.user.id)));
		if (!file) {
			throw new Error(`Failed to find file with id: ${id}`);
		}

		const key = file.path;
		try {
			let data: Uint8Array;
			let actualSize: number;
			if (body instanceof Uint8Array) {
				data = body;
				actualSize = body.byteLength;
			} else if (Buffer.isBuffer(body)) {
				data = new Uint8Array(body);
				actualSize = body.length;
			} else {
				const ab = await (body as Blob).arrayBuffer();
				data = new Uint8Array(ab);
				actualSize = ab.byteLength;
			}

			await this.driver.writeObject(key, data);

			const updates: Partial<typeof files.$inferInsert> = {
				size: actualSize,
				updatedAt: new Date(),
			};

			const category = this.determineCategory(file.name);
			const isMedia = category === "MUSIC" || category === "VIDEO";
			if (isMedia) {
				try {
					const { path: localPath, isTemp } =
						await this.getLocalOrTempPath(key);
					const mediaMeta = await parseFile(localPath);
					const duration = mediaMeta.format.duration ?? 0;
					if (category === "MUSIC") {
						updates.musicDuration = duration;
					} else {
						updates.videoDuration = duration;
					}
					if (isTemp) {
						try {
							await unlink(localPath);
						} catch {}
					}
				} catch (metaError) {
					logger.warn(
						`Failed to extract media metadata for ${key}:`,
						metaError,
					);
				}
			}

			await this.db
				.update(files)
				.set(updates)
				.where(and(eq(files.id, id), eq(files.ownerId, this.user.id)));
		} catch (error) {
			logger.error("Error uploading file body:", error);
			await this.activityService.register({
				userId: this.user.id,
				action: "update",
				message: `Failed to upload file body for id: ${id}`,
				level: "error",
			});
			throw new Error(`Error uploading file body for id: ${id}`);
		}
	}

	public async deleteFile(key: string): Promise<void> {
		try {
			const [file] = await this.db
				.select()
				.from(files)
				.where(and(eq(files.path, key), eq(files.ownerId, this.user.id)));

			if (file) {
				await this.db
					.delete(files)
					.where(and(eq(files.id, file.id), eq(files.ownerId, this.user.id)));
				await this.activityService.register({
					userId: this.user.id,
					action: "delete",
					message: `Deleted file: ${key}`,
					level: "info",
				});
			}

			await this.driver.deleteObject(key);
			await this.deleteThumbnails(key);
			await this.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting file:", error);
			throw new Error(`Error deleting file with key: ${key}`);
		}
	}

	private async deleteThumbnails(key: string): Promise<void> {
		try {
			const thumbDir = join(this.storagePath, ".thumbnails");
			if (!existsSync(thumbDir)) return;
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

	public async fileExists(key: string): Promise<boolean> {
		const [file] = await this.db
			.select({ id: files.id })
			.from(files)
			.where(and(eq(files.path, key), eq(files.ownerId, this.user.id)));
		return !!file;
	}

	public async fileExistsById(id: string): Promise<boolean> {
		const [file] = await this.db
			.select({ id: files.id })
			.from(files)
			.where(and(eq(files.id, id), eq(files.ownerId, this.user.id)));
		return !!file;
	}

	public async getRawFileData(key: string): Promise<{
		buffer: ArrayBuffer;
		meta: ObjectItem;
		size: number;
		mtime: number;
	} | null> {
		const [file] = await this.db
			.select()
			.from(files)
			.where(and(eq(files.path, key), eq(files.ownerId, this.user.id)));
		if (!file) return null;
		const buffer = await this.driver.readObject(key);
		return {
			buffer,
			meta: this.fileDbToObjectItem(file),
			size: file.size,
			mtime: file.updatedAt.getTime(),
		};
	}

	public async getThumbnail(
		key: string,
		size = 300,
	): Promise<{ buffer: Buffer; contentType: string } | null> {
		const [file] = await this.db
			.select({ contentType: files.contentType })
			.from(files)
			.where(and(eq(files.path, key), eq(files.ownerId, this.user.id)));
		if (!file) return null;
		return this.generateThumbnail(key, file.contentType, size);
	}

	// =========================================================================
	// LOCAL/TEMP PATH HELPER
	// =========================================================================

	/**
	 * For tools that need a local filesystem path (ffmpeg, pdftoppm, sharp),
	 * return the actual path for local backends or write a temp file for S3.
	 * Caller is responsible for deleting the temp file when isTemp=true.
	 */
	private async getLocalOrTempPath(
		key: string,
	): Promise<{ path: string; isTemp: boolean }> {
		const localPath = join(this.storagePath, key);
		if (existsSync(localPath)) {
			return { path: localPath, isTemp: false };
		}
		const content = await this.driver.readObject(key);
		const tmpPath = join(
			tmpdir(),
			`penombre-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		await Bun.write(tmpPath, content);
		return { path: tmpPath, isTemp: true };
	}

	// =========================================================================
	// FOLDER OPERATIONS
	// =========================================================================

	public async getFolder(folderId: string): Promise<string> {
		const normalizedId = folderId.endsWith("/")
			? folderId.slice(0, -1)
			: folderId;
		const [folder] = await this.db
			.select()
			.from(folders)
			.where(
				and(eq(folders.path, normalizedId), eq(folders.ownerId, this.user.id)),
			);
		if (!folder) {
			throw new FileOrFolderNotFoundError(`Folder not found: ${folderId}`);
		}
		return `${normalizedId}/`;
	}

	public async moveFolder(
		folderKey: string,
		destinationFolder: string,
	): Promise<void> {
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;
		const [folder] = await this.db
			.select()
			.from(folders)
			.where(
				and(eq(folders.path, normalizedKey), eq(folders.ownerId, this.user.id)),
			);
		if (!folder) {
			throw new FileOrFolderNotFoundError("Folder not found");
		}

		const uniqueName = await this.getUniqueDisplayName(
			folder.name,
			destinationFolder || undefined,
			"folder",
		);

		const physicalName = normalizedKey.includes("/")
			? (normalizedKey.split("/").pop() ?? normalizedKey)
			: normalizedKey;
		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const newFolderPath = normalizedDest
			? `${normalizedDest}/${physicalName}`
			: physicalName;

		if (newFolderPath.startsWith(`${normalizedKey}/`)) {
			throw new Error("Cannot move a folder into itself");
		}

		// Move all objects in storage
		const allFileKeys = await this.driver.listObjectKeys(`${normalizedKey}/`);
		for (const oldKey of allFileKeys) {
			const newKey = newFolderPath + oldKey.slice(normalizedKey.length);
			await this.driver.copyObject(oldKey, newKey);
			await this.driver.deleteObject(oldKey);
		}

		// Update all file paths in DB
		const allFilesUnder = await this.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.ownerId, this.user.id),
					like(files.path, `${normalizedKey}/%`),
				),
			);
		for (const f of allFilesUnder) {
			const newPath = newFolderPath + f.path.slice(normalizedKey.length);
			await this.db
				.update(files)
				.set({ path: newPath, updatedAt: new Date() })
				.where(eq(files.id, f.id));
		}

		// Update all subfolder paths in DB
		const allSubFolders = await this.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.ownerId, this.user.id),
					like(folders.path, `${normalizedKey}/%`),
				),
			);
		for (const sf of allSubFolders) {
			const newPath = newFolderPath + sf.path.slice(normalizedKey.length);
			await this.db
				.update(folders)
				.set({ path: newPath, updatedAt: new Date() })
				.where(eq(folders.id, sf.id));
		}

		// Update the root folder itself
		const newParentId = normalizedDest
			? await this.getFolderIdByPath(normalizedDest)
			: null;
		await this.db
			.update(folders)
			.set({
				path: newFolderPath,
				name: uniqueName,
				parentId: newParentId,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, folder.id));

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved folder "${uniqueName}" to ${normalizedDest || "root"}`,
			level: "info",
		});
		await this.invalidateListingCaches();
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

		const folderId = crypto.randomUUID();
		const folderPath = normalizedParent
			? `${normalizedParent}/${folderId}`
			: folderId;

		const parentId = normalizedParent
			? await this.getFolderIdByPath(normalizedParent)
			: null;

		try {
			await this.db.insert(folders).values({
				id: folderId,
				name: uniqueName,
				ownerId: this.user.id,
				path: folderPath,
				parentId,
				isTrashed: false,
				isStarred: false,
				tags: [],
			});
			await this.activityService.register({
				userId: this.user.id,
				action: "create",
				message: `Created folder: ${uniqueName}`,
				level: "info",
			});
			logger.info(
				`Folder created: UUID=${folderId}, name=${uniqueName}, path=${folderPath}`,
			);
			await this.invalidateListingCaches();
			return { id: folderId, name: uniqueName };
		} catch (error) {
			logger.error("Error creating folder:", error);
			throw new Error("Failed to create folder");
		}
	}

	public async deleteFolder(key: string): Promise<void> {
		try {
			const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;

			await this.driver.deleteObjectsByPrefix(`${normalizedKey}/`);

			await this.db
				.delete(files)
				.where(
					and(
						eq(files.ownerId, this.user.id),
						like(files.path, `${normalizedKey}/%`),
					),
				);
			await this.db
				.delete(folders)
				.where(
					and(
						eq(folders.ownerId, this.user.id),
						or(
							eq(folders.path, normalizedKey),
							like(folders.path, `${normalizedKey}/%`),
						),
					),
				);

			await this.activityService.register({
				userId: this.user.id,
				action: "delete",
				message: `Deleted folder: ${normalizedKey}`,
				level: "info",
			});
			logger.info(`Folder deleted: ${normalizedKey}`);
			await this.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting folder:", error);
			throw new Error(`Error deleting folder with key: ${key}`);
		}
	}

	public async trashFolder(key: string): Promise<void> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		const [folder] = await this.db
			.select({ id: folders.id })
			.from(folders)
			.where(
				and(eq(folders.path, normalizedKey), eq(folders.ownerId, this.user.id)),
			);
		if (!folder) {
			throw new Error("Folder not found");
		}

		await this.db
			.update(files)
			.set({ isTrashed: true, updatedAt: new Date() })
			.where(
				and(
					eq(files.ownerId, this.user.id),
					like(files.path, `${normalizedKey}/%`),
				),
			);
		await this.db
			.update(folders)
			.set({ isTrashed: true, updatedAt: new Date() })
			.where(
				and(
					eq(folders.ownerId, this.user.id),
					or(
						eq(folders.path, normalizedKey),
						like(folders.path, `${normalizedKey}/%`),
					),
				),
			);

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved folder to trash: ${normalizedKey}`,
			level: "info",
		});
		await this.invalidateListingCaches();
	}

	public async restoreFolder(key: string): Promise<void> {
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		const [folder] = await this.db
			.select({ id: folders.id })
			.from(folders)
			.where(
				and(eq(folders.path, normalizedKey), eq(folders.ownerId, this.user.id)),
			);
		if (!folder) {
			throw new Error("Folder not found");
		}

		await this.db
			.update(files)
			.set({ isTrashed: false, updatedAt: new Date() })
			.where(
				and(
					eq(files.ownerId, this.user.id),
					like(files.path, `${normalizedKey}/%`),
				),
			);
		await this.db
			.update(folders)
			.set({ isTrashed: false, updatedAt: new Date() })
			.where(
				and(
					eq(folders.ownerId, this.user.id),
					or(
						eq(folders.path, normalizedKey),
						like(folders.path, `${normalizedKey}/%`),
					),
				),
			);

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Restored folder from trash: ${normalizedKey}`,
			level: "info",
		});
		await this.invalidateListingCaches();
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
		const normalizedId = id.endsWith("/") ? id.slice(0, -1) : id;
		const [folder] = await this.db
			.select()
			.from(folders)
			.where(
				and(eq(folders.path, normalizedId), eq(folders.ownerId, this.user.id)),
			);
		if (!folder) {
			throw new Error("Folder not found");
		}

		const updates: Partial<typeof folders.$inferInsert> = {
			updatedAt: new Date(),
		};
		if (typeof data.isTrashed === "boolean") updates.isTrashed = data.isTrashed;
		if (typeof data.isStarred === "boolean") updates.isStarred = data.isStarred;
		if (Array.isArray(data.tags)) updates.tags = data.tags;
		if (typeof data.name === "string") updates.name = data.name;

		await this.db.update(folders).set(updates).where(eq(folders.id, folder.id));

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Updated folder metadata: ${normalizedId}`,
			level: "info",
		});
		await this.invalidateListingCaches();
	}

	public async getFolderMeta(folderId: string): Promise<FileMetadata | null> {
		const normalizedId = folderId.endsWith("/")
			? folderId.slice(0, -1)
			: folderId;
		const [folder] = await this.db
			.select()
			.from(folders)
			.where(
				and(eq(folders.path, normalizedId), eq(folders.ownerId, this.user.id)),
			);
		if (!folder) {
			logger.warn(`Folder not found: ${folderId}`);
			return null;
		}
		return this.folderDbToMetadata(folder);
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
		const normalizedKey = key.endsWith("/") ? key.slice(0, -1) : key;
		const [folder] = await this.db
			.select({ id: folders.id })
			.from(folders)
			.where(
				and(eq(folders.path, normalizedKey), eq(folders.ownerId, this.user.id)),
			);
		return !!folder;
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
		const cached = await this.cache.get<DirectoryList>(cacheKey);
		if (cached) return cached;

		const parentFolderId = normalizedPrefix
			? await this.getFolderIdByPath(normalizedPrefix)
			: null;

		const rows = await this.db
			.select({ id: folders.id, isTrashed: folders.isTrashed })
			.from(folders)
			.where(
				and(
					eq(folders.ownerId, this.user.id),
					options?.onlyTrashed
						? eq(folders.isTrashed, true)
						: parentFolderId
							? eq(folders.parentId, parentFolderId)
							: isNull(folders.parentId),
				),
			);

		const result: string[] = rows
			.filter((r) => {
				if (!options?.includeTrashed && !options?.onlyTrashed)
					return !r.isTrashed;
				return true;
			})
			.map((r) => r.id);

		await this.cache.set(cacheKey, result);
		return result;
	}

	public async listFoldersWithMetadata(
		_prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<FolderItem[]> {
		const allFolders = await this.db
			.select()
			.from(folders)
			.where(eq(folders.ownerId, this.user.id));

		return allFolders
			.filter((f) => {
				if (options?.onlyTrashed) return f.isTrashed;
				if (!options?.includeTrashed) return !f.isTrashed;
				return true;
			})
			.map((f) => ({
				id: f.id,
				name: f.name,
				path: f.path,
			}));
	}

	public async calculateFolderSize(folderKey: string): Promise<number> {
		logger.info(`Calculating size for folder: ${folderKey}`);
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;
		const cacheKey = `folder-size:${normalizedKey}`;
		const cached = await this.cache.get<number>(cacheKey);
		if (cached !== undefined) return cached;

		const [result] = await this.db
			.select({ totalSize: sql<number>`COALESCE(SUM(${files.size}), 0)` })
			.from(files)
			.where(
				and(
					eq(files.ownerId, this.user.id),
					like(files.path, `${normalizedKey}/%`),
				),
			);
		const totalSize = Number(result?.totalSize ?? 0);
		await this.cache.set(cacheKey, totalSize, 300);
		logger.info(
			`Calculated size for folder: ${folderKey}, size: ${totalSize} bytes`,
		);
		return totalSize;
	}

	public async calculateFolderSizes(
		prefix: string,
	): Promise<Map<string, number>> {
		const sizes = new Map<string, number>();
		const folderList = await this.listFolders(prefix, { includeTrashed: true });
		for (const folderId of folderList) {
			const folderPath = prefix ? `${prefix}/${folderId}` : folderId;
			try {
				const size = await this.calculateFolderSize(folderPath);
				sizes.set(folderId, size);
			} catch {
				sizes.set(folderId, 0);
			}
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
		const prefix = options.parent ?? "";
		const cacheKey = CacheKeys.listing(prefix, JSON.stringify(options));
		const cached = await this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		if (options.recursive) {
			const result = await this.listFilesRecursive(options);
			await this.cache.set(cacheKey, result);
			return result;
		}

		const normalizedPrefix = prefix.endsWith("/")
			? prefix.slice(0, -1)
			: prefix;
		const folderId = normalizedPrefix
			? await this.getFolderIdByPath(normalizedPrefix)
			: null;

		// Prefix given but folder not found → return empty
		if (normalizedPrefix && folderId === null) {
			const empty: ObjectList = { list: [], count: 0, total: 0 };
			await this.cache.set(cacheKey, empty);
			return empty;
		}

		const [childFiles, childFolders] = await Promise.all([
			this.db
				.select()
				.from(files)
				.where(
					and(
						eq(files.ownerId, this.user.id),
						folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
						options.includeTrashed ? undefined : eq(files.isTrashed, false),
						options.category ? eq(files.category, options.category) : undefined,
					),
				),
			this.db
				.select()
				.from(folders)
				.where(
					and(
						eq(folders.ownerId, this.user.id),
						folderId
							? eq(folders.parentId, folderId)
							: isNull(folders.parentId),
						options.includeTrashed ? undefined : eq(folders.isTrashed, false),
					),
				),
		]);

		const items: ObjectItem[] = [
			...childFolders.map((f) => this.folderDbToObjectItem(f)),
			...childFiles.map((f) => this.fileDbToObjectItem(f)),
		];

		const total = items.length;
		items.sort((a, b) => a.key.localeCompare(b.key));

		const offset = options.offset ?? 0;
		const paginated =
			options.limit || offset
				? items.slice(
						offset,
						options.limit ? offset + options.limit : undefined,
					)
				: items;

		const result: ObjectList = {
			list: paginated,
			count: paginated.length,
			total,
		};
		await this.cache.set(cacheKey, result);
		return result;
	}

	private async listFilesRecursive(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
	}): Promise<ObjectList> {
		const prefix = options.parent ?? "";
		const normalizedPrefix = prefix.endsWith("/")
			? prefix.slice(0, -1)
			: prefix;

		const allUserFolders = await this.db
			.select()
			.from(folders)
			.where(eq(folders.ownerId, this.user.id));
		const folderById = new Map(allUserFolders.map((f) => [f.id, f]));

		const allFiles = await this.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.ownerId, this.user.id),
					normalizedPrefix
						? like(files.path, `${normalizedPrefix}/%`)
						: undefined,
					options.includeTrashed ? undefined : eq(files.isTrashed, false),
					options.category ? eq(files.category, options.category) : undefined,
				),
			);

		const items: ObjectItem[] = allFiles.map((f) => {
			const item = this.fileDbToObjectItem(f);
			if (f.folderId) {
				const parentFolder = folderById.get(f.folderId);
				if (parentFolder) {
					item.parent = parentFolder.name;
					item.parentKey = parentFolder.path;
				}
			}
			return item;
		});

		return { list: items, count: items.length, total: items.length };
	}

	public async listTrashFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.trashed();
		const cached = await this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const [trashedFiles, trashedFolders] = await Promise.all([
			this.db
				.select()
				.from(files)
				.where(and(eq(files.ownerId, this.user.id), eq(files.isTrashed, true))),
			this.db
				.select()
				.from(folders)
				.where(
					and(eq(folders.ownerId, this.user.id), eq(folders.isTrashed, true)),
				),
		]);

		const list = [
			...trashedFolders.map((f) => this.folderDbToObjectItem(f)),
			...trashedFiles.map((f) => this.fileDbToObjectItem(f)),
		];
		const result: ObjectList = { list, count: list.length, total: list.length };
		await this.cache.set(cacheKey, result);
		return result;
	}

	public async listFilesPerCategory(
		category: FileCategory,
	): Promise<ObjectList> {
		const cacheKey = `category:${category}`;
		const cached = await this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const categoryFiles = await this.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.ownerId, this.user.id),
					eq(files.category, category),
					eq(files.isTrashed, false),
				),
			);
		const list = categoryFiles.map((f) => this.fileDbToObjectItem(f));
		const result: ObjectList = { list, count: list.length, total: list.length };
		await this.cache.set(cacheKey, result);
		return result;
	}

	public async listFiles(
		prefix?: string,
		options?: { limit?: number; offset?: number },
	): Promise<ObjectList> {
		const normalizedPrefix =
			prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix;
		return this.abstractListFiles({ parent: normalizedPrefix, ...options });
	}

	public async listRecentFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.recent();
		const cached = await this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const recentFiles = await this.db
			.select()
			.from(files)
			.where(and(eq(files.ownerId, this.user.id), eq(files.isTrashed, false)))
			.orderBy(desc(files.updatedAt))
			.limit(25);

		const folderIds = [
			...new Set(
				recentFiles
					.filter(
						(f): f is typeof f & { folderId: string } => f.folderId !== null,
					)
					.map((f) => f.folderId),
			),
		];
		const parentFolders =
			folderIds.length > 0
				? await this.db
						.select({
							id: folders.id,
							name: folders.name,
							path: folders.path,
						})
						.from(folders)
						.where(
							and(
								eq(folders.ownerId, this.user.id),
								inArray(folders.id, folderIds),
							),
						)
				: [];
		const folderMap = new Map(parentFolders.map((f) => [f.id, f]));

		const list = recentFiles.map((f) => {
			const item = this.fileDbToObjectItem(f);
			if (f.folderId) {
				const pf = folderMap.get(f.folderId);
				if (pf) {
					item.parent = pf.name;
					item.parentKey = pf.path;
				}
			}
			return item;
		});

		const result: ObjectList = { list, count: list.length, total: list.length };
		await this.cache.set(cacheKey, result);
		return result;
	}

	public async listStarredFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.starred();
		const cached = await this.cache.get<ObjectList>(cacheKey);
		if (cached) return cached;

		const [starredFiles, starredFolders] = await Promise.all([
			this.db
				.select()
				.from(files)
				.where(
					and(
						eq(files.ownerId, this.user.id),
						eq(files.isStarred, true),
						eq(files.isTrashed, false),
					),
				),
			this.db
				.select()
				.from(folders)
				.where(
					and(
						eq(folders.ownerId, this.user.id),
						eq(folders.isStarred, true),
						eq(folders.isTrashed, false),
					),
				),
		]);

		const fileItems = starredFiles.map((f) => this.fileDbToObjectItem(f));
		const folderItems = starredFolders.map((f) => this.folderDbToObjectItem(f));
		const combined = [...folderItems, ...fileItems].sort((a, b) => {
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
		await this.cache.set(cacheKey, result);
		return result;
	}

	public async searchFiles(query: string, limit = 50): Promise<ObjectList> {
		if (!query || query.trim().length === 0) {
			return { list: [], count: 0, total: 0 };
		}
		const searchTerm = query.toLowerCase().trim();

		const [matchedFiles, matchedFolders] = await Promise.all([
			this.db
				.select()
				.from(files)
				.where(
					and(
						eq(files.ownerId, this.user.id),
						ilike(files.name, `%${searchTerm}%`),
					),
				),
			this.db
				.select()
				.from(folders)
				.where(
					and(
						eq(folders.ownerId, this.user.id),
						ilike(folders.name, `%${searchTerm}%`),
					),
				),
		]);

		const allMatches: ObjectItem[] = [
			...matchedFolders.map((f) => this.folderDbToObjectItem(f)),
			...matchedFiles.map((f) => this.fileDbToObjectItem(f)),
		];

		allMatches.sort((a, b) => {
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
			const aIsFolder = a.type === "folder";
			const bIsFolder = b.type === "folder";
			if (aIsFolder && !bIsFolder) return -1;
			if (bIsFolder && !aIsFolder) return 1;
			return aName.localeCompare(bName);
		});

		const limited = allMatches.slice(0, limit);
		return { list: limited, count: limited.length, total: allMatches.length };
	}

	private async getUniqueDisplayName(
		name: string,
		folder?: string,
		type: "file" | "folder" = "file",
	): Promise<string> {
		const folderId = folder ? await this.getFolderIdByPath(folder) : null;

		let existingNames: Set<string>;
		if (type === "folder") {
			const existing = await this.db
				.select({ name: folders.name })
				.from(folders)
				.where(
					and(
						eq(folders.ownerId, this.user.id),
						eq(folders.isTrashed, false),
						folderId
							? eq(folders.parentId, folderId)
							: isNull(folders.parentId),
					),
				);
			existingNames = new Set(existing.map((r) => r.name.toLowerCase()));
		} else {
			const existing = await this.db
				.select({ name: files.name })
				.from(files)
				.where(
					and(
						eq(files.ownerId, this.user.id),
						eq(files.isTrashed, false),
						folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
					),
				);
			existingNames = new Set(existing.map((r) => r.name.toLowerCase()));
		}

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
		const cached = await this.cache.get<number>(cacheKey);
		if (cached !== undefined) return cached;

		const [result] = await this.db
			.select({ count: sql<number>`COUNT(*)` })
			.from(files)
			.where(and(eq(files.ownerId, this.user.id), eq(files.isTrashed, true)));
		const count = Number(result?.count ?? 0);
		await this.cache.set(cacheKey, count);
		return count;
	}

	public async countStarredItems(): Promise<number> {
		const cacheKey = `${CacheKeys.counts()}:starred`;
		const cached = await this.cache.get<number>(cacheKey);
		if (cached !== undefined) return cached;

		const [result] = await this.db
			.select({ count: sql<number>`COUNT(*)` })
			.from(files)
			.where(and(eq(files.ownerId, this.user.id), eq(files.isStarred, true)));
		const count = Number(result?.count ?? 0);
		await this.cache.set(cacheKey, count);
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
			} catch {}
			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:video] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(tempPng);
			} catch {}
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
				.resize(size, size, { fit: "inside", withoutEnlargement: true })
				.webp({ quality: 80 })
				.toBuffer();

			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(
				`[thumbnail:pdf] Generated ${thumbnail.length} bytes in ${elapsed}ms`,
			);
			try {
				await unlink(tempPng);
			} catch {}
			return thumbnail;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:pdf] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(`${tempPrefix}.png`);
			} catch {}
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
			} catch {}
			return waveform;
		} catch (error) {
			const elapsed = (performance.now() - startTime).toFixed(0);
			logger.debug(`[thumbnail:audio] Failed after ${elapsed}ms: ${error}`);
			try {
				await unlink(tempPng);
			} catch {}
			throw error;
		}
	}

	private async generateThumbnail(
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

		if (!isImage && !isVideo && !isPdf && !isAudio) {
			return null;
		}

		const thumbDir = join(this.storagePath, ".thumbnails");
		const safeKey = key.replace(/\//g, "_");
		const thumbPath = join(thumbDir, `${safeKey}_${size}.webp`);

		if (existsSync(thumbPath)) {
			logger.debug(`[thumbnail] Cache hit for ${key}`);
			const cached = await Bun.file(thumbPath).arrayBuffer();
			return { buffer: Buffer.from(cached), contentType: "image/webp" };
		}

		const stats = StorageService.thumbnailSemaphore.stats;
		logger.debug(
			`[thumbnail] Waiting for slot (running: ${stats.running}, queued: ${stats.queued}) for ${key}`,
		);
		await StorageService.thumbnailSemaphore.acquire();

		try {
			// Double-check cache after acquiring slot
			if (existsSync(thumbPath)) {
				logger.debug(`[thumbnail] Cache hit after wait for ${key}`);
				const cached = await Bun.file(thumbPath).arrayBuffer();
				return { buffer: Buffer.from(cached), contentType: "image/webp" };
			}

			await mkdir(thumbDir, { recursive: true });

			const { path: localPath, isTemp } = await this.getLocalOrTempPath(key);
			let thumbnail: Buffer;

			try {
				if (isImage) {
					thumbnail = await sharp(localPath)
						.resize(size, size, { fit: "inside", withoutEnlargement: true })
						.webp({ quality: 80 })
						.toBuffer();
				} else if (isVideo) {
					thumbnail = await this.generateVideoThumbnail(
						localPath,
						thumbPath,
						size,
					);
				} else if (isAudio) {
					thumbnail = await this.generateAudioWaveform(
						localPath,
						thumbPath,
						size,
						100,
					);
				} else {
					thumbnail = await this.generatePdfThumbnail(
						localPath,
						thumbPath,
						size,
					);
				}
			} finally {
				if (isTemp) {
					try {
						await unlink(localPath);
					} catch {}
				}
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

	private buildDisplayPathForFile(opts: {
		filePath: string;
		displayName: string;
		folderBasePath: string;
		folderDisplayName: string;
		folderDisplayMap: Map<string, string>;
	}): string {
		const {
			filePath,
			displayName,
			folderBasePath,
			folderDisplayName,
			folderDisplayMap,
		} = opts;
		const relPath = filePath.slice(folderBasePath.length + 1);
		const parts = relPath.split("/");
		parts.pop(); // remove filename segment

		const displayParts = [folderDisplayName];
		let currentPath = folderBasePath;
		for (const part of parts) {
			currentPath = `${currentPath}/${part}`;
			displayParts.push(folderDisplayMap.get(currentPath) ?? part);
		}
		displayParts.push(displayName);
		return displayParts.join("/");
	}

	public async createZipFromPaths(
		filePaths: string[],
	): Promise<{ stream: Readable; archive: archiver.Archiver }> {
		const archive = archiver("zip", { zlib: { level: 6 } });
		const startTime = performance.now();
		logger.debug(`[bulk-download] Creating zip with ${filePaths.length} items`);

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
			const normalizedPath = filePath.endsWith("/")
				? filePath.slice(0, -1)
				: filePath;

			const [fileRecord] = await this.db
				.select()
				.from(files)
				.where(
					and(eq(files.path, normalizedPath), eq(files.ownerId, this.user.id)),
				);

			if (fileRecord) {
				const stream = await this.driver.getObjectStream(fileRecord.path);
				archive.append(
					NodeReadable.fromWeb(
						stream as unknown as Parameters<typeof NodeReadable.fromWeb>[0],
					),
					{ name: fileRecord.name },
				);
				continue;
			}

			const [folderRecord] = await this.db
				.select()
				.from(folders)
				.where(
					and(
						eq(folders.path, normalizedPath),
						eq(folders.ownerId, this.user.id),
					),
				);

			if (folderRecord) {
				const allSubFolders = await this.db
					.select()
					.from(folders)
					.where(
						and(
							eq(folders.ownerId, this.user.id),
							like(folders.path, `${normalizedPath}/%`),
						),
					);
				const folderDisplayMap = new Map<string, string>([
					[normalizedPath, folderRecord.name],
					...allSubFolders.map((sf): [string, string] => [sf.path, sf.name]),
				]);

				const allFilesUnder = await this.db
					.select()
					.from(files)
					.where(
						and(
							eq(files.ownerId, this.user.id),
							like(files.path, `${normalizedPath}/%`),
						),
					);

				for (const f of allFilesUnder) {
					const displayPath = this.buildDisplayPathForFile({
						filePath: f.path,
						displayName: f.name,
						folderBasePath: normalizedPath,
						folderDisplayName: folderRecord.name,
						folderDisplayMap,
					});
					const stream = await this.driver.getObjectStream(f.path);
					archive.append(
						NodeReadable.fromWeb(
							stream as unknown as Parameters<typeof NodeReadable.fromWeb>[0],
						),
						{ name: displayPath },
					);
				}
			} else {
				logger.warn(`[bulk-download] Skipping unknown path: ${filePath}`);
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
		const normalizedPath = folderPath.endsWith("/")
			? folderPath.slice(0, -1)
			: folderPath;

		const [folderRecord] = await this.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.path, normalizedPath),
					eq(folders.ownerId, this.user.id),
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

		const allSubFolders = await this.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.ownerId, this.user.id),
					like(folders.path, `${normalizedPath}/%`),
				),
			);
		const folderDisplayMap = new Map<string, string>([
			[normalizedPath, folderDisplayName],
			...allSubFolders.map((sf): [string, string] => [sf.path, sf.name]),
		]);

		const allFiles = await this.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.ownerId, this.user.id),
					like(files.path, `${normalizedPath}/%`),
				),
			);

		for (const f of allFiles) {
			const displayPath = this.buildDisplayPathForFile({
				filePath: f.path,
				displayName: f.name,
				folderBasePath: normalizedPath,
				folderDisplayName,
				folderDisplayMap,
			});
			const stream = await this.driver.getObjectStream(f.path);
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

	public generateZipFilename(_paths: string[]): string {
		return "penombre-download.zip";
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

		const [file] = await this.db
			.select()
			.from(files)
			.where(and(eq(files.path, itemName), eq(files.ownerId, this.user.id)));

		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${itemName}`);
		}

		const etag = this.generateETag({
			size: file.size,
			mtime: file.updatedAt.getTime(),
		});

		if (ifNoneMatch === etag && !dev) {
			proxyLogger.debug("ETag match, returning 304 Not Modified");
			return new Response(null, {
				status: 304,
				headers: { ETag: etag, "Cache-Control": "public, max-age=3600" },
			});
		}

		if (rangeHeader) {
			proxyLogger.debug("Generating range headers for partial content");
			const size = file.size;
			const parts = rangeHeader.replace(/bytes=/, "").split("-");
			const start = Number(parts[0]);
			const end = parts[1] ? Number(parts[1]) : size - 1;

			if (Number.isNaN(start)) {
				throw new Error("Invalid range");
			}

			const stream = await this.driver.getObjectStream(itemName, start, end);

			return new Response(stream, {
				status: 206,
				headers: {
					"Content-Type": file.contentType,
					"Content-Range": `bytes ${start}-${end}/${size}`,
					"Content-Length": String(end - start + 1),
					"Accept-Ranges": "bytes",
					ETag: etag,
				},
			});
		}

		proxyLogger.debug("Returning full file response");
		const stream = await this.driver.getObjectStream(itemName);
		const encodedName = encodeURIComponent(file.name);

		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": file.contentType,
				"Accept-Ranges": "bytes",
				"Content-Length": String(file.size),
				"Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
				ETag: etag,
			},
		});
	}

	public async handleMetadata(itemName: string): Promise<ObjectItem> {
		proxyLogger.debug(`Fetching file metadata for: ${itemName}`);
		const file = await this.getFile(itemName);
		if (file.metadata.owner !== this.user.id) {
			proxyLogger.debug(`Unauthorized access attempt by user: ${this.user.id}`);
			throw new UnauthorizedError("Unauthorized");
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
		const storageDir = await fs.promises.readdir(storageBasePath, {
			withFileTypes: true,
		});

		const failures: { message: string; error: unknown }[] = [];
		for (const dirent of storageDir) {
			if (dirent.isDirectory() && dirent.name.startsWith("user-")) {
				const userId = dirent.name.replace("user-", "");
				const userExists = usersList.some((u) => u.id === userId);
				if (!userExists) {
					const userStoragePath = join(storageBasePath, dirent.name);
					try {
						await rm(userStoragePath, { recursive: true });
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
