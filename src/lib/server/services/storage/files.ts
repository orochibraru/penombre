/**
 * Per-file operations: create, read, update, move, duplicate and delete.
 *
 * Metadata lives in PostgreSQL and the bytes live behind the StorageDriver, so
 * every mutation touches both and then drops the cached listings.
 */

import { utimes } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { type File as DbFile, files } from "#lib/server/db/schema.js";
import { FileOrFolderNotFoundError } from "#lib/server/errors.js";
import type {
	FileMetadata,
	NewFile,
	ObjectItem,
	UpdateFile,
	UploadResult,
} from "#lib/server/schema.js";
import type { StorageContext } from "./context";
import { purgeGrantsFor } from "./grants";
import {
	diskName,
	findLiveSibling,
	getFolderIdByPath,
	getUniqueDisplayName,
} from "./lookups";
import {
	determineCategory,
	determineContentType,
	extractExtension,
	fileDbToMetadata,
	fileDbToObjectItem,
	generateFileNameWithExtension,
} from "./mappers";
import { ownedFiles } from "./scope";
import type { ThumbnailService } from "./thumbnails";
import { renameOnDisk } from "./uuid-names";
import { afterWrite, VersionOperations } from "./version-ops";
import { adminVersioning, dropVersionBytes, versioningAt } from "./versions";

const logger = new Logger("StorageService");

/** Where `importFile` decided a copy lands, and the row it would get. */
export interface PlannedImport {
	filePath: string;
	values: typeof files.$inferInsert;
}

export class FileOperations {
	private readonly versions: VersionOperations;

	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
	) {
		this.versions = new VersionOperations(ctx, thumbnails);
	}

	async getFile(path: string): Promise<ObjectItem> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, path), ownedFiles(this.ctx)));
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
				.where(and(eq(files.path, path), ownedFiles(this.ctx)));
		}

		await this.ctx.invalidateListingCaches();
	}

	async updateFile(name: string, data: UpdateFile): Promise<void> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, name), ownedFiles(this.ctx)));
		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${name}`);
		}

		const updates: Partial<typeof files.$inferInsert> = {
			updatedAt: new Date(),
		};
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
			// Where the tree is browsed outside Penombre the disk is the name.
			if (this.ctx.namedPaths && newName !== file.name) {
				await renameOnDisk(this.ctx, this.thumbnails, {
					path: file.path,
					name: newName,
					kind: "file",
				});
			}
		}

		// By id: a rename on disk just moved the path.
		await this.ctx.db
			.update(files)
			.set(updates)
			.where(and(eq(files.id, file.id), ownedFiles(this.ctx)));

		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "update",
			message: "Updated file metadata",
			level: "info",
		});

		await this.ctx.invalidateListingCaches();
	}

	async moveFile(fileKey: string, destinationFolder: string): Promise<void> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, fileKey), ownedFiles(this.ctx)));
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

		const normalizedDest = destinationFolder.endsWith("/")
			? destinationFolder.slice(0, -1)
			: destinationFolder;
		const newFileName = await diskName(
			this.ctx,
			normalizedDest || undefined,
			uniqueName,
			{
				fallback: extension ? `${newUUID}.${extension}` : newUUID,
				self: fileKey,
				file: true,
			},
		);
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
			.where(and(eq(files.id, file.id), ownedFiles(this.ctx)));

		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "update",
			message: "Moved a file",
			level: "info",
		});

		// The move minted a new key; the old one's cached thumbnail/peaks would
		// otherwise sit on disk forever, unreachable by any path a listing uses.
		await this.thumbnails.deleteThumbnails(fileKey);

		await this.ctx.invalidateListingCaches();
	}

	async duplicateFile(fileKey: string): Promise<ObjectItem> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, fileKey), ownedFiles(this.ctx)));
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

		const newFileNameWithExt = await diskName(
			this.ctx,
			parentFolder,
			uniqueName,
			{ fallback: generateFileNameWithExtension(uniqueName), file: true },
		);
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
				volumeId: this.ctx.volumeId,
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
			userId: this.ctx.actor.id,
			action: "create",
			message: "Duplicated a file",
			level: "info",
		});

		if (!newFile) {
			throw new Error("Failed to insert duplicated file into database");
		}
		await this.ctx.invalidateListingCaches();
		return fileDbToObjectItem(newFile);
	}

	/**
	 * Where a copy of another tree's file would land: a unique name and path
	 * here, and the row it would get, with the source row's type and
	 * durations so nothing has to be re-probed. No bytes and no row yet —
	 * `TransferOperations` copies bytes for a whole tree in one job and only
	 * inserts rows for the pairs that landed.
	 */
	async importFile(
		source: DbFile,
		folder: string | undefined,
	): Promise<PlannedImport> {
		const { path: normalizedFolder, id: folderId } =
			await this.resolveDestination(folder);
		const uniqueName = await getUniqueDisplayName(
			this.ctx,
			source.name,
			normalizedFolder,
			"file",
		);
		const fileName = await diskName(
			this.ctx,
			normalizedFolder || undefined,
			uniqueName,
			{ fallback: generateFileNameWithExtension(uniqueName), file: true },
		);
		const filePath = normalizedFolder
			? `${normalizedFolder}/${fileName}`
			: fileName;

		return {
			filePath,
			values: {
				id: crypto.randomUUID(),
				name: uniqueName,
				ownerId: this.ctx.user.id,
				volumeId: this.ctx.volumeId,
				path: filePath,
				folderId,
				contentType: source.contentType,
				category: source.category,
				size: source.size,
				isTrashed: false,
				isStarred: false,
				tags: source.tags ?? [],
				musicDuration: source.musicDuration,
				videoDuration: source.videoDuration,
			},
		};
	}

	/**
	 * Resolve where a create lands. A folder path that matches nothing would
	 * otherwise write a row whose prefix says one folder and whose folderId
	 * says the root: invisible where it claims to be, unreachable by its key.
	 */
	private async resolveDestination(
		folder?: string,
	): Promise<{ path?: string; id: string | null }> {
		const path = folder?.replace(/\/$/, "") || undefined;
		if (!path) {
			return { id: null };
		}
		const id = await getFolderIdByPath(this.ctx, path);
		if (!id) {
			throw new FileOrFolderNotFoundError(`Folder not found: ${path}`);
		}
		return { path, id };
	}

	async createFile(file: NewFile, folder?: string): Promise<UploadResult> {
		const name = file.name.includes("/")
			? (file.name.split("/").pop() ?? file.name)
			: file.name;
		const { path: normalizedFolder, id: folderId } =
			await this.resolveDestination(folder);

		const uniqueName = await getUniqueDisplayName(
			this.ctx,
			name,
			normalizedFolder,
			"file",
		);

		const fileNameWithExt = await diskName(
			this.ctx,
			normalizedFolder || undefined,
			uniqueName,
			{ fallback: generateFileNameWithExtension(uniqueName), file: true },
		);
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
				volumeId: this.ctx.volumeId,
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
			userId: this.ctx.actor.id,
			action: "create",
			message: "Created a file",
			level: "info",
		});

		await this.ctx.invalidateListingCaches();

		return {
			id: newFile.id,
			finalName: filePath,
			metadata: fileDbToMetadata(newFile),
		};
	}

	/**
	 * `upload` mode, in a folder that versions, hands back the live file of
	 * the same name instead of a `name (1)`: the upload then replaces its
	 * bytes and keeps the old ones as a version.
	 */
	async createBatchFiles(
		fileList: NewFile[],
		folder?: string,
		mode: "create" | "upload" = "create",
	): Promise<UploadResult[]> {
		const results: UploadResult[] = [];
		const { path: normalizedFolder, id: folderId } =
			await this.resolveDestination(folder);
		const replaces =
			mode === "upload" &&
			(
				await versioningAt(
					this.ctx,
					normalizedFolder || null,
					await adminVersioning(),
				)
			).enabled;

		for (const file of fileList) {
			const name = file.name.includes("/")
				? (file.name.split("/").pop() ?? file.name)
				: file.name;
			const existing = replaces
				? await findLiveSibling(this.ctx, name, folderId)
				: undefined;
			if (existing) {
				results.push({
					id: existing.id,
					finalName: existing.path,
					metadata: fileDbToMetadata(existing),
				});
				continue;
			}
			const uniqueName = await getUniqueDisplayName(
				this.ctx,
				name,
				normalizedFolder,
				"file",
			);
			const fileNameWithExt = await diskName(
				this.ctx,
				normalizedFolder || undefined,
				uniqueName,
				{ fallback: generateFileNameWithExtension(uniqueName), file: true },
			);
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
					volumeId: this.ctx.volumeId,
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
		await this.ctx.activityService.register({
			userId: this.ctx.actor.id,
			action: "create",
			message: `Created ${fileCount} file${fileCount === 1 ? "" : "s"}`,
			level: "info",
		});

		await this.ctx.invalidateListingCaches();
		return results;
	}

	async findFileById(id: string): Promise<string | null> {
		const [file] = await this.ctx.db
			.select({ path: files.path })
			.from(files)
			.where(and(eq(files.id, id), ownedFiles(this.ctx)));
		return file?.path ?? null;
	}

	/** Owner and display name, for addressing a notification about this file. */
	async findFileOwner(id: string): Promise<{
		ownerId: string;
		name: string;
		volumeId: string | null;
	} | null> {
		const [file] = await this.ctx.db
			.select({
				ownerId: files.ownerId,
				name: files.name,
				volumeId: files.volumeId,
			})
			.from(files)
			.where(and(eq(files.id, id), ownedFiles(this.ctx)));
		return file ?? null;
	}

	private async findOwnFile(id: string): Promise<DbFile | undefined> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.id, id), ownedFiles(this.ctx)));
		return file;
	}

	async uploadFileBody(
		id: string,
		body: Blob | Buffer | Uint8Array,
		options: { snapshot?: boolean; modifiedAt?: Date } = {},
	): Promise<void> {
		const file = await this.findOwnFile(id);
		if (!file) {
			throw new Error(`Failed to find file with id: ${id}`);
		}

		try {
			let data: Uint8Array;
			if (body instanceof Uint8Array) {
				data = body;
			} else if (Buffer.isBuffer(body)) {
				data = new Uint8Array(body);
			} else {
				data = new Uint8Array(await (body as Blob).arrayBuffer());
			}

			if (options.snapshot !== false) {
				await this.versions.keepVersion(file);
			}
			await this.ctx.driver.writeObject(file.path, data);
			const { modifiedAt } = options;
			if (modifiedAt) {
				// The file's own date, as a copy in a file manager keeps it.
				// Best effort: the bytes landed, a date is no reason to fail.
				await utimes(
					join(this.ctx.storagePath, file.path),
					modifiedAt,
					modifiedAt,
				).catch((error: unknown) => {
					logger.warn(`Could not date ${file.path}`, error);
				});
			}
			await afterWrite(this.ctx, this.thumbnails, file, {
				size: data.byteLength,
				updatedAt: modifiedAt,
			});
		} catch (error) {
			logger.error("Error uploading file body:", error);
			await this.ctx.activityService.register({
				userId: this.ctx.actor.id,
				action: "update",
				message: "Failed to upload file body",
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
				.where(and(eq(files.path, key), ownedFiles(this.ctx)));

			if (file) {
				await this.ctx.db
					.delete(files)
					.where(and(eq(files.id, file.id), ownedFiles(this.ctx)));
				await purgeGrantsFor(this.ctx.db, "file", [file.id]);
				await dropVersionBytes(this.ctx, [file.id]);
				await this.ctx.activityService.register({
					userId: this.ctx.actor.id,
					action: "delete",
					message: "Deleted a file",
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
			.where(and(eq(files.path, key), ownedFiles(this.ctx)));
		return !!file;
	}

	async fileExistsById(id: string): Promise<boolean> {
		const [file] = await this.ctx.db
			.select({ id: files.id })
			.from(files)
			.where(and(eq(files.id, id), ownedFiles(this.ctx)));
		return !!file;
	}

	/** Row and byte length first, so a caller can frame a Range before streaming. */
	async openRawFile(key: string): Promise<{
		meta: ObjectItem;
		size: number;
		stream: (
			start?: number,
			end?: number,
		) => Promise<ReadableStream<Uint8Array>>;
	} | null> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.path, key), ownedFiles(this.ctx)));
		if (!file) {
			return null;
		}
		const size = await this.ctx.driver
			.getObjectSize(key)
			.catch(() => file.size);
		return {
			meta: fileDbToObjectItem(file),
			size,
			stream: (start, end) => this.ctx.driver.getObjectStream(key, start, end),
		};
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
			.where(and(eq(files.path, key), ownedFiles(this.ctx)));
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
