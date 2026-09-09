import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Readable } from "node:stream";
import type archiver from "archiver";
import type { User } from "better-auth";
import type { CacheBackend } from "$lib/server/cache";
import { isSimpleMode } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
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
import type { StorageContext } from "./context";
import { availableDiskSpace } from "./disk-space";
import type { StorageDriver } from "./driver";
import fileTypesData from "./file-types.json" with { type: "json" };
import { FileOperations } from "./files";
import { FolderOperations } from "./folders";
import { ListingOperations } from "./listings";
import { type FileProxyRequest, ProxyService } from "./proxy";
import { ScanOperations, type ScanResult } from "./scan";
import { ThumbnailService } from "./thumbnails";
import { ZipService } from "./zip";

// =========================================================================
// Module-level singletons
// =========================================================================

const cacheManager = new CacheManager();

interface FileTypesMapping {
	contentTypes: Record<string, FileContentType>;
	categories: Record<string, FileCategory>;
}

const _fileTypes = fileTypesData as FileTypesMapping;

/**
 * Unified storage service handling all file, folder, listing, thumbnail,
 * content-type, bulk-download, file-proxy, and admin operations.
 * Phase 4: all metadata read/write via PostgreSQL; file I/O via StorageDriver.
 */
export type { FileProxyRequest };

export class StorageService {
	/** Local filesystem base used for thumbnail caching (always local). */
	private readonly storagePath: string;
	private readonly userFolder: string;
	private readonly user: User;
	private readonly activityService: ActivityService = new ActivityService();
	private readonly cache: CacheBackend;
	private readonly driver: StorageDriver;
	private readonly db: ReturnType<typeof getDb>;
	private readonly ctx: StorageContext;
	private readonly thumbnails: ThumbnailService;
	private readonly zip: ZipService;
	private readonly proxy: ProxyService;
	private readonly fileOperations: FileOperations;
	private readonly folderOperations: FolderOperations;
	private readonly listingOperations: ListingOperations;
	private readonly scanOperations: ScanOperations;

	constructor(user: User) {
		// Simple mode: one shared volume for everyone, mounted directly at
		// STORAGE_PATH instead of a per-user subfolder.
		this.userFolder = isSimpleMode() ? "" : `user-${user.id}`;
		this.storagePath = join(DEFAULT_STORAGE_PATH, this.userFolder);
		this.user = user;
		this.cache = cacheManager.getUserCache(user.id);
		this.driver = createUserStorageDriver(this.userFolder);
		this.db = getDb();

		this.ctx = {
			user: this.user,
			userFolder: this.userFolder,
			storagePath: this.storagePath,
			db: this.db,
			cache: this.cache,
			driver: this.driver,
			activityService: this.activityService,
			invalidateListingCaches: () => this.invalidateListingCaches(),
		};
		this.thumbnails = new ThumbnailService(this.ctx);
		this.zip = new ZipService(this.ctx);
		this.fileOperations = new FileOperations(this.ctx, this.thumbnails);
		this.folderOperations = new FolderOperations(this.ctx);
		this.listingOperations = new ListingOperations(this.ctx);
		this.scanOperations = new ScanOperations(this.ctx);
		this.proxy = new ProxyService(this.ctx, this.thumbnails, (path) =>
			this.getFile(path),
		);
	}

	// =========================================================================
	// FILES / FOLDERS / LISTINGS
	// =========================================================================

	getFile(path: string): Promise<ObjectItem> {
		return this.fileOperations.getFile(path);
	}

	writeFile(
		path: string,
		contents?: Blob | Buffer | Uint8Array,
		metadata?: FileMetadata,
		size?: number,
	): Promise<void> {
		return this.fileOperations.writeFile(path, contents, metadata, size);
	}

	updateFile(name: string, data: UpdateFile): Promise<void> {
		return this.fileOperations.updateFile(name, data);
	}

	moveFile(fileKey: string, destinationFolder: string): Promise<void> {
		return this.fileOperations.moveFile(fileKey, destinationFolder);
	}

	duplicateFile(fileKey: string): Promise<ObjectItem> {
		return this.fileOperations.duplicateFile(fileKey);
	}

	createFile(file: NewFile, folder?: string): Promise<UploadResult> {
		return this.fileOperations.createFile(file, folder);
	}

	createBatchFiles(
		fileList: NewFile[],
		folder?: string,
	): Promise<UploadResult[]> {
		return this.fileOperations.createBatchFiles(fileList, folder);
	}

	findFileById(id: string): Promise<string | null> {
		return this.fileOperations.findFileById(id);
	}

	uploadFileBody(id: string, body: Blob | Buffer | Uint8Array): Promise<void> {
		return this.fileOperations.uploadFileBody(id, body);
	}

	deleteFile(key: string): Promise<void> {
		return this.fileOperations.deleteFile(key);
	}

	fileExists(key: string): Promise<boolean> {
		return this.fileOperations.fileExists(key);
	}

	fileExistsById(id: string): Promise<boolean> {
		return this.fileOperations.fileExistsById(id);
	}

	getRawFileData(key: string): Promise<{
		buffer: ArrayBuffer;
		meta: ObjectItem;
		size: number;
		mtime: number;
	} | null> {
		return this.fileOperations.getRawFileData(key);
	}

	getFolder(folderId: string): Promise<string> {
		return this.folderOperations.getFolder(folderId);
	}

	moveFolder(folderKey: string, destinationFolder: string): Promise<void> {
		return this.folderOperations.moveFolder(folderKey, destinationFolder);
	}

	createFolder(
		name: string,
		parent?: string,
	): Promise<{ id: string; name: string }> {
		return this.folderOperations.createFolder(name, parent);
	}

	deleteFolder(key: string): Promise<void> {
		return this.folderOperations.deleteFolder(key);
	}

	trashFolder(key: string): Promise<void> {
		return this.folderOperations.trashFolder(key);
	}

	restoreFolder(key: string): Promise<void> {
		return this.folderOperations.restoreFolder(key);
	}

	updateFolderMeta(
		id: string,
		data: {
			isTrashed?: boolean;
			isStarred?: boolean;
			tags?: string[];
			name?: string;
		},
	): Promise<void> {
		return this.folderOperations.updateFolderMeta(id, data);
	}

	getFolderMeta(folderId: string): Promise<FileMetadata | null> {
		return this.folderOperations.getFolderMeta(folderId);
	}

	getFullFolderPath(folderId: string, parentId?: string): string {
		return this.folderOperations.getFullFolderPath(folderId, parentId);
	}

	folderExists(key: string): Promise<boolean> {
		return this.folderOperations.folderExists(key);
	}

	listFolders(
		prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<DirectoryList> {
		return this.folderOperations.listFolders(prefix, options);
	}

	listFoldersWithMetadata(
		_prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<FolderItem[]> {
		return this.folderOperations.listFoldersWithMetadata(_prefix, options);
	}

	calculateFolderSize(folderKey: string): Promise<number> {
		return this.folderOperations.calculateFolderSize(folderKey);
	}

	calculateFolderSizes(prefix: string): Promise<Map<string, number>> {
		return this.folderOperations.calculateFolderSizes(prefix);
	}

	abstractListFiles(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
		recursive?: boolean;
		limit?: number;
		offset?: number;
	}): Promise<ObjectList> {
		return this.listingOperations.abstractListFiles(options);
	}

	listTrashFiles(): Promise<ObjectList> {
		return this.listingOperations.listTrashFiles();
	}

	listFilesPerCategory(category: FileCategory): Promise<ObjectList> {
		return this.listingOperations.listFilesPerCategory(category);
	}

	listFiles(
		prefix?: string,
		options?: { limit?: number; offset?: number },
	): Promise<ObjectList> {
		return this.listingOperations.listFiles(prefix, options);
	}

	listRecentFiles(): Promise<ObjectList> {
		return this.listingOperations.listRecentFiles();
	}

	listStarredFiles(): Promise<ObjectList> {
		return this.listingOperations.listStarredFiles();
	}

	searchFiles(query: string, limit = 50): Promise<ObjectList> {
		return this.listingOperations.searchFiles(query, limit);
	}

	/** Reconcile the DB with the files actually present in the storage backend. */
	scanStorage(): Promise<ScanResult> {
		return this.scanOperations.scan();
	}

	countTrashedItems(): Promise<number> {
		return this.listingOperations.countTrashedItems();
	}

	countStarredItems(): Promise<number> {
		return this.listingOperations.countStarredItems();
	}

	// =========================================================================
	// BULK DOWNLOAD
	// =========================================================================

	public createZipFromPaths(
		filePaths: string[],
	): Promise<{ stream: Readable; archive: archiver.Archiver }> {
		return this.zip.createZipFromPaths(filePaths);
	}

	public createZipFromFolder(
		folderPath: string,
	): Promise<{ stream: Readable; archive: archiver.Archiver }> {
		return this.zip.createZipFromFolder(folderPath);
	}

	public generateZipFilename(paths: string[]): string {
		return this.zip.generateZipFilename(paths);
	}

	// =========================================================================
	// FILE PROXY
	// =========================================================================

	public handleProxyRequest(
		req: FileProxyRequest,
	): Promise<Response | ObjectItem> {
		return this.proxy.handleProxyRequest(req);
	}

	public handleRawFile(
		itemName: string,
		ifNoneMatch?: string,
		rangeHeader?: string,
	): Promise<Response> {
		return this.proxy.handleRawFile(itemName, ifNoneMatch, rangeHeader);
	}

	public handleMetadata(itemName: string): Promise<ObjectItem> {
		return this.proxy.handleMetadata(itemName);
	}

	public handleThumbnailRequest(
		itemName: string,
		size?: "small" | "medium" | "large",
		ifNoneMatch?: string,
	): Promise<Response | null> {
		return this.proxy.handleThumbnailRequest(itemName, size, ifNoneMatch);
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

	// =========================================================================
	// DB → SCHEMA CONVERTERS
	// =========================================================================

	/** Resolve a folder's DB id from its storage path. Returns null for root. */

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

	// =========================================================================
	// FILE OPERATIONS
	// =========================================================================

	// =========================================================================
	// LOCAL/TEMP PATH HELPER
	// =========================================================================

	/**
	 * For tools that need a local filesystem path (ffmpeg, pdftoppm, sharp),
	 * return the actual path for local backends or write a temp file for S3.
	 * Caller is responsible for deleting the temp file when isTemp=true.
	 */

	// =========================================================================
	// FOLDER OPERATIONS
	// =========================================================================

	/** Copy then delete every stored object under `fromPrefix`, re-rooted at `toPrefix` */

	/** Re-root the `path` column of every file and folder under `fromPrefix` */

	// =========================================================================
	// LISTING OPERATIONS
	// =========================================================================

	/** Files and folders whose direct parent is `folderId` (null = drive root) */

	// =========================================================================
	// COUNT OPERATIONS
	// =========================================================================

	// =========================================================================
	// THUMBNAIL GENERATION
	// =========================================================================

	// =========================================================================
	// BULK DOWNLOAD
	// =========================================================================

	/** Stream a stored object into the archive under `name` */

	/** Append every file under `folderPath`, preserving display names in the tree */

	/** Append one user-supplied path, which may name either a file or a folder */

	// =========================================================================
	// FILE PROXY
	// =========================================================================

	// =========================================================================
	// ADMIN (static — no user context needed)
	// =========================================================================

	public static getAdminStoragePath(): string {
		return resolve(DEFAULT_STORAGE_PATH);
	}

	public static getAvailableStorageSize(): number {
		return availableDiskSpace(StorageService.getAdminStoragePath());
	}

	public static async cleanupDeletedUserStorage(): Promise<void> {
		const db = getDb();
		const usersList = await db.select().from(user);
		if (usersList.length === 0) {
			logger.info("No users found in database. Skipping storage cleanup.");
			return;
		}

		const storageBasePath = DEFAULT_STORAGE_PATH;
		if (!existsSync(storageBasePath)) {
			logger.info(
				"Storage base path does not exist. Skipping storage cleanup.",
			);
			return;
		}
		const storageDir = await fs.promises.readdir(storageBasePath, {
			withFileTypes: true,
		});

		const knownUserIds = new Set(usersList.map((u) => u.id));
		const failures: { message: string; error: unknown }[] = [];

		for (const dirent of storageDir) {
			if (!(dirent.isDirectory() && dirent.name.startsWith("user-"))) {
				continue;
			}
			const userId = dirent.name.replace("user-", "");
			if (knownUserIds.has(userId)) {
				continue;
			}

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
