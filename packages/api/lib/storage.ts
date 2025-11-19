import {
	copyFile,
	exists,
	mkdir,
	readdir,
	rmdir,
	stat,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import { registerActivity } from "@lib/activity";
import { user } from "@lib/db/schema";
import { FileNotFoundError, UnauthorizedError } from "@lib/errors";
import { logger } from "@lib/logger";
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
} from "@lib/schema";
import type { User } from "better-auth";
import type { BunFile } from "bun";
import { parseFile } from "music-metadata";

export async function cleanupDeletedUserStorage() {
	const usersList = await db.select().from(user);
	if (usersList.length === 0) {
		logger.info("No users found in database. Skipping storage cleanup.");
		return;
	}

	const storageBasePath = resolve(
		Bun.env.STORAGE_PATH || join(cwd(), "/data/storage"),
	);
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

export class StorageService {
	private storagePath: string;
	private userFolder: string;
	private user: User;

	constructor(user: User) {
		this.userFolder = `user-${user.id}`;

		this.storagePath = join(
			cwd(),
			resolve(Bun.env.STORAGE_PATH || "/data/storage"),
			this.userFolder,
		);

		logger.info(`Using storage path: ${this.storagePath}`);

		this.user = user;
	}

	public async ensureUserDirectory() {
		try {
			if (!(await exists(this.storagePath))) {
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

	public async getFile(path: string): Promise<ObjectItem> {
		const filePath = join(this.storagePath, path);
		const file = Bun.file(filePath);
		if (!(await file.exists()) || !file.name) {
			throw new FileNotFoundError("File not found");
		}

		const fileMeta = Bun.file(`${filePath}.meta.json`);
		if (!(await fileMeta.exists())) {
			const metadata = this.generateMeta(file.name);
			await this.writeFile(path, undefined, metadata);
		}

		const metadata = await Bun.file(`${filePath}.meta.json`).json();
		this.permissionsCheck(metadata);

		const sanitizedNameWithoutFullPath =
			file.name.split("/").pop() || file.name;
		return {
			key: sanitizedNameWithoutFullPath,
			size: file.size,
			type: "file",
			updatedAt: new Date(file.lastModified),
			metadata: metadata,
		};
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
			await registerActivity({
				userId: this.user.id,
				action: "update",
				message: `Updated metadata for file: ${path}`,
				level: "info",
			});
		}
	}

	public async updateFile(name: string, data: UpdateFile): Promise<void> {
		// Get the existing object
		const file = await this.getFile(name);
		if (!(await this.fileExists(name))) {
			throw new Error("File not found");
		}
		// Update metadata
		if (data.contentType !== undefined) {
			file.metadata.contentType = data.contentType;
		}
		if (data.category !== undefined) {
			file.metadata.category = data.category;
		}
		if (data.tags !== undefined) {
			file.metadata.tags = data.tags;
		}
		if (data.isTrashed !== undefined) {
			file.metadata.isTrashed = data.isTrashed;
		}
		let finalName = name;
		if (data.key) {
			const newName = data.key;
			const existingFile = await this.getFile(newName).catch(() => null);
			if (existingFile) {
				throw new Error("A file with the new name already exists");
			}
			// Rename the file by copying and deleting the old one
			const oldFilePath = join(this.storagePath, name);
			const newFilePath = join(this.storagePath, newName);
			await copyFile(oldFilePath, newFilePath);
			await Bun.file(oldFilePath).delete();
			// Also rename the metadata file
			const oldMetaPath = join(this.storagePath, `${name}.meta.json`);
			const newMetaPath = join(this.storagePath, `${newName}.meta.json`);
			await copyFile(oldMetaPath, newMetaPath);
			await Bun.file(oldMetaPath).delete();
			finalName = newName;
		}
		await this.writeFile(finalName, undefined, file.metadata);
	}

	public async fileExists(key: string): Promise<boolean> {
		try {
			const filePath = join(this.storagePath, key);
			const file = Bun.file(filePath);
			if (!(await file.exists())) {
				return false;
			}
			return true;
		} catch {
			return false;
		}
	}

	private async incrementFileName(name: string): Promise<string> {
		// If the file exists, increment a counter until we find a free name
		let counter = 1;
		let newName = name;
		while (true) {
			try {
				if (!(await this.fileExists(newName))) {
					return newName;
				}
				// File exists, increment counter
				const dotIndex = name.lastIndexOf(".");
				if (dotIndex === -1) {
					newName = `${name}(${counter})`;
				} else {
					const baseName = name.substring(0, dotIndex);
					const extension = name.substring(dotIndex);
					newName = `${baseName}(${counter})${extension}`;
				}
				counter++;
			} catch {
				// File does not exist
				return newName;
			}
		}
	}

	private generateMeta(name: string): FileMetadata {
		return {
			id: crypto.randomUUID(),
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
		const finalName = await this.incrementFileName(file.name);
		const filePath = folder ? `${folder}/${finalName}` : finalName;
		const meta = this.generateMeta(finalName);
		await this.writeFile(filePath, new Uint8Array(), meta, file.size);
		await registerActivity({
			userId: this.user.id,
			action: "create",
			message: `Created file: ${finalName}`,
			level: "info",
		});
		return {
			id: meta.id,
			finalName: filePath, // Return full path so UI can upload body to correct location
			metadata: meta,
		};
	}

	public async uploadFileBody(
		key: string,
		body: Blob | Buffer | Uint8Array,
	): Promise<void> {
		try {
			await this.writeFile(key, body);
			const category = this.determineCategory(key);
			const isMedia = category === "MUSIC" || category === "VIDEO";

			if (isMedia) {
				try {
					// Update metadata to set media duration
					const mediaMeta = await parseFile(join(this.storagePath, key));
					const duration = mediaMeta.format.duration || 0;
					const file = await this.getFile(key);

					if (category === "MUSIC") {
						if (!file.metadata.music) {
							file.metadata.music = {};
						}
						file.metadata.music.duration = duration;
					} else if (category === "VIDEO") {
						if (!file.metadata.video) {
							file.metadata.video = {};
						}
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
			await registerActivity({
				userId: this.user.id,
				action: "update",
				message: `Failed to upload file body for key: ${key}`,
				level: "error",
			});
			throw new Error(`Error uploading file body for key: ${key}`);
		}
	}

	public async listFolders(prefix: string): Promise<DirectoryList> {
		const dirPath = join(this.storagePath, prefix);
		const dir = await readdir(dirPath, { withFileTypes: true });
		if (!dir) {
			throw new Error("Directory not found");
		}

		const folders = dir
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

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

			// Include directories (suffix with '/')
			if (contents.isDirectory()) {
				// Try to get mtime for the directory if possible
				let updatedAt = new Date();
				try {
					const s = await stat(fullPath);
					updatedAt = new Date(s.mtimeMs);
				} catch {}

				const metadata: FileMetadata = this.generateMeta(contents.name);

				fileList.push({
					key: `${contents.name}/`,
					size: 0,
					updatedAt,
					metadata,
					type: "folder",
				});

				continue;
			}

			// If it's a metadata file, skip it
			if (contents.name.endsWith(".meta.json")) {
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
			.sort(
				(a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0),
			)
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
		const filePath = join(this.storagePath, key);
		const file = Bun.file(filePath);
		if (!(await file.exists())) {
			throw new FileNotFoundError("File not found");
		}
		const meta = await this.getFile(key);
		return { file, meta };
	}

	public async deleteFile(key: string): Promise<void> {
		try {
			const filePath = join(this.storagePath, key);
			const file = Bun.file(filePath);

			if (!(await file.exists())) {
				throw new Error("File not found");
			}

			const metaPath = join(this.storagePath, `${key}.meta.json`);
			const metaFile = Bun.file(metaPath);
			if (await metaFile.exists()) {
				// Runs permissions check as well
				await this.getFile(key);

				await metaFile.delete();
				await registerActivity({
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
			const dir = await exists(dirPath);
			if (!dir) {
				return false;
			}

			return true;
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
			await registerActivity({
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

	public async incrementFolderName(
		name: string,
		parent?: string,
	): Promise<string> {
		// If the folder exists, increment a counter until we find a free name
		let counter = 1;
		let newName = name;
		const parentPrefix = parent ? `${parent}/` : "";
		while (true) {
			try {
				if (!(await this.folderExists(`${parentPrefix}${newName}`))) {
					return `${parentPrefix}${newName}`;
				}
				// Folder exists, increment counter
				newName = `${name} (${counter})`;
				counter++;
			} catch {
				// Folder does not exist
				return `${parentPrefix}${newName}`;
			}
		}
	}

	public async createFolder(name: string, parent?: string): Promise<void> {
		logger.info(`Creating folder: name=${name}, parent=${parent}`);

		// Get the incremented folder name with the parent context
		const folderKey = await this.incrementFolderName(name, parent);
		const folderPath = join(this.storagePath, folderKey);

		try {
			// Create a .keep file to ensure the folder exists
			await mkdir(folderPath);
			await registerActivity({
				userId: this.user.id,
				action: "create",
				message: `Created folder: ${folderKey}`,
				level: "info",
			});
			logger.info(`Folder created at path: ${folderPath}`);
		} catch (error) {
			logger.error("Error creating folder:", error);
			throw new Error("Failed to create folder");
		}
	}
}
