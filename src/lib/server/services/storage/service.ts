import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { User } from "better-auth";
import { Logger } from "#lib/logger.js";
import {
	type CacheBackend,
	NullCacheBackend,
} from "#lib/server/cache/index.js";
import {
	getStoragePath,
	isSimpleMode,
	type VolumeConfig,
} from "#lib/server/config.js";
import { encryptionEnabled } from "#lib/server/crypto/keyring.js";
import { getDb } from "#lib/server/db/index.js";
import {
	drives,
	type FolderSettingsData,
	user,
} from "#lib/server/db/schema.js";
import {
	DriveAccessError,
	FileOrFolderNotFoundError,
	ReadOnlyVolumeError,
} from "#lib/server/errors.js";
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
} from "#lib/server/schema.js";
import { ActivityService } from "#lib/server/services/activity.js";
import { CacheKeys, CacheManager } from "./cache";
import type { StorageContext, StorageScope } from "./context";
import { availableDiskSpace } from "./disk-space";
import {
	createUserStorageDriver,
	createVolumeStorageDriver,
	type StorageDriver,
} from "./driver";
import fileTypesData from "./file-types.json" with { type: "json" };
import { FileOperations } from "./files";
import { FolderOperations } from "./folders";
import type { ListingPage, ListingPageOptions, TrashPage } from "./listings";
import { ListingOperations } from "./listings";
import { getUniqueDisplayName } from "./lookups";
import { probeMissingDurations } from "./media";
import { type FileProxyRequest, ProxyService } from "./proxy";
import {
	type CopyResult,
	type DeleteResult,
	reconcileCopy,
	reconcileDelete,
} from "./reconcile";
import { ScanOperations, type ScanReporter, type ScanResult } from "./scan";
import { ThumbnailService } from "./thumbnails";
import {
	type ExportedTree,
	TransferOperations,
	type TransferResult,
} from "./transfer";
import { type EmptyTrashResult, TrashOperations } from "./trash";
import { VersionOperations } from "./version-ops";
import {
	adminVersioning,
	type FolderVersioning,
	folderVersioning,
	latestSeqs,
	setFolderSettings,
	type Versioning,
} from "./versions";
import { ZipService } from "./zip";

const logger = new Logger("StorageService");

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
	private readonly volume: VolumeConfig | null;
	private readonly user: User;
	private readonly activityService: ActivityService = new ActivityService();
	private readonly cache: CacheBackend;
	/** The owner's listing cache, which a scoped service clears but never reads. */
	private readonly listingCache: CacheBackend;
	private readonly driver: StorageDriver;
	private readonly db: ReturnType<typeof getDb>;
	private readonly ctx: StorageContext;
	private readonly thumbnails: ThumbnailService;
	private readonly zip: ZipService;
	private readonly proxy: ProxyService;
	private readonly fileOperations: FileOperations;
	private readonly versionOperations: VersionOperations;
	private readonly folderOperations: FolderOperations;
	private readonly listingOperations: ListingOperations;
	private readonly scanOperations: ScanOperations;
	private readonly trashOperations: TrashOperations;
	private readonly transferOperations: TransferOperations;

	/**
	 * @param user   Whose drive this service reads and writes.
	 * @param volume A mounted volume to bind to, or omitted for the main drive.
	 * @param actor  Who is asking, when that is not the owner — a member of a
	 *               shared drive. Only authorship (activity rows) reads it.
	 * @param options `scope` narrows the tree to what a share recipient may
	 *               reach; `readOnly` refuses writes regardless of the volume.
	 */
	constructor(
		user: User,
		volume?: VolumeConfig,
		actor?: User,
		options: { scope?: StorageScope; readOnly?: boolean } = {},
	) {
		// A volume — a mounted directory or a shared drive — is one tree for
		// everyone, rooted at the mount itself. Only the main drive is split
		// per user, and only in full mode.
		const namedPaths = !!volume || isSimpleMode();
		this.userFolder = namedPaths ? "" : `user-${user.id}`;
		this.volume = volume ?? null;
		this.storagePath = join(
			volume ? volume.path : getStoragePath(),
			this.userFolder,
		);
		this.user = user;
		// Cached listings are keyed per user *and* per volume, or switching
		// volumes would serve the previous one's directory listing.
		this.listingCache = cacheManager.getUserCache(
			volume ? `${user.id}:${volume.name}` : user.id,
		);
		// A scoped listing must never be served to the owner, nor theirs to it.
		this.cache = options.scope ? new NullCacheBackend() : this.listingCache;
		const encrypted = volume ? volume.encrypt === true : encryptionEnabled();
		this.driver = volume
			? createVolumeStorageDriver(volume.path, this.userFolder, encrypted)
			: createUserStorageDriver(this.userFolder, encrypted);
		this.db = getDb();

		this.ctx = {
			user: this.user,
			actor: actor ?? this.user,
			userFolder: this.userFolder,
			namedPaths,
			volumeId: this.volume?.name ?? null,
			scope: options.scope,
			readOnly: (this.volume?.readOnly ?? false) || options.readOnly === true,
			encrypted,
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
		this.versionOperations = new VersionOperations(this.ctx, this.thumbnails);
		this.folderOperations = new FolderOperations(this.ctx, this.thumbnails);
		this.listingOperations = new ListingOperations(this.ctx);
		this.scanOperations = new ScanOperations(this.ctx, this.thumbnails);
		this.trashOperations = new TrashOperations(this.ctx, this.thumbnails);
		this.transferOperations = new TransferOperations(
			this.ctx,
			this.fileOperations,
			this.folderOperations,
			this.thumbnails,
		);
		this.proxy = new ProxyService(this.ctx, this.thumbnails, (path) =>
			this.getFile(path),
		);
	}

	/**
	 * Guard for every mutating call.
	 *
	 * A read-only volume is browsable and downloadable but must reject writes;
	 * throwing here rather than at each route means a new endpoint cannot
	 * forget the check.
	 */
	private assertWritable(): void {
		if (this.ctx.readOnly) {
			throw new ReadOnlyVolumeError(
				`Volume "${this.volume?.name}" is mounted read-only`,
			);
		}
	}

	/** Whether writes are refused, so a caller can check before a two-sided move. */
	get readOnly(): boolean {
		return this.ctx.readOnly;
	}

	/**
	 * Guard for a write that names a place in the tree. A scope's queries
	 * already hide everything outside it, but a create or a move *into* a
	 * path does not read a row there first. `strict` refuses the scope's own
	 * root too: a recipient may work inside a shared folder, not move or
	 * delete the folder itself.
	 */
	private assertInScope(path: string | undefined, strict = false): void {
		const scope = this.ctx.scope;
		if (!scope) {
			return;
		}
		const normalized = (path ?? "").replace(/\/$/, "");
		const inside =
			scope.kind === "folder" &&
			((!strict && normalized === scope.path) ||
				normalized.startsWith(`${scope.path}/`));
		if (!inside) {
			throw new DriveAccessError(403, "Outside what was shared");
		}
	}

	/** Bytes are written by key, so a scoped write must find its row first. */
	private async assertFileInScope(key: string): Promise<void> {
		if (this.ctx.scope && !(await this.fileExists(key))) {
			throw new FileOrFolderNotFoundError(`File not found: ${key}`);
		}
	}

	/** Two services acting on the same tree answer the same key. */
	get locationKey(): string {
		return `${this.user.id}:${this.ctx.volumeId ?? ""}`;
	}

	// =========================================================================
	// TRANSFER
	// =========================================================================

	exportTree(key: string, type: "file" | "folder"): Promise<ExportedTree> {
		return this.transferOperations.exportTree(key, type);
	}

	/** Copy an exported tree from `source` into `destination` here. */
	importTree(
		tree: ExportedTree,
		destination: string,
		source: StorageService,
	): Promise<TransferResult> {
		this.assertWritable();
		this.assertInScope(destination);
		return this.transferOperations.importTree(
			tree,
			destination,
			source.getStoragePath(),
		);
	}

	private static parentOf(key: string): string {
		return key.includes("/") ? key.slice(0, key.lastIndexOf("/")) : "";
	}

	// =========================================================================
	// FILES / FOLDERS / LISTINGS
	// =========================================================================

	getFile(path: string): Promise<ObjectItem> {
		return this.fileOperations.getFile(path);
	}

	async writeFile(
		path: string,
		contents?: Blob | Buffer | Uint8Array,
		metadata?: FileMetadata,
		size?: number,
	): Promise<void> {
		this.assertWritable();
		await this.assertFileInScope(path);
		return await this.fileOperations.writeFile(path, contents, metadata, size);
	}

	updateFile(name: string, data: UpdateFile): Promise<void> {
		this.assertWritable();
		return this.fileOperations.updateFile(name, data);
	}

	moveFile(fileKey: string, destinationFolder: string): Promise<void> {
		this.assertWritable();
		this.assertInScope(destinationFolder);
		return this.fileOperations.moveFile(fileKey, destinationFolder);
	}

	duplicateFile(fileKey: string): Promise<ObjectItem> {
		this.assertWritable();
		this.assertInScope(StorageService.parentOf(fileKey));
		return this.fileOperations.duplicateFile(fileKey);
	}

	createFile(file: NewFile, folder?: string): Promise<UploadResult> {
		this.assertWritable();
		this.assertInScope(folder);
		return this.fileOperations.createFile(file, folder);
	}

	createBatchFiles(
		fileList: NewFile[],
		folder?: string,
		mode?: "create" | "upload",
	): Promise<UploadResult[]> {
		this.assertWritable();
		this.assertInScope(folder);
		return this.fileOperations.createBatchFiles(fileList, folder, mode);
	}

	findFileById(id: string): Promise<string | null> {
		return this.fileOperations.findFileById(id);
	}

	findFileOwner(id: string): Promise<{
		ownerId: string;
		name: string;
		volumeId: string | null;
	} | null> {
		return this.fileOperations.findFileOwner(id);
	}

	uploadFileBody(
		id: string,
		body: Blob | Buffer | Uint8Array,
		options?: { snapshot?: boolean; modifiedAt?: Date },
	): Promise<void> {
		this.assertWritable();
		return this.fileOperations.uploadFileBody(id, body, options);
	}

	// =========================================================================
	// VERSIONS
	// =========================================================================

	listFileVersions(id: string) {
		return this.versionOperations.listFileVersions(id);
	}

	openVersion(id: string, versionId: string) {
		return this.versionOperations.openVersion(id, versionId);
	}

	versionThumbnail(
		id: string,
		versionId: string,
		size: number,
		ifNoneMatch?: string,
	) {
		return this.versionOperations.versionThumbnail(
			id,
			versionId,
			size,
			ifNoneMatch,
		);
	}

	snapshotFile(id: string) {
		this.assertWritable();
		return this.versionOperations.snapshotFile(id);
	}

	restoreVersion(id: string, versionId: string): Promise<boolean> {
		this.assertWritable();
		return this.versionOperations.restoreVersion(id, versionId);
	}

	deleteFileVersion(id: string, versionId: string): Promise<boolean> {
		this.assertWritable();
		return this.versionOperations.deleteFileVersion(id, versionId);
	}

	/**
	 * The newest of `ids` stays; the rest become its versions, oldest first,
	 * and are deleted. Returns the kept file's id, null if any is not here.
	 */
	async mergeAsVersions(ids: string[], name?: string): Promise<string | null> {
		this.assertWritable();
		const plan = await this.versionOperations.planMerge(ids);
		if (!plan) {
			return null;
		}
		const { target, sources, max } = plan;
		// One at a time, each deleted only once its version exists: a
		// failure part way leaves every take either a file or a version.
		for (const source of sources) {
			await this.versionOperations.absorb(target, source, max);
			await this.fileOperations.deleteFile(source.file.path);
		}
		const wanted = name?.trim();
		if (wanted && wanted.toLowerCase() !== target.name.toLowerCase()) {
			const folder = target.path.includes("/")
				? target.path.slice(0, target.path.lastIndexOf("/"))
				: undefined;
			await this.fileOperations.updateFile(target.path, {
				key: await getUniqueDisplayName(this.ctx, wanted, folder, "file"),
			});
		}
		await this.ctx.invalidateListingCaches();
		return target.id;
	}

	fileVersioning(id: string): Promise<Versioning | null> {
		return this.versionOperations.fileVersioning(id);
	}

	/** Highest kept version per file, for the listing's pill. */
	latestVersionSeqs(fileIds: string[]): Promise<Map<string, number>> {
		return latestSeqs(this.ctx, fileIds);
	}

	async getFolderVersioning(
		folderId: string,
	): Promise<FolderVersioning | null> {
		return folderVersioning(this.ctx, folderId, await adminVersioning());
	}

	async setFolderSettings(
		folderId: string,
		settings: FolderSettingsData,
	): Promise<boolean> {
		this.assertWritable();
		const current = await this.getFolderVersioning(folderId);
		if (!current) {
			return false;
		}
		this.assertInScope(current.path, true);
		return setFolderSettings(this.ctx, folderId, settings);
	}

	async deleteFile(key: string): Promise<void> {
		this.assertWritable();
		await this.assertFileInScope(key);
		return await this.fileOperations.deleteFile(key);
	}

	fileExists(key: string): Promise<boolean> {
		return this.fileOperations.fileExists(key);
	}

	fileExistsById(id: string): Promise<boolean> {
		return this.fileOperations.fileExistsById(id);
	}

	openRawFile(key: string) {
		return this.fileOperations.openRawFile(key);
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
		this.assertWritable();
		this.assertInScope(folderKey, true);
		this.assertInScope(destinationFolder);
		return this.folderOperations.moveFolder(folderKey, destinationFolder);
	}

	createFolder(
		name: string,
		parent?: string,
	): Promise<{ id: string; name: string }> {
		this.assertWritable();
		this.assertInScope(parent);
		return this.folderOperations.createFolder(name, parent);
	}

	deleteFolder(key: string): Promise<void> {
		this.assertWritable();
		this.assertInScope(key, true);
		return this.folderOperations.deleteFolder(key);
	}

	trashFolder(key: string): Promise<void> {
		this.assertWritable();
		this.assertInScope(key, true);
		return this.folderOperations.trashFolder(key);
	}

	restoreFolder(key: string): Promise<void> {
		this.assertWritable();
		this.assertInScope(key, true);
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
		this.assertWritable();
		this.assertInScope(id, true);
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

	listTrashFiles(options?: ListingPageOptions): Promise<TrashPage> {
		return this.listingOperations.listTrashFiles(options);
	}

	emptyTrash(): Promise<EmptyTrashResult> {
		this.assertWritable();
		this.assertInScope(undefined, true);
		return this.trashOperations.emptyTrash();
	}

	listFilesPerCategory(
		category: FileCategory,
		options?: ListingPageOptions,
	): Promise<ListingPage> {
		return this.listingOperations.listFilesPerCategory(category, options);
	}

	listFolderPage(
		prefix?: string,
		options?: ListingPageOptions,
	): Promise<ListingPage> {
		return this.listingOperations.listFolderPage(prefix, options);
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

	listStarredFiles(options?: ListingPageOptions): Promise<ListingPage> {
		return this.listingOperations.listStarredFiles(options);
	}

	searchFiles(query: string, limit = 50): Promise<ObjectList> {
		return this.listingOperations.searchFiles(query, limit);
	}

	/** Reconcile the DB with the files actually present in the storage backend. */
	scanStorage(
		report?: ScanReporter,
		options?: { full?: boolean },
	): Promise<ScanResult> {
		this.assertInScope(undefined, true);
		return this.scanOperations.scan(report, options);
	}

	/**
	 * Applies a copy/delete outcome its requester died before applying. See
	 * `reconcile.ts`; returns how many rows or objects it removed.
	 */
	async reconcileOrphanedJob(
		type: string,
		result: CopyResult | DeleteResult,
	): Promise<number> {
		const removed =
			type === "copy"
				? await reconcileCopy(this.ctx, result as CopyResult)
				: await reconcileDelete(
						this.ctx,
						this.thumbnails,
						result as DeleteResult,
					);
		if (removed > 0) {
			await this.invalidateListingCaches();
		}
		return removed;
	}

	/** One batch of this root's media rows still missing a duration. */
	probeMissingDurations(): Promise<void> {
		return probeMissingDurations(this.ctx);
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
	): Promise<ReadableStream<Uint8Array>> {
		return this.zip.createZipFromPaths(filePaths);
	}

	public createAccountExport(): Promise<ReadableStream<Uint8Array> | null> {
		return this.zip.createAccountExport();
	}

	public createZipFromFolder(
		folderPath: string,
	): Promise<ReadableStream<Uint8Array>> {
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
			this.listingCache.deleteByPrefix("list:"),
			this.listingCache.deleteByPrefix("folders:"),
			this.listingCache.deleteByPrefix("folder-size:"),
			this.listingCache.deleteByPrefix(CacheKeys.starred()),
			this.listingCache.deleteByPrefix(CacheKeys.trashed()),
			this.listingCache.delete(CacheKeys.recent()),
			this.listingCache.deleteByPrefix(CacheKeys.counts()),
			this.listingCache.deleteByPrefix("category:"),
			this.listingCache.delete(CacheKeys.fileIdIndex()),
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

	/** The mounted volume this service is bound to, or null for the main drive. */
	public getVolume(): VolumeConfig | null {
		return this.volume;
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
		return getStoragePath();
	}

	public static getAvailableStorageSize(): number {
		return availableDiskSpace(StorageService.getAdminStoragePath());
	}

	/**
	 * Removes what `removeUser` cascades in the database but never touches on
	 * disk: a deleted user's own `user-<id>` tree (their `.thumbnails` live
	 * under it), and any `drives/<id>` they owned; `drives.ownerId` cascades
	 * too, so its row is already gone by the time this runs.
	 *
	 * A scan against the current `user`/`drives` rows rather than a job fired
	 * at delete time: it also catches whatever a crash mid-deletion, or a
	 * user removed some other way, left behind.
	 */
	public static async cleanupDeletedUserStorage(): Promise<void> {
		const db = getDb();
		const [usersList, drivesList] = await Promise.all([
			db.select().from(user),
			db.select({ id: drives.id }).from(drives),
		]);
		if (usersList.length === 0) {
			logger.info("No users found in database. Skipping storage cleanup.");
			return;
		}

		const storageBasePath = getStoragePath();
		if (!existsSync(storageBasePath)) {
			logger.info(
				"Storage base path does not exist. Skipping storage cleanup.",
			);
			return;
		}

		const knownUserIds = new Set(usersList.map((u) => u.id));
		const knownDriveIds = new Set(drivesList.map((d) => d.id));
		const failures: { message: string; error: unknown }[] = [];

		const storageDir = await fs.promises.readdir(storageBasePath, {
			withFileTypes: true,
		});
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

		const drivesBasePath = join(storageBasePath, "drives");
		if (existsSync(drivesBasePath)) {
			const drivesDir = await fs.promises.readdir(drivesBasePath, {
				withFileTypes: true,
			});
			for (const dirent of drivesDir) {
				if (!dirent.isDirectory() || knownDriveIds.has(dirent.name)) {
					continue;
				}
				const drivePath = join(drivesBasePath, dirent.name);
				try {
					await rm(drivePath, { recursive: true });
					logger.info(
						`Deleted storage for non-existent drive ID: ${dirent.name} at path: ${drivePath}`,
					);
				} catch (error) {
					failures.push({
						message: `Failed to delete storage for drive ID: ${dirent.name} at path: ${drivePath}`,
						error,
					});
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
