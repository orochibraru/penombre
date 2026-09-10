/**
 * Per-file operations: create, read, update, move, duplicate and delete.
 *
 * Metadata lives in PostgreSQL and the bytes live behind the StorageDriver, so
 * every mutation touches both and then drops the cached listings.
 */

import { unlink } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { parseFile } from "music-metadata";
import { Logger } from "$lib/logger";
import { files } from "$lib/server/db/schema";
import { FileOrFolderNotFoundError } from "$lib/server/errors";
import type {
	FileMetadata,
	NewFile,
	ObjectItem,
	UpdateFile,
	UploadResult,
} from "$lib/server/schema";
import type { StorageContext } from "./context";
import { getFolderIdByPath, getUniqueDisplayName } from "./lookups";
import {
	determineCategory,
	determineContentType,
	extractExtension,
	fileDbToMetadata,
	fileDbToObjectItem,
	generateFileNameWithExtension,
} from "./mappers";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("StorageService");

export class FileOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
	) {}

	async getFile(path: string): Promise<ObjectItem> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, path), eq(files.ownerId, this.ctx.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${path}`);
		}
		return fileDbToObjectItem(file);
	}

	async writeFile(
		path: string,
		contents?: Blob | Buffer | Uint8Array,
		metadata?: FileMetadata,
		size?: number,
	): Promise<void> {
		if (contents) {
			await this.ctx.driver.writeObject(path, contents);
		} else if (!(await this.fileExists(path))) {
			await this.ctx.driver.writeObject(path, new Uint8Array(size ?? 0));
		}

		if (metadata) {
			await this.ctx.db
				.update(files)
				.set({
					name: metadata.name ?? undefined,
					contentType: metadata.contentType,
					category: metadata.category,
					tags: metadata.tags ?? [],
					isTrashed: metadata.isTrashed,
					isStarred: metadata.isStarred,
					musicDuration: metadata.music?.duration ?? null,
					videoDuration: metadata.video?.duration ?? null,
					updatedAt: new Date(),
				})
				.where(and(eq(files.path, path), eq(files.ownerId, this.ctx.user.id)));
		}

		await this.ctx.invalidateListingCaches();
	}

	async updateFile(name: string, data: UpdateFile): Promise<void> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, name), eq(files.ownerId, this.ctx.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${name}`);
		}

		const updates: Partial<typeof files.$inferInsert> = {
			updatedAt: new Date(),
		};
		if (data.contentType !== undefined) {
			updates.contentType = data.contentType;
		}
		if (data.category !== undefined) {
			updates.category = data.category;
		}
		if (data.tags !== undefined) {
			updates.tags = data.tags;
		}
		if (typeof data.isTrashed === "boolean") {
			updates.isTrashed = data.isTrashed;
		}
		if (typeof data.isStarred === "boolean") {
			updates.isStarred = data.isStarred;
		}
		if (data.key && data.key.trim().length > 0) {
			const newName = data.key.trim();
			updates.name = newName;
			updates.contentType = determineContentType(newName);
			updates.category = determineCategory(newName);
		}

		await this.ctx.db
			.update(files)
			.set(updates)
			.where(and(eq(files.path, name), eq(files.ownerId, this.ctx.user.id)));

		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "update",
			message: `Updated metadata for file: ${name}`,
			level: "info",
		});

		await this.ctx.invalidateListingCaches();
	}

	async moveFile(fileKey: string, destinationFolder: string): Promise<void> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, fileKey), eq(files.ownerId, this.ctx.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${fileKey}`);
		}

		const uniqueName = await getUniqueDisplayName(
			this.ctx,
			file.name,
			destinationFolder || undefined,
			"file",
		);

		const currentFileName = fileKey.includes("/")
			? (fileKey.split("/").pop() ?? fileKey)
			: fileKey;
		const extension = extractExtension(currentFileName);
		const newUUID = crypto.randomUUID();
		const newFileName = extension ? `${newUUID}.${extension}` : newUUID;

		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const newPath = normalizedDest
			? `${normalizedDest}/${newFileName}`
			: newFileName;

		await this.ctx.driver.copyObject(fileKey, newPath);
		await this.ctx.driver.deleteObject(fileKey);

		const newFolderId = normalizedDest
			? await getFolderIdByPath(this.ctx, normalizedDest)
			: null;

		await this.ctx.db
			.update(files)
			.set({
				path: newPath,
				name: uniqueName,
				folderId: newFolderId,
				updatedAt: new Date(),
			})
			.where(and(eq(files.id, file.id), eq(files.ownerId, this.ctx.user.id)));

		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "update",
			message: `Moved file "${uniqueName}" to ${normalizedDest || "root"}`,
			level: "info",
		});

		await this.ctx.invalidateListingCaches();
	}

	async duplicateFile(fileKey: string): Promise<ObjectItem> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, fileKey), eq(files.ownerId, this.ctx.user.id)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${fileKey}`);
		}

		const parentFolder = fileKey.includes("/")
			? fileKey.slice(0, fileKey.lastIndexOf("/"))
			: undefined;

		const uniqueName = await getUniqueDisplayName(
			this.ctx,
			file.name,
			parentFolder,
			"file",
		);

		const newFileNameWithExt = generateFileNameWithExtension(uniqueName);
		const newPath = parentFolder
			? `${parentFolder}/${newFileNameWithExt}`
			: newFileNameWithExt;

		await this.ctx.driver.copyObject(fileKey, newPath);

		const newId = crypto.randomUUID();
		const [newFile] = await this.ctx.db
			.insert(files)
			.values({
				id: newId,
				name: uniqueName,
				ownerId: this.ctx.user.id,
				path: newPath,
				folderId: file.folderId,
				contentType: file.contentType,
				category: file.category,
				size: file.size,
				isTrashed: false,
				isStarred: false,
				tags: [],
				musicDuration: file.musicDuration,
				videoDuration: file.videoDuration,
			})
			.returning();

		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "create",
			message: `Duplicated file "${file.name}" as "${uniqueName}"`,
			level: "info",
		});

		if (!newFile) {
			throw new Error("Failed to insert duplicated file into database");
		}
		await this.ctx.invalidateListingCaches();
		return fileDbToObjectItem(newFile);
	}

	async createFile(file: NewFile, folder?: string): Promise<UploadResult> {
		const name = file.name.includes("/")
			? (file.name.split("/").pop() ?? file.name)
			: file.name;
		const normalizedFolder = folder
			? folder.endsWith("/")
				? folder.slice(0, -1)
				: folder
			: undefined;

		const uniqueName = await getUniqueDisplayName(
			this.ctx,
			name,
			normalizedFolder,
			"file",
		);

		const fileNameWithExt = generateFileNameWithExtension(uniqueName);
		const filePath = normalizedFolder
			? `${normalizedFolder}/${fileNameWithExt}`
			: fileNameWithExt;

		const folderId = normalizedFolder
			? await getFolderIdByPath(this.ctx, normalizedFolder)
			: null;

		const id = crypto.randomUUID();
		const [newFile] = await this.ctx.db
			.insert(files)
			.values({
				id,
				name: uniqueName,
				ownerId: this.ctx.user.id,
				path: filePath,
				folderId,
				contentType: determineContentType(uniqueName),
				category: determineCategory(uniqueName),
				size: file.size,
				isTrashed: false,
				isStarred: false,
				tags: [],
			})
			.returning();

		await this.ctx.driver.writeObject(filePath, new Uint8Array());

		if (!newFile) {
			throw new Error("Failed to insert file into database");
		}
		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "create",
			message: `Created file: ${name}`,
			level: "info",
		});

		await this.ctx.invalidateListingCaches();

		return {
			id: newFile.id,
			finalName: filePath,
			metadata: fileDbToMetadata(newFile),
		};
	}

	async createBatchFiles(
		fileList: NewFile[],
		folder?: string,
	): Promise<UploadResult[]> {
		const results: UploadResult[] = [];
		const normalizedFolder = folder
			? folder.endsWith("/")
				? folder.slice(0, -1)
				: folder
			: undefined;

		const folderId = normalizedFolder
			? await getFolderIdByPath(this.ctx, normalizedFolder)
			: null;

		for (const file of fileList) {
			const name = file.name.includes("/")
				? (file.name.split("/").pop() ?? file.name)
				: file.name;
			const uniqueName = await getUniqueDisplayName(
				this.ctx,
				name,
				normalizedFolder,
				"file",
			);
			const fileNameWithExt = generateFileNameWithExtension(uniqueName);
			const filePath = normalizedFolder
				? `${normalizedFolder}/${fileNameWithExt}`
				: fileNameWithExt;

			const id = crypto.randomUUID();
			const [newFile] = await this.ctx.db
				.insert(files)
				.values({
					id,
					name: uniqueName,
					ownerId: this.ctx.user.id,
					path: filePath,
					folderId,
					contentType: determineContentType(uniqueName),
					category: determineCategory(uniqueName),
					size: file.size,
					isTrashed: false,
					isStarred: false,
					tags: [],
				})
				.returning();

			await this.ctx.driver.writeObject(filePath, new Uint8Array());

			if (!newFile) {
				throw new Error("Failed to insert file into database");
			}
			results.push({
				id: newFile.id,
				finalName: filePath,
				metadata: fileDbToMetadata(newFile),
			});
		}

		const fileCount = fileList.length;
		const folderDisplay = normalizedFolder || "root";
		await this.ctx.activityService.register({
			userId: this.ctx.user.id,
			action: "create",
			message: `Created ${fileCount} file${fileCount === 1 ? "" : "s"} in ${folderDisplay}`,
			level: "info",
		});

		await this.ctx.invalidateListingCaches();
		return results;
	}

	async findFileById(id: string): Promise<string | null> {
		const [file] = await this.ctx.db
			.select({ path: files.path })
			.from(files)
			.where(and(eq(files.id, id), eq(files.ownerId, this.ctx.user.id)));
		return file?.path ?? null;
	}

	async uploadFileBody(
		id: string,
		body: Blob | Buffer | Uint8Array,
	): Promise<void> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.id, id), eq(files.ownerId, this.ctx.user.id)));
		if (!file) {
			throw new Error(`Failed to find file with id: ${id}`);
		}

		const key = file.path;
		try {
			let data: Uint8Array;
			let actualSize: number;
			if (body instanceof Uint8Array) {
				data = body;
				actualSize = body.byteLength;
			} else if (Buffer.isBuffer(body)) {
				data = new Uint8Array(body);
				actualSize = body.length;
			} else {
				const ab = await (body as Blob).arrayBuffer();
				data = new Uint8Array(ab);
				actualSize = ab.byteLength;
			}

			await this.ctx.driver.writeObject(key, data);

			const updates: Partial<typeof files.$inferInsert> = {
				size: actualSize,
				updatedAt: new Date(),
			};

			const category = determineCategory(file.name);
			const isMedia = category === "MUSIC" || category === "VIDEO";
			if (isMedia) {
				try {
					const { path: localPath, isTemp } =
						await this.thumbnails.getLocalOrTempPath(key);
					const mediaMeta = await parseFile(localPath);
					const duration = mediaMeta.format.duration ?? 0;
					if (category === "MUSIC") {
						updates.musicDuration = duration;
					} else {
						updates.videoDuration = duration;
					}
					if (isTemp) {
						try {
							await unlink(localPath);
						} catch {
							// best-effort cleanup of the temp file
						}
					}
				} catch (metaError) {
					logger.warn(
						`Failed to extract media metadata for ${key}:`,
						metaError,
					);
				}
			}

			await this.ctx.db
				.update(files)
				.set(updates)
				.where(and(eq(files.id, id), eq(files.ownerId, this.ctx.user.id)));
		} catch (error) {
			logger.error("Error uploading file body:", error);
			await this.ctx.activityService.register({
				userId: this.ctx.user.id,
				action: "update",
				message: `Failed to upload file body for id: ${id}`,
				level: "error",
			});
			throw new Error(`Error uploading file body for id: ${id}`);
		}
	}

	async deleteFile(key: string): Promise<void> {
		try {
			const [file] = await this.ctx.db
				.select()
				.from(files)
				.where(and(eq(files.path, key), eq(files.ownerId, this.ctx.user.id)));

			if (file) {
				await this.ctx.db
					.delete(files)
					.where(
						and(eq(files.id, file.id), eq(files.ownerId, this.ctx.user.id)),
					);
				await this.ctx.activityService.register({
					userId: this.ctx.user.id,
					action: "delete",
					message: `Deleted file: ${key}`,
					level: "info",
				});
			}

			await this.ctx.driver.deleteObject(key);
			await this.thumbnails.deleteThumbnails(key);
			await this.ctx.invalidateListingCaches();
		} catch (error) {
			logger.error("Error deleting file:", error);
			throw new Error(`Error deleting file with key: ${key}`);
		}
	}

	async fileExists(key: string): Promise<boolean> {
		const [file] = await this.ctx.db
			.select({ id: files.id })
			.from(files)
			.where(and(eq(files.path, key), eq(files.ownerId, this.ctx.user.id)));
		return !!file;
	}

	async fileExistsById(id: string): Promise<boolean> {
		const [file] = await this.ctx.db
			.select({ id: files.id })
			.from(files)
			.where(and(eq(files.id, id), eq(files.ownerId, this.ctx.user.id)));
		return !!file;
	}

	async getRawFileData(key: string): Promise<{
		buffer: ArrayBuffer;
		meta: ObjectItem;
		size: number;
		mtime: number;
	} | null> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, key), eq(files.ownerId, this.ctx.user.id)));
		if (!file) {
			return null;
		}
		const buffer = await this.ctx.driver.readObject(key);
		return {
			buffer,
			meta: fileDbToObjectItem(file),
			size: file.size,
			mtime: file.updatedAt.getTime(),
		};
	}
}
