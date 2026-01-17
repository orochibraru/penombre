import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type {
	FileCategory,
	FileMetadata,
	ObjectItem,
	ObjectList,
} from "$lib/server/schema";
import { CacheKeys } from "./cache";
import { logger } from "./constants";
import { FolderOperations } from "./folder-operations";

/**
 * Listing and search operations for the storage service.
 * Handles listing files/folders with various filters and search.
 */
export abstract class ListingOperations extends FolderOperations {
	/**
	 * Abstract file listing with various filters.
	 * Results are cached per directory/options combination.
	 */
	public async abstractListFiles(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
		recursive?: boolean;
	}): Promise<ObjectList> {
		const prefix = options.parent || "";

		// Generate cache key based on options
		const optionsKey = [
			options.category || "",
			options.includeTrashed ? "trashed" : "",
			options.recursive ? "recursive" : "",
		]
			.filter(Boolean)
			.join(":");
		const cacheKey = CacheKeys.listing(prefix, optionsKey);

		// Check cache first
		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) {
			logger.debug(`Cache hit for listing: ${cacheKey}`);
			return cached;
		}

		const dirPath = join(this.storagePath, prefix);

		// Check if directory exists before trying to read it
		if (!existsSync(dirPath)) {
			logger.debug(
				`Directory does not exist yet: ${dirPath}, returning empty list`,
			);
			const emptyList: ObjectList = { list: [], count: 0, total: 0 };
			// Cache the empty result briefly
			this.cache.set(cacheKey, emptyList);
			return emptyList;
		}

		const dir = await readdir(dirPath, { withFileTypes: true });
		if (!dir) {
			throw new Error("Directory not found");
		}

		let fileList: ObjectItem[] = [];

		for (const contents of dir) {
			const fullPath = join(dirPath, contents.name);

			// Skip user folder reference
			if (contents.name === this.userFolder) {
				continue;
			}

			// Skip system directories
			if (
				contents.isDirectory() &&
				(contents.name === ".trash" || contents.name === ".thumbnails")
			) {
				continue;
			}

			// Handle directories
			if (contents.isDirectory()) {
				let updatedAt = new Date();
				try {
					const s = await stat(fullPath);
					updatedAt = new Date(s.mtimeMs);
				} catch {
					// Use current date as fallback
				}

				let metadata: FileMetadata = this.generateMeta(contents.name);
				try {
					const metaFile = Bun.file(join(fullPath, ".keep.meta.json"));
					if (await metaFile.exists()) {
						metadata = await metaFile.json();
					} else {
						const keepFile = Bun.file(join(fullPath, ".keep"));
						if (await keepFile.exists()) {
							const text = await keepFile.text();
							try {
								const meta = JSON.parse(text) as Partial<FileMetadata>;
								if (typeof meta.isTrashed === "boolean") {
									metadata.isTrashed = meta.isTrashed;
								}
							} catch {
								// Invalid JSON in .keep
							}
						}
					}
				} catch (err) {
					logger.warn(
						"Failed to read folder meta while listing:",
						fullPath,
						err,
					);
				}

				// Skip trashed folders unless explicitly included
				if (!options.includeTrashed && metadata.isTrashed) {
					continue;
				}

				// Recursive listing
				if (options.recursive) {
					const subPath = prefix ? `${prefix}/${contents.name}` : contents.name;
					const subResult = await this.abstractListFiles({
						parent: subPath,
						category: options.category,
						includeTrashed: options.includeTrashed,
						recursive: true,
					});
					const folderDisplayName = metadata.name || contents.name;
					for (const item of subResult.list) {
						if (item.type === "file") {
							const existingParent = item.parent || "";
							const existingParentKey = item.parentKey || "";
							fileList.push({
								...item,
								key: `${contents.name}/${item.key}`,
								parent: existingParent
									? `${folderDisplayName}/${existingParent}`
									: folderDisplayName,
								parentKey: existingParentKey
									? `${contents.name}/${existingParentKey}`
									: contents.name,
							});
						}
					}
					continue;
				}

				// Non-recursive: add folder to list
				fileList.push({
					key: `${contents.name}/`,
					size: 0,
					updatedAt,
					metadata,
					type: "folder",
				});

				continue;
			}

			// Skip metadata files
			if (contents.name.endsWith(".meta.json") || contents.name === ".keep") {
				continue;
			}

			// Handle regular files
			let size = 0;
			let updatedAt = new Date();
			try {
				const s = await stat(fullPath);
				size = s.size;
				updatedAt = new Date(s.mtimeMs);
			} catch (err) {
				logger.warn("Failed to stat file while listing:", fullPath, err);
				continue;
			}

			const fileMeta = Bun.file(`${fullPath}.meta.json`);
			let metadata: FileMetadata = this.generateMeta(contents.name);
			if (await fileMeta.exists()) {
				metadata = await fileMeta.json();
			}

			const fileObject: ObjectItem = {
				key: contents.name,
				size,
				updatedAt,
				metadata,
				type: "file",
			};

			this.permissionsCheck(fileObject.metadata);
			fileList.push(fileObject);
		}

		// Sort alphabetically
		fileList.sort((a, b) => a.key.localeCompare(b.key));

		// Filter trashed items
		if (!options.includeTrashed) {
			fileList = fileList.filter((item) => !item.metadata.isTrashed);
		}

		// Filter by category
		if (options.category) {
			fileList = fileList.filter((item) => {
				return item.metadata.category === options.category;
			});
		}

		const result: ObjectList = {
			list: fileList,
			count: fileList.length,
			total: fileList.length,
		};

		// Cache the result
		this.cache.set(cacheKey, result);
		logger.debug(`Cached listing: ${cacheKey}`);

		return result;
	}

	/**
	 * Lists only trashed files.
	 */
	public async listTrashFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.trashed();
		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

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

	/**
	 * Lists files by category (recursively).
	 */
	public async listFilesPerCategory(
		category: FileCategory,
	): Promise<ObjectList> {
		return await this.abstractListFiles({
			category,
			recursive: true,
		});
	}

	/**
	 * Lists files in a directory.
	 */
	public async listFiles(prefix?: string): Promise<ObjectList> {
		const normalizedPrefix =
			prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix;
		return await this.abstractListFiles({
			parent: normalizedPrefix,
		});
	}

	/**
	 * Lists the 25 most recently modified files.
	 */
	public async listRecentFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.recent();
		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

		const allFiles = await this.abstractListFiles({ recursive: true });
		const recentFiles = allFiles.list
			.filter((item) => item.type === "file")
			.sort((a, b) => {
				const aTime =
					a.updatedAt instanceof Date
						? a.updatedAt.getTime()
						: new Date(a.updatedAt || 0).getTime();
				const bTime =
					b.updatedAt instanceof Date
						? b.updatedAt.getTime()
						: new Date(b.updatedAt || 0).getTime();
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

	/**
	 * Lists starred files and folders.
	 */
	public async listStarredFiles(): Promise<ObjectList> {
		const cacheKey = CacheKeys.starred();
		const cached = this.cache.get<ObjectList>(cacheKey);
		if (cached) {
			return cached;
		}

		// Get starred files
		const allFiles = await this.abstractListFiles({ recursive: true });
		const starredFiles = allFiles.list.filter(
			(item) => item.metadata.isStarred,
		);

		// Get starred folders
		const starredFolders = await this.collectStarredFolders("");

		// Combine and sort (folders first, then by name)
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

	/**
	 * Recursively collects starred folders.
	 */
	private async collectStarredFolders(prefix: string): Promise<ObjectItem[]> {
		const results: ObjectItem[] = [];
		const dirPath = join(this.storagePath, prefix);

		let dir: { name: string; isDirectory: () => boolean }[];
		try {
			dir = (await readdir(dirPath, {
				withFileTypes: true,
			})) as unknown as typeof dir;
		} catch {
			return results;
		}

		for (const dirent of dir) {
			if (!dirent.isDirectory()) continue;
			if (dirent.name === ".trash" || dirent.name === ".thumbnails") continue;
			if (dirent.name === this.userFolder) continue;

			const folderPath = join(dirPath, dirent.name);
			const relativePath = prefix ? `${prefix}/${dirent.name}` : dirent.name;

			let metadata: FileMetadata = this.generateMeta(dirent.name);
			let updatedAt = new Date();

			try {
				const s = await stat(folderPath);
				updatedAt = new Date(s.mtimeMs);
			} catch {
				// Use current date
			}

			try {
				const metaFile = Bun.file(join(folderPath, ".keep.meta.json"));
				if (await metaFile.exists()) {
					metadata = await metaFile.json();
				}
			} catch (err) {
				logger.warn("Failed to read folder meta:", folderPath, err);
			}

			// Skip trashed folders
			if (metadata.isTrashed) continue;

			// Add starred folder to results
			if (metadata.isStarred) {
				results.push({
					key: `${relativePath}/`,
					size: 0,
					updatedAt,
					metadata,
					type: "folder",
				});
			}

			// Recurse into subfolders
			const subResults = await this.collectStarredFolders(relativePath);
			results.push(...subResults);
		}

		return results;
	}

	/**
	 * Searches files by display name.
	 */
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

		// Sort by relevance: exact match > starts with > contains
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

			// Folders first
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

	/**
	 * Gets a unique display name for a file or folder.
	 * Implements the abstract method from FileOperations.
	 */
	protected async getUniqueDisplayName(
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

	/**
	 * Counts trashed items (files and folders).
	 */
	public async countTrashedItems(): Promise<number> {
		const cacheKey = `${CacheKeys.counts()}:trashed`;
		const cached = this.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const files = await this.abstractListFiles({ includeTrashed: true });
		const count = files.list.filter((item) => item.metadata.isTrashed).length;
		this.cache.set(cacheKey, count);
		return count;
	}

	/**
	 * Counts starred items (files and folders).
	 */
	public async countStarredItems(): Promise<number> {
		const cacheKey = `${CacheKeys.counts()}:starred`;
		const cached = this.cache.get<number>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const allFiles = await this.abstractListFiles({ recursive: true });
		const count = allFiles.list.filter(
			(item) => item.metadata.isStarred,
		).length;
		this.cache.set(cacheKey, count);
		return count;
	}
}
