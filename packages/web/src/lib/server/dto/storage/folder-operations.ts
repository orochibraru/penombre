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
	 * Gets a folder's path by name, resolving by display name if needed.
	 */
	public async getFolder(name: string): Promise<string> {
		let folderPrefix = name.endsWith("/") ? name : `${name}/`;
		let dirPath = join(this.storagePath, folderPrefix);
		let exists = existsSync(dirPath);

		if (!exists) {
			const parentDir = folderPrefix.includes("/")
				? folderPrefix.slice(0, folderPrefix.lastIndexOf("/"))
				: "";
			const sDir = join(this.storagePath, parentDir);

			try {
				const entries = await readdir(sDir, { withFileTypes: true });
				for (const e of entries) {
					if (!e.isDirectory()) continue;
					const fPath = join(sDir, e.name);
					const m = Bun.file(join(fPath, ".keep.meta.json"));
					if (await m.exists()) {
						const md: FileMetadata = await m.json();
						if (md.name === (name.endsWith("/") ? name.slice(0, -1) : name)) {
							folderPrefix = `${e.name}/`;
							dirPath = join(this.storagePath, folderPrefix);
							exists = existsSync(dirPath);
							break;
						}
					}
				}
			} catch {
				// Directory doesn't exist or not readable
			}

			if (!exists) {
				throw new FileOrFolderNotFoundError("Folder not found");
			}
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
	 * Creates a new folder with metadata.
	 */
	public async createFolder(name: string, parent?: string): Promise<void> {
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
		const folderMeta: FileMetadata = this.generateMeta(uniqueName);
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
				message: `Created folder: ${name}`,
				level: "info",
			});
			logger.info(`Folder created at path: ${folderPath}`);

			// Invalidate listing caches after folder creation
			this.invalidateListingCaches();
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
	 * Gets folder metadata.
	 */
	public async getFolderMeta(name: string): Promise<FileMetadata | null> {
		const folderPrefix = name.endsWith("/") ? name : `${name}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		if (!existsSync(dirPath)) {
			return null;
		}
		const keepMetaPath = join(dirPath, ".keep.meta.json");
		const keepMetaFile = Bun.file(keepMetaPath);
		if (await keepMetaFile.exists()) {
			return await keepMetaFile.json();
		}
		return null;
	}

	/**
	 * Gets the full path for a folder given its ID and optional parent.
	 */
	public getFullFolderPath(id: string, parentId?: string): string {
		const folderPrefix = id.endsWith("/") ? id : `${id}/`;
		if (parentId) {
			const parentPrefix = parentId.endsWith("/") ? parentId : `${parentId}/`;
			return `${parentPrefix}${folderPrefix}`;
		}
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
}
