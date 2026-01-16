import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readdir, rmdir, stat, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import type { User } from "better-auth";
import type { BunFile } from "bun";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { Logger } from "$lib/logger";
import { getDb } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { ActivityService } from "$lib/server/dto/activity";
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

const logger = new Logger("StorageService");

export async function cleanupDeletedUserStorage() {
	const db = getDb();
	const usersList = await db.select().from(user);
	if (usersList.length === 0) {
		logger.info("No users found in database. Skipping storage cleanup.");
		return;
	}

	const storageBasePath = resolve(
		Bun.env.STORAGE_PATH || join(cwd(), "/data/storage"),
	);
	const exists = existsSync(storageBasePath);
	if (!exists) {
		logger.info("Storage base path does not exist. Skipping storage cleanup.");
		return;
	}
	const storageDir = await readdir(storageBasePath, { withFileTypes: true });

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
					logger.error(
						`Failed to delete storage for user ID: ${userId} at path: ${userStoragePath}`,
						error,
					);
				}
			}
		}
	}
}

export const DEFAULT_STORAGE_PATH = join(
	cwd(),
	resolve(Bun.env.STORAGE_PATH || "/data/storage"),
);

export class AdminStorageService {
	private storagePath: string;

	constructor() {
		this.storagePath = resolve(DEFAULT_STORAGE_PATH);
	}

	public getStoragePath(): string {
		return this.storagePath;
	}

	public getAvailableStorageSize(): number {
		// The previous implementation used file stats (blksize * blocks) which
		// describes the inode, not filesystem free space. That's wrong.
		// Try statfs first (Node >=19/20); fallback to parsing `df -k`.
		try {
			// biome-ignore lint/suspicious/noExplicitAny: Avoiding complex types for this
			const anyFs = fs as unknown as { statfsSync?: (path: string) => any };
			if (typeof anyFs.statfsSync === "function") {
				const sfs = anyFs.statfsSync(this.storagePath);
				const blockSize = Number(sfs?.bsize ?? sfs?.frsize ?? 4096);
				const availBlocks = Number(sfs?.bavail ?? sfs?.bfree ?? 0);
				if (Number.isFinite(blockSize) && Number.isFinite(availBlocks)) {
					return blockSize * availBlocks;
				}
			}
		} catch (err) {
			logger.warn("statfsSync unavailable or failed:", err);
		}

		// Fallback: use `df -k` to get Available (in KiB) and convert to bytes
		try {
			const proc = Bun.spawnSync(["df", "-k", this.storagePath]);
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
					// BSD/macOS often uses "1024-blocks Used Available Capacity Mounted on"
					// If header parsing fails, assume the second-to-last numeric before mountpoint
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

		// Last resort: unknown free space
		return 0;
	}
}

export class StorageService {
	private storagePath: string;
	private userFolder: string;
	private user: User;
	private activityService: ActivityService = new ActivityService();

	constructor(user: User) {
		this.userFolder = `user-${user.id}`;

		this.storagePath = join(DEFAULT_STORAGE_PATH, this.userFolder);

		this.user = user;
	}

	public async ensureUserDirectory() {
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

	private async resolveFileLocation(key: string): Promise<{
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
			} catch {}
			if (!(await Bun.file(currentPath).exists())) {
				throw new FileOrFolderNotFoundError("File not found");
			}
		}
		return { currentPath, currentMetaPath };
	}

	public async getFile(path: string): Promise<ObjectItem> {
		const { currentPath: filePath } = await this.resolveFileLocation(path);
		const file = Bun.file(filePath);
		const fileMeta = Bun.file(`${filePath}.meta.json`);
		if (!(await fileMeta.exists())) {
			const baseName = filePath.split("/").pop() || filePath;
			const metadata = this.generateMeta(baseName);
			// Write metadata next to the actual file (root or trash)
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

	public async getFolder(name: string): Promise<string> {
		let folderPrefix = name.endsWith("/") ? name : `${name}/`;
		let dirPath = join(this.storagePath, folderPrefix);
		let exists = existsSync(dirPath);
		if (!exists) {
			// Fallback: resolve folder by display name within parent using .keep.meta.json
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
			} catch {}
			if (!exists) {
				throw new FileOrFolderNotFoundError("Folder not found");
			}
		}
		return folderPrefix;
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
	}

	public async updateFile(name: string, data: UpdateFile): Promise<void> {
		const { currentPath, currentMetaPath } =
			await this.resolveFileLocation(name);

		// Load and verify metadata
		let metadata: FileMetadata;
		const metaFile = Bun.file(currentMetaPath);
		if (await metaFile.exists()) {
			metadata = await metaFile.json();
		} else {
			const baseName = currentPath.split("/").pop() || name;
			metadata = this.generateMeta(baseName);
		}
		this.permissionsCheck(metadata);

		// Apply metadata updates
		if (data.contentType !== undefined) metadata.contentType = data.contentType;
		if (data.category !== undefined) metadata.category = data.category;
		if (data.tags !== undefined) metadata.tags = data.tags;
		if (typeof data.isTrashed === "boolean")
			metadata.isTrashed = data.isTrashed;
		if (typeof data.isStarred === "boolean")
			metadata.isStarred = data.isStarred;
		// Interpret `data.key` as display name change (not physical rename)
		if (data.key && data.key.trim().length > 0) {
			metadata.name = data.key.trim();
			// Update derived fields from display name extension
			metadata.contentType = this.determineContentType(metadata.name);
			metadata.category = this.determineCategory(metadata.name);
		}

		// Trash is metadata-only; do not move files physically

		// Persist metadata update
		await Bun.write(currentMetaPath, JSON.stringify(metadata));
	}

	/**
	 * Move a file to a different folder.
	 * @param fileKey - Current file key (ID-based path)
	 * @param destinationFolder - Target folder path (empty string for root)
	 */
	public async moveFile(
		fileKey: string,
		destinationFolder: string,
	): Promise<void> {
		const { currentPath, currentMetaPath } =
			await this.resolveFileLocation(fileKey);

		// Load and verify metadata
		const metaFile = Bun.file(currentMetaPath);
		if (!(await metaFile.exists())) {
			throw new FileOrFolderNotFoundError("File metadata not found");
		}
		const metadata: FileMetadata = await metaFile.json();
		this.permissionsCheck(metadata);

		// Ensure unique display name in destination
		const uniqueName = await this.getUniqueDisplayName(
			metadata.name || fileKey.split("/").pop() || fileKey,
			destinationFolder || undefined,
			"file",
		);

		// Construct destination paths
		const fileName = currentPath.split("/").pop() || fileKey;
		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const destPath = normalizedDest
			? join(this.storagePath, normalizedDest, fileName)
			: join(this.storagePath, fileName);
		const destMetaPath = `${destPath}.meta.json`;

		// Ensure destination folder exists
		if (normalizedDest) {
			const destDir = join(this.storagePath, normalizedDest);
			if (!existsSync(destDir)) {
				await mkdir(destDir, { recursive: true });
			}
		}

		// Read file content and write to new location
		const fileContent = await Bun.file(currentPath).arrayBuffer();
		await Bun.write(destPath, fileContent);

		// Update metadata with new name if it was deduplicated
		metadata.name = uniqueName;

		// Write metadata to new location
		await Bun.write(destMetaPath, JSON.stringify(metadata));

		// Delete old file and metadata
		await fs.promises.unlink(currentPath);
		await fs.promises.unlink(currentMetaPath);

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved file "${uniqueName}" to ${normalizedDest || "root"}`,
			level: "info",
		});
	}

	/**
	 * Duplicate a file in the same folder.
	 * Creates a copy with a new UUID and unique display name (e.g. "file (1).txt").
	 * @param fileKey - Current file key (ID-based path)
	 * @returns The new file's metadata
	 */
	public async duplicateFile(fileKey: string): Promise<ObjectItem> {
		const { currentPath, currentMetaPath } =
			await this.resolveFileLocation(fileKey);

		// Load and verify source metadata
		const metaFile = Bun.file(currentMetaPath);
		if (!(await metaFile.exists())) {
			throw new FileOrFolderNotFoundError("File metadata not found");
		}
		const sourceMetadata: FileMetadata = await metaFile.json();
		this.permissionsCheck(sourceMetadata);

		// Determine the parent folder
		const parentFolder = fileKey.includes("/")
			? fileKey.slice(0, fileKey.lastIndexOf("/"))
			: undefined;

		// Get unique display name for the copy
		const sourceName =
			sourceMetadata.name || fileKey.split("/").pop() || fileKey;
		const uniqueName = await this.getUniqueDisplayName(
			sourceName,
			parentFolder,
			"file",
		);

		// Generate new metadata for the duplicate
		const newMeta: FileMetadata = {
			...sourceMetadata,
			id: crypto.randomUUID(),
			name: uniqueName,
			createdAt: new Date(),
			isTrashed: false, // Duplicates are never trashed
			isStarred: false, // Don't copy starred status
		};

		// Construct destination paths
		const newFilePath = parentFolder
			? join(this.storagePath, parentFolder, newMeta.id)
			: join(this.storagePath, newMeta.id);
		const newMetaPath = `${newFilePath}.meta.json`;

		// Copy file content
		const fileContent = await Bun.file(currentPath).arrayBuffer();
		await Bun.write(newFilePath, fileContent);

		// Write metadata
		await Bun.write(newMetaPath, JSON.stringify(newMeta));

		await this.activityService.register({
			userId: this.user.id,
			action: "create",
			message: `Duplicated file "${sourceName}" as "${uniqueName}"`,
			level: "info",
		});

		// Return the new file item
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
	 * Move a folder to a different parent folder.
	 * @param folderKey - Current folder key (path)
	 * @param destinationFolder - Target parent folder path (empty string for root)
	 */
	public async moveFolder(
		folderKey: string,
		destinationFolder: string,
	): Promise<void> {
		// Normalize folder key (remove trailing slash)
		const normalizedKey = folderKey.endsWith("/")
			? folderKey.slice(0, -1)
			: folderKey;
		const folderPath = join(this.storagePath, normalizedKey);

		if (!existsSync(folderPath)) {
			throw new FileOrFolderNotFoundError("Folder not found");
		}

		// Get folder metadata
		const keepMetaPath = join(folderPath, ".keep.meta.json");
		let metadata: FileMetadata | undefined;
		if (existsSync(keepMetaPath)) {
			const loadedMeta: FileMetadata = await Bun.file(keepMetaPath).json();
			this.permissionsCheck(loadedMeta);
			metadata = loadedMeta;
		}

		const folderName =
			metadata?.name || normalizedKey.split("/").pop() || normalizedKey;

		// Ensure unique display name in destination
		const uniqueName = await this.getUniqueDisplayName(
			folderName,
			destinationFolder || undefined,
			"folder",
		);

		// Construct destination path
		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const physicalFolderName = normalizedKey.split("/").pop() || normalizedKey;
		const destPath = normalizedDest
			? join(this.storagePath, normalizedDest, physicalFolderName)
			: join(this.storagePath, physicalFolderName);

		// Prevent moving a folder into itself
		if (destPath.startsWith(folderPath)) {
			throw new Error("Cannot move a folder into itself");
		}

		// Ensure destination parent exists
		if (normalizedDest) {
			const destDir = join(this.storagePath, normalizedDest);
			if (!existsSync(destDir)) {
				await mkdir(destDir, { recursive: true });
			}
		}

		// Move the folder (rename)
		await fs.promises.rename(folderPath, destPath);

		// Update folder metadata with new name if deduplicated
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
	}

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
	 * Generates a unique display name by appending (1), (2), etc. if a file/folder
	 * with the same display name already exists in the target folder.
	 * Trashed items are ignored - they don't count as duplicates.
	 */
	private async getUniqueDisplayName(
		name: string,
		folder?: string,
		type: "file" | "folder" = "file",
	): Promise<string> {
		const existingItems = await this.abstractListFiles({
			parent: folder,
			includeTrashed: false,
		});

		// Get all display names of existing non-trashed items of the same type
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

		// Extract base name and extension for files
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

		// Find the next available number
		let counter = 1;
		let newName = `${baseName} (${counter})${extension}`;
		while (existingNames.has(newName.toLowerCase())) {
			counter++;
			newName = `${baseName} (${counter})${extension}`;
		}

		return newName;
	}

	private generateMeta(name: string): FileMetadata {
		return {
			id: crypto.randomUUID(),
			name,
			createdAt: new Date(),
			owner: this.user.id,
			category: this.determineCategory(name),
			contentType: this.determineContentType(name),
			isTrashed: false,
			isStarred: false,
		};
	}

	public async createFile(
		file: NewFile,
		folder?: string,
	): Promise<UploadResult> {
		// If folder is provided and file.name contains a path, use basename only
		const basename = file.name.includes("/")
			? file.name.split("/").pop() || file.name
			: file.name;
		const normalizedFolder = folder
			? folder.endsWith("/")
				? folder.slice(0, -1)
				: folder
			: undefined;
		// Generate unique display name to avoid confusion with duplicate names
		const uniqueName = await this.getUniqueDisplayName(
			basename,
			normalizedFolder,
			"file",
		);
		// Generate metadata using unique display name, but store by ID as filename
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
		return {
			id: meta.id,
			finalName: idFilePath, // Return full path so UI can upload body to correct location (ID-based)
			metadata: meta,
		};
	}

	public async uploadFileBody(
		key: string,
		body: Blob | Buffer | Uint8Array,
	): Promise<void> {
		try {
			await this.writeFile(key, body);
			const file = await this.getFile(key);
			const displayName = file.metadata.name || key;
			const category = this.determineCategory(displayName);
			const isMedia = category === "MUSIC" || category === "VIDEO";

			if (isMedia) {
				try {
					// Update metadata to set media duration
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
					// Continue without metadata - don't fail the upload
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

	public async listFolders(
		prefix: string,
		options?: { includeTrashed?: boolean; onlyTrashed?: boolean },
	): Promise<DirectoryList> {
		// Normalize prefix: '/' would reset to filesystem root with join()
		const normalizedPrefix = !prefix || prefix === "/" ? "" : prefix;
		const dirPath = join(this.storagePath, normalizedPrefix);
		const dir = await readdir(dirPath, { withFileTypes: true });
		if (!dir) {
			throw new Error("Directory not found");
		}

		const folders: string[] = [];

		for (const dirent of dir) {
			if (!dirent.isDirectory()) continue;
			// Hide system folders from listings
			if (dirent.name === ".trash" || dirent.name === ".thumbnails") continue;
			const folderName = dirent.name;
			const folderPath = join(dirPath, folderName);
			let isTrashed = false;
			try {
				// Prefer explicit folder meta file
				const metaFile = Bun.file(join(folderPath, ".keep.meta.json"));
				if (await metaFile.exists()) {
					const meta: FileMetadata = await metaFile.json();
					isTrashed = Boolean(meta.isTrashed);
				} else {
					// Fallback: some older folders may store JSON in `.keep`
					const keepFile = Bun.file(join(folderPath, ".keep"));
					if (await keepFile.exists()) {
						const text = await keepFile.text();
						try {
							const meta = JSON.parse(text) as Partial<FileMetadata>;
							if (meta && typeof meta.isTrashed === "boolean") {
								isTrashed = meta.isTrashed;
							}
						} catch {}
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
				// Default behavior: exclude trashed folders
				continue;
			}
			folders.push(folderName);
		}

		return folders;
	}

	/**
	 * List folders with their metadata (id, display name, path)
	 * Used for folder picker dialogs
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
				let displayName = folderId; // Default to ID if no metadata

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
							} catch {}
						}
					}
				} catch (err) {
					logger.warn("Failed to read folder meta:", folderPath, err);
				}

				// Apply trash filters
				if (options?.onlyTrashed && !isTrashed) continue;
				if (!options?.includeTrashed && isTrashed) continue;

				results.push({
					id: folderId,
					name: displayName,
					path: relativePath,
				});

				// Recursively collect child folders
				await collectFolders(relativePath);
			}
		};

		await collectFolders(prefix);
		return results;
	}

	private determineContentType(key: string): FileContentType {
		const extension = key.split(".").pop()?.toLowerCase();
		switch (extension) {
			// Images
			case "jpg":
			case "jpeg":
				return "image/jpeg";
			case "png":
				return "image/png";
			case "gif":
				return "image/gif";
			case "webp":
				return "image/webp";
			case "svg":
				return "image/svg+xml";
			case "bmp":
				return "image/bmp";
			case "ico":
				return "image/x-icon";
			case "tiff":
			case "tif":
				return "image/tiff";
			case "heic":
			case "heif":
				return "image/heic";
			// Video
			case "mp4":
			case "m4v":
				return "video/mp4";
			case "webm":
				return "video/webm";
			case "avi":
				return "video/x-msvideo";
			case "mkv":
				return "video/x-matroska";
			case "mov":
				return "video/quicktime";
			case "wmv":
				return "video/x-ms-wmv";
			case "flv":
				return "video/x-flv";
			case "mpeg":
			case "mpg":
				return "video/mpeg";
			case "3gp":
				return "video/3gpp";
			case "ogv":
				return "video/ogg";
			// Audio
			case "mp3":
				return "audio/mpeg";
			case "wav":
				return "audio/wav";
			case "flac":
				return "audio/flac";
			case "aac":
				return "audio/aac";
			case "ogg":
			case "opus":
				return "audio/ogg";
			case "m4a":
				return "audio/mp4";
			case "wma":
				return "audio/x-ms-wma";
			case "aiff":
				return "audio/aiff";
			// Documents
			case "pdf":
				return "application/pdf";
			case "doc":
				return "application/msword";
			case "docx":
				return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
			case "xls":
				return "application/vnd.ms-excel";
			case "xlsx":
				return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
			case "ppt":
				return "application/vnd.ms-powerpoint";
			case "pptx":
				return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
			case "odt":
				return "application/vnd.oasis.opendocument.text";
			case "rtf":
				return "application/rtf";
			case "csv":
				return "text/csv";
			case "epub":
				return "application/epub+zip";
			// Text/Code
			case "txt":
			case "md":
				return "text/plain";
			case "html":
			case "htm":
				return "text/html";
			case "css":
				return "text/css";
			case "js":
			case "mjs":
				return "application/javascript";
			case "json":
				return "application/json";
			case "xml":
				return "application/xml";
			case "yaml":
			case "yml":
				return "text/yaml";
			// Archives
			case "zip":
				return "application/zip";
			case "rar":
				return "application/vnd.rar";
			case "7z":
				return "application/x-7z-compressed";
			case "tar":
				return "application/x-tar";
			case "gz":
				return "application/gzip";
			default:
				return "application/octet-stream";
		}
	}

	private determineCategory(key: string): FileCategory {
		const extension = key.split(".").pop()?.toLowerCase();
		switch (extension) {
			// Music
			case "mp3":
			case "wav":
			case "flac":
			case "aac":
			case "ogg":
			case "wma":
			case "m4a":
			case "aiff":
			case "alac":
			case "opus":
				return "MUSIC";
			// Documents
			case "pdf":
			case "doc":
			case "docx":
			case "txt":
			case "rtf":
			case "odt":
			case "xls":
			case "xlsx":
			case "ppt":
			case "pptx":
			case "csv":
			case "md":
			case "epub":
			case "pages":
			case "numbers":
			case "keynote":
				return "DOCUMENTS";
			// Images
			case "jpg":
			case "jpeg":
			case "png":
			case "gif":
			case "svg":
			case "webp":
			case "bmp":
			case "ico":
			case "tiff":
			case "tif":
			case "heic":
			case "heif":
			case "raw":
			case "cr2":
			case "nef":
			case "arw":
			case "dng":
			case "psd":
			case "ai":
			case "eps":
				return "IMAGES";
			// Video
			case "mp4":
			case "avi":
			case "mkv":
			case "mov":
			case "wmv":
			case "flv":
			case "webm":
			case "m4v":
			case "mpeg":
			case "mpg":
			case "3gp":
			case "ogv":
			case "ts":
			case "mts":
			case "m2ts":
			case "vob":
				return "VIDEO";
			// Code
			case "js":
			case "py":
			case "java":
			case "c":
			case "cpp":
			case "h":
			case "hpp":
			case "cs":
			case "go":
			case "rs":
			case "rb":
			case "php":
			case "swift":
			case "kt":
			case "scala":
			case "sh":
			case "bash":
			case "zsh":
			case "ps1":
			case "sql":
			case "html":
			case "css":
			case "scss":
			case "sass":
			case "less":
			case "json":
			case "xml":
			case "yaml":
			case "yml":
			case "toml":
			case "ini":
			case "cfg":
			case "conf":
			case "env":
			case "dockerfile":
			case "makefile":
			case "cmake":
			case "gradle":
			case "jsx":
			case "tsx":
			case "vue":
			case "svelte":
			case "astro":
			case "lua":
			case "r":
			case "m":
			case "mm":
			case "pl":
			case "pm":
			case "ex":
			case "exs":
			case "erl":
			case "hrl":
			case "hs":
			case "elm":
			case "clj":
			case "cljs":
			case "lisp":
			case "scm":
			case "rkt":
			case "asm":
			case "s":
			case "v":
			case "sv":
			case "vhd":
			case "vhdl":
				return "CODE";
			default:
				return "UNKNOWN";
		}
	}

	public async abstractListFiles(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
		recursive?: boolean;
	}): Promise<ObjectList> {
		const prefix = options.parent || "";
		const dirPath = join(this.storagePath, prefix);
		const dir = await readdir(dirPath, { withFileTypes: true });
		if (!dir) {
			throw new Error("Directory not found");
		}

		let fileList: ObjectItem[] = [];

		for (const contents of dir) {
			const fullPath = join(dirPath, contents.name);

			// Skip if it's the user folder itself
			if (contents.name === this.userFolder) {
				continue;
			}

			// Hide system folders from listings
			if (
				contents.isDirectory() &&
				(contents.name === ".trash" || contents.name === ".thumbnails")
			) {
				continue;
			}

			// Include directories (suffix with '/')
			if (contents.isDirectory()) {
				// Try to get mtime for the directory if possible
				let updatedAt = new Date();
				try {
					const s = await stat(fullPath);
					updatedAt = new Date(s.mtimeMs);
				} catch {}

				// Read folder metadata to determine trash state
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
							} catch {}
						}
					}
				} catch (err) {
					logger.warn(
						"Failed to read folder meta while listing:",
						fullPath,
						err,
					);
				}

				// Exclude trashed folders unless includeTrashed is set
				if (!options.includeTrashed && metadata.isTrashed) {
					continue;
				}

				// If recursive mode, descend into subdirectory and collect files
				if (options.recursive) {
					const subPath = prefix ? `${prefix}/${contents.name}` : contents.name;
					const subResult = await this.abstractListFiles({
						parent: subPath,
						category: options.category,
						includeTrashed: options.includeTrashed,
						recursive: true,
					});
					// Prefix subfiles with the folder ID for key (API operations) and display name for parent (UI)
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

				fileList.push({
					key: `${contents.name}/`,
					size: 0,
					updatedAt,
					metadata,
					type: "folder",
				});

				continue;
			}

			// If it's a metadata file or .keep marker, skip it
			if (contents.name.endsWith(".meta.json") || contents.name === ".keep") {
				continue;
			}

			// Regular file - use fs.stat on the resolved fullPath so we get
			// the real size and mtime. The Dirent returned by readdir does
			// not include a parentPath, so using contents.parentPath was a
			// bug (it produced incorrect paths and zero sizes).
			let size = 0;
			let updatedAt = new Date();
			try {
				const s = await stat(fullPath);
				size = s.size;
				updatedAt = new Date(s.mtimeMs);
			} catch (err) {
				// If we can't stat the file, skip it
				logger.warn("Failed to stat file while listing:", fullPath, err);
				continue;
			}

			const fileMeta = Bun.file(`${fullPath}.meta.json`);
			let metadata: FileMetadata = this.generateMeta(contents.name);
			if (await fileMeta.exists()) {
				metadata = await fileMeta.json();
			}

			const fileObject: ObjectItem = {
				// Expose ID-based filename as key for operations; UI uses metadata.name for display
				key: contents.name,
				size,
				updatedAt,
				metadata,
				type: "file",
			};

			this.permissionsCheck(fileObject.metadata);

			fileList.push(fileObject);
		}

		// Sort files by name
		fileList.sort((a, b) => a.key.localeCompare(b.key));

		if (!options.includeTrashed) {
			// Exclude trashed files
			fileList = fileList.filter((item) => !item.metadata.isTrashed);
		}

		if (options.category) {
			fileList = fileList.filter((item) => {
				return item.metadata.category === options.category;
			});
		}

		return {
			list: fileList,
			count: fileList.length,
			total: fileList.length,
		};
	}

	public async listTrashFiles(): Promise<ObjectList> {
		const files = await this.abstractListFiles({ includeTrashed: true });
		const filtered = files.list.filter((item) => item.metadata.isTrashed);
		return {
			list: filtered,
			count: filtered.length,
			total: filtered.length,
		};
	}

	public async listFilesPerCategory(
		category: FileCategory,
	): Promise<ObjectList> {
		return await this.abstractListFiles({
			category,
			recursive: true,
		});
	}

	public async listFiles(prefix?: string): Promise<ObjectList> {
		// Ensure prefix ends with "/" if provided, to list contents inside the folder
		const normalizedPrefix =
			prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix;
		return await this.abstractListFiles({
			parent: normalizedPrefix,
		});
	}

	public async listRecentFiles(): Promise<ObjectList> {
		const allFiles = await this.abstractListFiles({ recursive: true });
		// Sort by updatedAt descending and take the top 10
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

		return {
			list: recentFiles,
			count: recentFiles.length,
			total: allFiles.total,
		};
	}

	public async listStarredFiles(): Promise<ObjectList> {
		const allFiles = await this.abstractListFiles({ recursive: true });
		const starredFiles = allFiles.list.filter(
			(item) => item.metadata.isStarred,
		);
		return {
			list: starredFiles,
			count: starredFiles.length,
			total: starredFiles.length,
		};
	}

	/**
	 * Search for files by name across all folders.
	 * Uses case-insensitive substring matching on display names.
	 * @param query - Search query string
	 * @param limit - Maximum number of results to return (default 50)
	 */
	public async searchFiles(query: string, limit = 50): Promise<ObjectList> {
		if (!query || query.trim().length === 0) {
			return { list: [], count: 0, total: 0 };
		}

		const searchTerm = query.toLowerCase().trim();
		const allFiles = await this.abstractListFiles({ recursive: true });

		// Filter files and folders by display name match
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

			// Sort folders before files, then by name
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

	private permissionsCheck(metadata: FileMetadata) {
		if (metadata.owner !== this.user.id) {
			throw new UnauthorizedError("Unauthorized access to file");
		}
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
		// Cache control
		newHeaders.append("Cache-Control", "public, max-age=31536000, immutable");
		newHeaders.append("Content-Length", file.size.toString());
		return newHeaders;
	}

	public async getRawFileData(
		key: string,
	): Promise<{ file: BunFile; meta: ObjectItem } | null> {
		const { currentPath } = await this.resolveFileLocation(key);
		const file = Bun.file(currentPath);
		const meta = await this.getFile(key);
		return { file, meta };
	}

	/**
	 * Generates a thumbnail for an image or video file.
	 * Thumbnails are cached in a .thumbnails directory adjacent to the file.
	 * @param key The file key
	 * @param size The maximum dimension (width or height) of the thumbnail. Default 300.
	 * @returns The thumbnail as a Buffer, or null if generation fails
	 */
	public async getThumbnail(
		key: string,
		size = 300,
	): Promise<{ buffer: Buffer; contentType: string } | null> {
		try {
			const { currentPath } = await this.resolveFileLocation(key);
			const meta = await this.getFile(key);

			const imageTypes = [
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/webp",
				"image/bmp",
				"image/tiff",
			];

			const videoTypes = [
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
			];

			const contentType = meta.metadata.contentType || "";
			const isImage = imageTypes.includes(contentType);
			const isVideo = videoTypes.includes(contentType);

			if (!isImage && !isVideo) {
				return null;
			}

			// Cache directory for thumbnails
			const thumbDir = join(this.storagePath, ".thumbnails");
			const thumbPath = join(thumbDir, `${key}_${size}.webp`);

			// Check if cached thumbnail exists and is newer than source
			if (existsSync(thumbPath)) {
				const thumbStat = await stat(thumbPath);
				const fileStat = await stat(currentPath);
				if (thumbStat.mtime >= fileStat.mtime) {
					const cached = await Bun.file(thumbPath).arrayBuffer();
					return { buffer: Buffer.from(cached), contentType: "image/webp" };
				}
			}

			// Generate thumbnail
			await mkdir(thumbDir, { recursive: true });

			let thumbnail: Buffer;

			if (isImage) {
				thumbnail = await sharp(currentPath)
					.resize(size, size, {
						fit: "inside",
						withoutEnlargement: true,
					})
					.webp({ quality: 80 })
					.toBuffer();
			} else {
				// Video thumbnail: extract frame at 1 second using ffmpeg
				thumbnail = await this.generateVideoThumbnail(
					currentPath,
					thumbPath,
					size,
				);
			}

			// Cache the thumbnail
			await Bun.write(thumbPath, thumbnail);

			return { buffer: thumbnail, contentType: "image/webp" };
		} catch (error) {
			logger.error("Error generating thumbnail:", error);
			return null;
		}
	}

	/**
	 * Generates a thumbnail from a video file using ffmpeg.
	 * Extracts a frame at 1 second (or first frame if video is shorter).
	 */
	private async generateVideoThumbnail(
		videoPath: string,
		outputPath: string,
		size: number,
	): Promise<Buffer> {
		// Use ffmpeg to extract a frame and pipe to sharp for resizing
		// First, extract a frame as a temporary PNG
		const tempPng = `${outputPath}.tmp.png`;

		try {
			// Extract frame at 1 second (or beginning if shorter)
			const result = await Bun.spawn([
				"ffmpeg",
				"-y", // Overwrite output
				"-ss",
				"1", // Seek to 1 second
				"-i",
				videoPath,
				"-vframes",
				"1", // Extract 1 frame
				"-vf",
				`scale=${size}:${size}:force_original_aspect_ratio=decrease`,
				tempPng,
			]).exited;

			if (result !== 0) {
				// Try extracting from the beginning if 1 second seek failed
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

			// Convert PNG to WebP using sharp
			const thumbnail = await sharp(tempPng).webp({ quality: 80 }).toBuffer();

			// Clean up temp file
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}

			return thumbnail;
		} catch (error) {
			// Clean up temp file on error
			try {
				await unlink(tempPng);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	public async deleteFile(key: string): Promise<void> {
		try {
			const { currentPath: filePath } = await this.resolveFileLocation(key);
			const file = Bun.file(filePath);

			const metaPath = `${filePath}.meta.json`;
			const metaFile = Bun.file(metaPath);
			if (await metaFile.exists()) {
				// Runs permissions check as well
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

			// Delete any cached thumbnails
			await this.deleteThumbnails(key);
		} catch (error) {
			logger.error("Error deleting file:", error);
			throw new Error(`Error deleting file with key: ${key}`);
		}
	}

	/**
	 * Deletes all cached thumbnails for a given file key
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
			// Non-critical, just log
			logger.warn("Error deleting thumbnails:", error);
		}
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
		} catch (error) {
			logger.error("Error deleting folder:", error);
			throw new Error(`Error deleting folder with key: ${key}`);
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
			// Skip metadata files
			if (entry.name.endsWith(".meta.json")) continue;
			results.push(fullPath);
		}
		return results;
	}

	public async trashFolder(key: string): Promise<void> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		const exists = existsSync(dirPath);
		if (!exists) {
			throw new Error("Folder not found");
		}

		// Mark all files within the folder as trashed (metadata-only)
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

		// Mark the folder itself as trashed
		await this.updateFolderMeta(folderPrefix, { isTrashed: true });

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Moved folder to trash: ${folderPrefix}`,
			level: "info",
		});
	}

	public getFullFolderPath(id: string, parentId?: string): string {
		const folderPrefix = id.endsWith("/") ? id : `${id}/`;
		if (parentId) {
			const parentPrefix = parentId.endsWith("/") ? parentId : `${parentId}/`;
			return `${parentPrefix}${folderPrefix}`;
		}
		return folderPrefix;
	}

	public async restoreFolder(key: string): Promise<void> {
		const folderPrefix = key.endsWith("/") ? key : `${key}/`;
		const dirPath = join(this.storagePath, folderPrefix);
		const exists = existsSync(dirPath);
		if (!exists) {
			throw new Error("Folder not found");
		}

		// Mark all files within the folder as restored (metadata-only)
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

		// Mark the folder itself as restored
		await this.updateFolderMeta(folderPrefix, { isTrashed: false });

		await this.activityService.register({
			userId: this.user.id,
			action: "update",
			message: `Restored folder from trash: ${folderPrefix}`,
			level: "info",
		});
	}

	public async incrementFolderName(
		name: string,
		parent?: string,
	): Promise<string> {
		// Deprecated: folders are stored by unique ID; collisions are impossible.
		const parentPrefix = parent ? `${parent}/` : "";
		return `${parentPrefix}${name}`;
	}

	public async createFolder(name: string, parent?: string): Promise<void> {
		logger.info(`Creating folder: name=${name}, parent=${parent}`);

		// Store folders by ID; keep display name in metadata
		const normalizedParent = parent
			? parent.endsWith("/")
				? parent.slice(0, -1)
				: parent
			: undefined;
		// Generate unique display name to avoid confusion with duplicate names
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
			// Ensure the folder exists
			await mkdir(folderPath);
			// Create a .keep file and a folder metadata file
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
		} catch (error) {
			logger.error("Error creating folder:", error);
			throw new Error("Failed to create folder");
		}
	}

	public async updateFolderMeta(
		id: string,
		data: { isTrashed?: boolean; tags?: string[]; name?: string },
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

		// Update allowed fields
		if (typeof data.isTrashed === "boolean") {
			metadata.isTrashed = data.isTrashed;
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
	}

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
}
