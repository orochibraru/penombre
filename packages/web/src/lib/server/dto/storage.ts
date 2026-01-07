import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readdir, rmdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import type { User } from "better-auth";
import type { BunFile } from "bun";
import { parseFile } from "music-metadata";
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

	public async fileExists(key: string): Promise<boolean> {
		try {
			const filePath = join(this.storagePath, key);
			const file = Bun.file(filePath);
			return await file.exists();
		} catch {
			return false;
		}
	}

	// Removed incrementFileName: files are stored by unique ID to prevent name collisions.

	private generateMeta(name: string): FileMetadata {
		return {
			id: crypto.randomUUID(),
			name,
			createdAt: new Date(),
			owner: this.user.id,
			category: this.determineCategory(name),
			contentType: this.determineContentType(name),
			isTrashed: false,
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
		// Generate metadata using pretty basename, but store by ID as filename
		const meta = this.generateMeta(basename);
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
			// Hide legacy `.trash` folder from listings
			if (dirent.name === ".trash") continue;
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

	private determineContentType(key: string): FileContentType {
		const extension = key.split(".").pop()?.toLowerCase();
		switch (extension) {
			case "jpg":
			case "jpeg":
				return "image/jpeg";
			case "png":
				return "image/png";
			case "gif":
				return "image/gif";
			case "mp4":
				return "video/mp4";
			case "mp3":
				return "audio/mpeg";
			case "wav":
				return "audio/wav";
			case "flac":
				return "audio/flac";
			case "pdf":
				return "application/pdf";
			case "txt":
				return "text/plain";
			case "html":
				return "text/html";
			case "json":
				return "application/json";
			default:
				return "application/octet-stream";
		}
	}

	private determineCategory(key: string): FileCategory {
		const extension = key.split(".").pop()?.toLowerCase();
		switch (extension) {
			case "mp3":
			case "wav":
			case "flac":
				return "MUSIC";
			case "pdf":
			case "doc":
			case "docx":
			case "txt":
				return "DOCUMENTS";
			case "jpg":
			case "jpeg":
			case "png":
			case "gif":
			case "svg":
				return "IMAGES";
			case "mp4":
			case "avi":
			case "mkv":
			case "mov":
				return "VIDEO";
			case "js":
			case "ts":
			case "py":
			case "java":
			case "c":
			case "cpp":
				return "CODE";
			default:
				return "UNKNOWN";
		}
	}

	public async abstractListFiles(options: {
		parent?: string;
		category?: FileCategory;
		includeTrashed?: boolean;
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

			// Hide legacy `.trash` folder from listings
			if (contents.isDirectory() && contents.name === ".trash") {
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
		const allFiles = await this.abstractListFiles({});
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
			.slice(0, 10);

		return {
			list: recentFiles,
			count: recentFiles.length,
			total: allFiles.total,
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
		} catch (error) {
			logger.error("Error deleting file:", error);
			throw new Error(`Error deleting file with key: ${key}`);
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
		const folderMeta: FileMetadata = this.generateMeta(name);
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
		name: string,
		data: { isTrashed?: boolean; tags?: string[] },
	): Promise<void> {
		const folderPrefix = name.endsWith("/") ? name : `${name}/`;
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
