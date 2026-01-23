import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { FileOrFolderNotFoundError } from "$lib/server/errors";
import type {
	DirectoryList,
	FileMetadata,
	FolderItem,
} from "$lib/server/schema";
import { CacheKeys } from "./cache";
import { logger } from "./constants";
import { FileOperations } from "./file-operations";

/**
 * Folder operations for the storage service.
 * Handles all folder-specific CRUD operations.
 */
export abstract class FolderOperations extends FileOperations {
	/**
	 * Gets a folder's path by UUID only (no display name resolution).
	 * Folders MUST be referenced by their UUID, just like files.
	 */
	public async getFolder(folderId: string): Promise<string> {
		const folderPrefix = folderId.endsWith("/") ? folderId : `${folderId}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		const exists = existsSync(dirPath);

		if (!exists) {
			throw new FileOrFolderNotFoundError(
				`Folder not found: ${folderId}. Folders must be referenced by UUID.`,
			);
		}

		// Verify folder has metadata to ensure it's a valid UUID-based folder
		const metaPath = join(dirPath, ".keep.meta.json");
		if (!existsSync(metaPath)) {
			logger.warn(
				`Folder ${folderId} exists but has no metadata. This may be a legacy folder.`,
			);
		}

		return folderPrefix;
	}

	/**
	 * Moves a folder to a different parent folder.
	 */
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

		const keepMetaPath = join(folderPath, ".keep.meta.json");
		let metadata: FileMetadata | undefined;
		if (existsSync(keepMetaPath)) {
			const loadedMeta: FileMetadata = await Bun.file(keepMetaPath).json();
			this.permissionsCheck(loadedMeta);
			metadata = loadedMeta;
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
				join(destPath, ".keep.meta.json"),
				JSON.stringify(metadata),
			);
		}

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved folder "${uniqueName}" to ${normalizedDest || "root"}`,
			level: "info",
		});

		// Invalidate listing caches after folder move
		this.invalidateListingCaches();
	}

	/**
	 * Creates a new folder with UUID as physical name and display name in metadata.
	 * This ensures folders work exactly like files: UUID on disk, name in metadata.
	 */
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

		// Ensure unique display name
		const uniqueName = await this.getUniqueDisplayName(
			name,
			normalizedParent,
			"folder",
		);

		// Generate metadata with UUID and display name
		const folderMeta: FileMetadata = this.generateMeta(uniqueName);

		// Physical folder name is ALWAYS the UUID
		const folderKey = normalizedParent
			? `${normalizedParent}/${folderMeta.id}`
			: folderMeta.id;
		const folderPath = join(this.storagePath, folderKey);

		try {
			await mkdir(folderPath);
			await Bun.write(join(folderPath, ".keep"), new Uint8Array());
			await Bun.write(
				join(folderPath, ".keep.meta.json"),
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

			// Invalidate listing caches after folder creation
			this.invalidateListingCaches();

			// Return the UUID and display name for the client
			return { id: folderMeta.id, name: uniqueName };
		} catch (error) {
			logger.error("Error creating folder:", error);
			throw new Error("Failed to create folder");
		}
	}

	/**
	 * Deletes a folder and all its contents.
	 */
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

			// Invalidate listing caches after folder deletion
			this.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting folder:", error);
			throw new Error(`Error deleting folder with key: ${key}`);
		}
	}

	/**
	 * Moves a folder to trash by marking it and all contents as trashed.
	 */
	public async trashFolder(key: string): Promise<void> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		const exists = existsSync(dirPath);
		if (!exists) {
			throw new Error("Folder not found");
		}

		const files = await this.walkFilesRecursively(dirPath);
		for (const abs of files) {
			const relKey = abs.replace(`${this.storagePath}/`, "");
			const metaPath = `${abs}.meta.json`;
			let metadata: FileMetadata = this.generateMeta(
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

		// Invalidate listing caches after folder trash
		this.invalidateListingCaches();
	}

	/**
	 * Restores a folder and all its contents from trash.
	 */
	public async restoreFolder(key: string): Promise<void> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		const exists = existsSync(dirPath);
		if (!exists) {
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

		// Invalidate listing caches after folder restore
		this.invalidateListingCaches();
	}

	/**
	 * Updates folder metadata.
	 */
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

		const keepMetaPath = join(dirPath, ".keep.meta.json");
		let metadata: FileMetadata = this.generateMeta(folderPrefix);
		const keepMetaFile = Bun.file(keepMetaPath);
		if (await keepMetaFile.exists()) {
			metadata = await keepMetaFile.json();
		}

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

		// Invalidate listing caches after folder metadata update
		this.invalidateListingCaches();
	}

	/**
	 * Gets folder metadata by UUID.
	 */
	public async getFolderMeta(folderId: string): Promise<FileMetadata | null> {
		const folderPrefix = folderId.endsWith("/") ? folderId : `${folderId}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		if (!existsSync(dirPath)) {
			logger.warn(`Folder not found by UUID: ${folderId}`);
			return null;
		}
		const keepMetaPath = join(dirPath, ".keep.meta.json");
		const keepMetaFile = Bun.file(keepMetaPath);
		if (await keepMetaFile.exists()) {
			const metadata = await keepMetaFile.json();
			logger.debug(
				`Retrieved folder metadata: UUID=${folderId}, name=${metadata.name}`,
			);
			return metadata;
		}
		logger.warn(`Folder ${folderId} missing metadata - may be legacy folder`);
		return null;
	}

	/**
	 * Gets the full path for a folder given its UUID and optional parent UUID.
	 * Both ID and parentId MUST be UUIDs, never display names.
	 */
	public getFullFolderPath(folderId: string, parentId?: string): string {
		const folderPrefix = folderId.endsWith("/") ? folderId : `${folderId}/`;
		if (parentId) {
			const parentPrefix = parentId.endsWith("/") ? parentId : `${parentId}/`;
			const fullPath = `${parentPrefix}${folderPrefix}`;
			logger.debug(
				`Resolved folder path: ${folderId} in parent ${parentId} -> ${fullPath}`,
			);
			return fullPath;
		}
		logger.debug(`Resolved root folder path: ${folderId} -> ${folderPrefix}`);
		return folderPrefix;
	}

	/**
	 * Lists folders in a directory.
	 */
	public async listFolders(
		prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<DirectoryList> {
		const normalizedPrefix = !prefix || prefix === "/" ? "" : prefix;

		// Generate cache key
		const cacheKey = CacheKeys.folders(
			normalizedPrefix,
			Boolean(options?.onlyTrashed),
		);
		const cached = this.cache.get<DirectoryList>(cacheKey);
		if (cached) {
			return cached;
		}

		const dirPath = join(this.storagePath, normalizedPrefix);
		const dir = await readdir(dirPath, { withFileTypes: true });
		if (!dir) {
			throw new Error("Directory not found");
		}

		const folders: string[] = [];

		for (const dirent of dir) {
			if (!dirent.isDirectory()) continue;
			if (dirent.name === ".trash" || dirent.name === ".thumbnails") continue;

			const folderName = dirent.name;
			const folderPath = join(dirPath, folderName);
			let isTrashed = false;

			try {
				const metaFile = Bun.file(join(folderPath, ".keep.meta.json"));
				if (await metaFile.exists()) {
					const meta: FileMetadata = await metaFile.json();
					isTrashed = Boolean(meta.isTrashed);
				} else {
					const keepFile = Bun.file(join(folderPath, ".keep"));
					if (await keepFile.exists()) {
						const text = await keepFile.text();
						try {
							const meta = JSON.parse(text) as Partial<FileMetadata>;
							if (meta && typeof meta.isTrashed === "boolean") {
								isTrashed = meta.isTrashed;
							}
						} catch {
							// Invalid JSON in .keep file
						}
					}
				}
			} catch (err) {
				logger.warn("Failed to read folder meta:", folderPath, err);
			}

			if (options?.onlyTrashed) {
				if (isTrashed) folders.push(folderName);
				continue;
			}
			if (!options?.includeTrashed && isTrashed) {
				continue;
			}
			folders.push(folderName);
		}

		this.cache.set(cacheKey, folders);
		return folders;
	}

	/**
	 * Lists folders with full metadata, recursively.
	 */
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

				let isTrashed = false;
				let displayName = folderId;

				try {
					const metaFile = Bun.file(join(folderPath, ".keep.meta.json"));
					if (await metaFile.exists()) {
						const meta: FileMetadata = await metaFile.json();
						isTrashed = Boolean(meta.isTrashed);
						displayName = meta.name || folderId;
					} else {
						const keepFile = Bun.file(join(folderPath, ".keep"));
						if (await keepFile.exists()) {
							const text = await keepFile.text();
							try {
								const meta = JSON.parse(text) as Partial<FileMetadata>;
								if (meta) {
									isTrashed = Boolean(meta.isTrashed);
									displayName = meta.name || folderId;
								}
							} catch {
								// Invalid JSON
							}
						}
					}
				} catch (err) {
					logger.warn("Failed to read folder meta:", folderPath, err);
				}

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

	/**
	 * Increments a folder name (legacy helper).
	 */
	public async incrementFolderName(
		name: string,
		parent?: string,
	): Promise<string> {
		const parentPrefix = parent ? `${parent}/` : "";
		return `${parentPrefix}${name}`;
	}

	/**
	 * Calculates the total size of a folder recursively.
	 * Results are cached with a 5-minute TTL.
	 */
	public async calculateFolderSize(folderKey: string): Promise<number> {
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;

		// Check cache first
		const cacheKey = `folder-size:${normalizedKey}`;
		const cached = this.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			logger.debug(`Cache hit for folder size: ${cacheKey}`);
			return cached;
		}

		const folderPath = join(this.storagePath, normalizedKey);

		if (!existsSync(folderPath)) {
			throw new FileOrFolderNotFoundError("Folder not found");
		}

		let totalSize = 0;

		const walkFolder = async (dirPath: string): Promise<void> => {
			try {
				const entries = await readdir(dirPath, { withFileTypes: true });
				for (const entry of entries) {
					// Skip metadata files and hidden folders
					if (entry.name.endsWith(".meta.json") || entry.name.startsWith(".")) {
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
				// Continue on error, partial size is better than failure
			}
		};

		await walkFolder(folderPath);

		// Cache the result for 5 minutes (300 seconds)
		this.cache.set(cacheKey, totalSize, 300);

		return totalSize;
	}

	/**
	 * Calculates sizes for all folders in a directory.
	 * Returns a map of folder key to size in bytes.
	 */
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
}
