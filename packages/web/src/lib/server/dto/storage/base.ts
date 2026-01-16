import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { User } from "better-auth";
import { ActivityService } from "$lib/server/dto/activity";
import {
	FileOrFolderNotFoundError,
	UnauthorizedError,
} from "$lib/server/errors";
import type { FileMetadata } from "$lib/server/schema";
import { CacheKeys, getUserCache, type MemoryCache } from "./cache";
import { DEFAULT_STORAGE_PATH, logger } from "./constants";
import { determineCategory, determineContentType } from "./content-type";

/**
 * Base class for storage operations.
 * Contains common properties and utility methods shared by file and folder operations.
 */
export abstract class StorageServiceBase {
	protected storagePath: string;
	protected userFolder: string;
	protected user: User;
	protected activityService: ActivityService = new ActivityService();
	protected cache: MemoryCache;

	constructor(user: User) {
		this.userFolder = `user-${user.id}`;
		this.storagePath = join(DEFAULT_STORAGE_PATH, this.userFolder);
		this.user = user;
		this.cache = getUserCache(user.id);
	}

	/**
	 * Invalidates all listing-related caches.
	 * Call this after any mutation (create, update, delete, move).
	 */
	protected invalidateListingCaches(): void {
		// Clear all listing caches - they're all potentially stale after a mutation
		this.cache.deleteByPrefix("list:");
		this.cache.deleteByPrefix("folders:");
		this.cache.delete(CacheKeys.starred());
		this.cache.delete(CacheKeys.trashed());
		this.cache.delete(CacheKeys.recent());
		this.cache.delete(CacheKeys.counts());
		this.cache.deleteByPrefix("category:");
	}

	/**
	 * Invalidates cache for a specific directory.
	 */
	protected invalidateDirectoryCache(prefix: string): void {
		const normalizedPrefix = prefix || "root";
		this.cache.deleteByPrefix(`list:${normalizedPrefix}`);
		this.cache.deleteByPrefix(`folders:${normalizedPrefix}`);
	}

	/**
	 * Ensures the user's storage directory exists.
	 */
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

	/**
	 * Resolves a file key to its actual filesystem path.
	 * Falls back to searching by display name if direct path doesn't exist.
	 */
	protected async resolveFileLocation(key: string): Promise<{
		currentPath: string;
		currentMetaPath: string;
	}> {
		const baseKey = key;
		let currentPath = join(this.storagePath, baseKey);
		let currentMetaPath = `${currentPath}.meta.json`;

		if (!(await Bun.file(currentPath).exists())) {
			// Fallback: resolve by display name within the parent directory
			const parentDir = baseKey.includes("/")
				? baseKey.slice(0, baseKey.lastIndexOf("/"))
				: "";
			const sDir = join(this.storagePath, parentDir);
			const basename = baseKey.includes("/")
				? baseKey.slice(baseKey.lastIndexOf("/") + 1)
				: baseKey;

			try {
				const entries = await readdir(sDir, { withFileTypes: true });
				for (const e of entries) {
					if (e.isDirectory()) continue;
					if (e.name.endsWith(".meta.json")) continue;
					const abs = join(sDir, e.name);
					const m = Bun.file(`${abs}.meta.json`);
					if (await m.exists()) {
						const md: FileMetadata = await m.json();
						if (md.name === basename) {
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

	/**
	 * Generates default metadata for a file or folder.
	 */
	protected generateMeta(name: string): FileMetadata {
		return {
			id: crypto.randomUUID(),
			name,
			createdAt: new Date(),
			owner: this.user.id,
			category: determineCategory(name),
			contentType: determineContentType(name),
			isTrashed: false,
			isStarred: false,
		};
	}

	/**
	 * Validates that the current user owns the file/folder.
	 */
	protected permissionsCheck(metadata: FileMetadata): void {
		if (metadata.owner !== this.user.id) {
			throw new UnauthorizedError("Unauthorized access to file");
		}
	}

	/**
	 * Checks if a file exists at the given key.
	 */
	public async fileExists(key: string): Promise<boolean> {
		try {
			const filePath = join(this.storagePath, key);
			const file = Bun.file(filePath);
			return await file.exists();
		} catch {
			return false;
		}
	}

	/**
	 * Checks if a folder exists at the given key.
	 */
	public async folderExists(key: string): Promise<boolean> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		try {
			const dirPath = join(this.storagePath, folderPrefix);
			return existsSync(dirPath);
		} catch {
			return false;
		}
	}

	/**
	 * Recursively walks all files in a directory.
	 */
	protected async walkFilesRecursively(basePath: string): Promise<string[]> {
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

	/**
	 * Gets the user's storage path.
	 */
	public getStoragePath(): string {
		return this.storagePath;
	}

	/**
	 * Gets the user folder name.
	 */
	public getUserFolder(): string {
		return this.userFolder;
	}
}
