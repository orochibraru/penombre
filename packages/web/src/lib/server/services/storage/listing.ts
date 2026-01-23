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
	 * Optimized with parallel I/O and efficient filtering.
	 */
	public async abstractListFiles(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
		recursive?: boolean;
		limit?: number;
		offset?: number;
	}): Promise<ObjectList> {
		const prefix = options.parent || "";

		// Generate cache key based on options
		const optionsKey = [
			options.category || "",
			options.includeTrashed ? "trashed" : "",
			options.recursive ? "recursive" : "",
			options.limit ? `limit:${options.limit}` : "",
			options.offset ? `offset:${options.offset}` : "",
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

		// Pre-filter directory entries to skip system files/folders
		const validEntries = dir.filter((entry) => {
			if (entry.name === this.userFolder) return false;
			if (
				entry.isDirectory() &&
				(entry.name === ".trash" || entry.name === ".thumbnails")
			) {
				return false;
			}
			if (entry.name.endsWith(".meta.json") || entry.name === ".keep") {
				return false;
			}
			return true;
		});

		// Process all entries in parallel for maximum performance
		const itemPromises = validEntries.map(async (contents) => {
			const fullPath = join(dirPath, contents.name);

			// Handle directories
			if (contents.isDirectory()) {
				// Parallel stat and metadata read
				const [statResult, metadata] = await Promise.all([
					stat(fullPath).catch(() => null),
					this.readFolderMetadata(fullPath, contents.name),
				]);

				const updatedAt = statResult
					? new Date(statResult.mtimeMs)
					: new Date();

				// Skip trashed folders unless explicitly included (early exit)
				if (!options.includeTrashed && metadata.isTrashed) {
					return null;
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

					// Transform all sub-items in one pass
					return subResult.list
						.filter((item) => item.type === "file")
						.map((item) => ({
							...item,
							key: `${contents.name}/${item.key}`,
							parent: item.parent
								? `${folderDisplayName}/${item.parent}`
								: folderDisplayName,
							parentKey: item.parentKey
								? `${contents.name}/${item.parentKey}`
								: contents.name,
						}));
				}

				// Non-recursive: return folder item
				return {
					key: `${contents.name}/`,
					size: 0,
					updatedAt,
					metadata,
					type: "folder" as const,
				};
			}

			// Handle regular files - parallel stat and metadata read
			const [statResult, metadata] = await Promise.all([
				stat(fullPath).catch(() => null),
				this.readFileMetadata(`${fullPath}.meta.json`, contents.name),
			]);

			if (!statResult) {
				return null; // Skip files that can't be stat'd
			}

			const fileObject: ObjectItem = {
				key: contents.name,
				size: statResult.size,
				updatedAt: new Date(statResult.mtimeMs),
				metadata,
				type: "file",
			};

			// Perform permission check
			try {
				this.permissionsCheck(fileObject.metadata);
			} catch {
				return null; // Skip unauthorized files
			}

			return fileObject;
		});

		// Await all parallel operations and flatten results
		const results = await Promise.all(itemPromises);
		let fileList: ObjectItem[] = results
			.flat()
			.filter((item): item is ObjectItem => item !== null);

		// Apply filters in a single pass (more efficient than multiple filter calls)
		if (!options.includeTrashed || options.category) {
			fileList = fileList.filter((item) => {
				if (!options.includeTrashed && item.metadata.isTrashed) return false;
				if (options.category && item.metadata.category !== options.category)
					return false;
				return true;
			});
		}

		const totalCount = fileList.length;

		// Sort alphabetically (only if we have items to sort)
		if (fileList.length > 1) {
			fileList.sort((a, b) => a.key.localeCompare(b.key));
		}

		// Apply pagination after sorting (more efficient than sorting everything)
		const offset = options.offset || 0;
		const limit = options.limit;
		if (limit !== undefined || offset > 0) {
			fileList = fileList.slice(offset, limit ? offset + limit : undefined);
		}

		const result: ObjectList = {
			list: fileList,
			count: fileList.length,
			total: totalCount,
		};

		// Cache the result
		this.cache.set(cacheKey, result);

		return result;
	}

	/**
	 * Reads folder metadata efficiently.
	 */
	private async readFolderMetadata(
		folderPath: string,
		folderName: string,
	): Promise<FileMetadata> {
		const metadata: FileMetadata = this.generateMeta(folderName);

		try {
			const metaFile = Bun.file(join(folderPath, ".keep.meta.json"));
			if (await metaFile.exists()) {
				return await metaFile.json();
			}

			// Fallback to legacy .keep file
			const keepFile = Bun.file(join(folderPath, ".keep"));
			if (await keepFile.exists()) {
				const text = await keepFile.text();
				try {
					const meta = JSON.parse(text) as Partial<FileMetadata>;
					if (typeof meta.isTrashed === "boolean") {
						metadata.isTrashed = meta.isTrashed;
					}
				} catch {
					// Invalid JSON in .keep, return default metadata
				}
			}
		} catch (err) {
			logger.warn("Failed to read folder meta while listing:", folderPath, err);
		}

		return metadata;
	}

	/**
	 * Reads file metadata efficiently.
	 */
	private async readFileMetadata(
		metaPath: string,
		fileName: string,
	): Promise<FileMetadata> {
		const fileMeta = Bun.file(metaPath);
		if (await fileMeta.exists()) {
			return await fileMeta.json();
		}
		return this.generateMeta(fileName);
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
	 * Recursively collects starred folders with parallel processing.
	 */
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

		// Filter valid directories upfront
		const validDirs = dir.filter((dirent) => {
			if (!dirent.isDirectory()) return false;
			if (dirent.name === ".trash" || dirent.name === ".thumbnails")
				return false;
			if (dirent.name === this.userFolder) return false;
			return true;
		});

		// Process all directories in parallel
		const folderPromises = validDirs.map(async (dirent) => {
			const folderPath = join(dirPath, dirent.name);
			const relativePath = prefix ? `${prefix}/${dirent.name}` : dirent.name;

			// Parallel stat and metadata read
			const [statResult, metadata] = await Promise.all([
				stat(folderPath).catch(() => null),
				this.readFolderMetadata(folderPath, dirent.name),
			]);

			const updatedAt = statResult ? new Date(statResult.mtimeMs) : new Date();

			// Skip trashed folders (early exit)
			if (metadata.isTrashed) return [];

			const results: ObjectItem[] = [];

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

			// Recurse into subfolders in parallel
			const subResults = await this.collectStarredFolders(relativePath);
			return [...results, ...subResults];
		});

		// Await all parallel operations and flatten
		const allResults = await Promise.all(folderPromises);
		return allResults.flat();
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
