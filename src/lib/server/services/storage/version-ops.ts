/**
 * Versions as the storage service sees them: keeping, restoring, reading and
 * deleting a file's earlier bytes. The rows and bytes themselves are
 * `versions.ts`'s; this adds the file lookups and the renders.
 */

import { and, eq } from "drizzle-orm";
import { FileCategoryEnum } from "#lib/file-helpers.js";
import {
	type File as DbFile,
	type FileVersion,
	files,
} from "#lib/server/db/schema.js";
import { VersioningDisabledError } from "#lib/server/errors.js";
import type { StorageContext } from "./context";
import { determineCategory, fileDbToObjectItem } from "./mappers";
import { recordDurations } from "./media";
import { ownedFiles } from "./scope";
import type { ThumbnailService } from "./thumbnails";
import {
	adminVersioning,
	deleteVersion,
	getVersion,
	type ListedVersion,
	listVersions,
	snapshot,
	type Versioning,
	versioningForFile,
	versionKey,
} from "./versions";

/**
 * What follows new bytes under an unchanged key: the row's size and time, a
 * duration to re-probe and renders to redo.
 */
export async function afterWrite(
	ctx: StorageContext,
	thumbnails: ThumbnailService,
	file: DbFile,
	size: number,
): Promise<void> {
	const { id, path: key } = file;
	const updatedAt = new Date();
	const updates: Partial<typeof files.$inferInsert> = { size, updatedAt };

	const category = determineCategory(file.name);
	// The old bytes' duration no longer applies; the new one lands
	// when the probe does, off the request.
	if (category === FileCategoryEnum.MUSIC) {
		updates.musicDuration = null;
	} else if (category === FileCategoryEnum.VIDEO) {
		updates.videoDuration = null;
	}

	await ctx.db
		.update(files)
		.set(updates)
		.where(and(eq(files.id, id), ownedFiles(ctx)));

	// The key is unchanged, so a stale thumbnail at the same cache path
	// would otherwise pass `existsSync` and keep serving the old bytes
	// forever; drop it before rebuilding.
	await thumbnails.deleteThumbnails(key);
	// Build the preview now rather than on first view. Not awaited:
	// an ffmpeg pass over a large media file would otherwise hold the
	// upload response open for seconds.
	thumbnails.warm(key, file.contentType).catch(() => {
		// `warm` already logs; nothing further to do here.
	});
	if (
		category === FileCategoryEnum.MUSIC ||
		category === FileCategoryEnum.VIDEO
	) {
		// Never throws; not awaited so the upload answers now.
		void recordDurations(ctx, [{ id, path: key, category, updatedAt }]);
	}
	await ctx.invalidateListingCaches();
}

export class VersionOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
	) {}

	/** Whether a file's folder versions, and how many it keeps. */
	async fileVersioning(id: string): Promise<Versioning | null> {
		const file = await this.findOwnFile(id);
		return file
			? versioningForFile(this.ctx, file, await adminVersioning())
			: null;
	}

	private async findOwnFile(id: string): Promise<DbFile | undefined> {
		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(and(eq(files.id, id), ownedFiles(this.ctx)));
		return file;
	}

	/**
	 * Keeps the current bytes as a version when the file's folder versions.
	 * `force`: a restore keeps what it replaces even with versioning off.
	 */
	async keepVersion(file: DbFile, force = false): Promise<void> {
		const admin = await adminVersioning();
		const versioning = await versioningForFile(this.ctx, file, admin);
		if (!(versioning.enabled || force)) {
			return;
		}
		// An upload's placeholder: its row carries the declared size already.
		const size = await this.ctx.driver.getObjectSize(file.path).catch(() => 0);
		if (size === 0) {
			return;
		}
		await this.keep(file, versioning.max);
	}

	/** A snapshot that also takes the renders its bytes already have. */
	private async keep(file: DbFile, limit: number): Promise<FileVersion> {
		const version = await snapshot(this.ctx, file, limit, (key) =>
			this.thumbnails.deleteThumbnails(key),
		);
		await this.thumbnails.adopt(file.path, versionKey(file.id, version.id));
		return version;
	}

	/** Cuts a version of the current bytes, whatever the folder says. */
	async snapshotFile(id: string): Promise<FileVersion | null> {
		const file = await this.findOwnFile(id);
		if (!file) {
			return null;
		}
		const admin = await adminVersioning();
		if (!admin.enabled) {
			throw new VersioningDisabledError("File versioning is turned off");
		}
		const versioning = await versioningForFile(this.ctx, file, admin);
		const version = await this.keep(file, versioning.max);
		await this.ctx.invalidateListingCaches();
		return version;
	}

	/** The current bytes become a version, then the version's become current. */
	async restoreVersion(id: string, versionId: string): Promise<boolean> {
		const file = await this.findOwnFile(id);
		const version = file ? await getVersion(this.ctx, id, versionId) : null;
		if (!(file && version)) {
			return false;
		}
		await this.keepVersion(file, true);
		await this.ctx.driver.writeObject(
			file.path,
			await this.ctx.driver.getObjectStream(versionKey(id, versionId)),
		);
		await afterWrite(this.ctx, this.thumbnails, file, version.size);
		return true;
	}

	async openVersion(id: string, versionId: string) {
		const file = await this.findOwnFile(id);
		const version = file ? await getVersion(this.ctx, id, versionId) : null;
		if (!(file && version)) {
			return null;
		}
		const key = versionKey(id, versionId);
		return {
			file: fileDbToObjectItem(file),
			version,
			stream: (start?: number, end?: number) =>
				this.ctx.driver.getObjectStream(key, start, end),
		};
	}

	/** A version's thumbnail, or its peaks for audio; null if it has none. */
	async versionThumbnail(
		id: string,
		versionId: string,
		size: number,
		ifNoneMatch?: string,
	) {
		const file = await this.findOwnFile(id);
		const version = file ? await getVersion(this.ctx, id, versionId) : null;
		if (!version) {
			return null;
		}
		return this.thumbnails.generateThumbnail(
			versionKey(id, versionId),
			version.contentType,
			size,
			ifNoneMatch,
		);
	}

	async listFileVersions(id: string): Promise<{
		file: DbFile;
		versions: ListedVersion[];
	} | null> {
		const file = await this.findOwnFile(id);
		if (!file) {
			return null;
		}
		return { file, versions: await listVersions(this.ctx, id) };
	}

	async deleteFileVersion(id: string, versionId: string): Promise<boolean> {
		const file = await this.findOwnFile(id);
		if (!(file && (await deleteVersion(this.ctx, id, versionId)))) {
			return false;
		}
		await this.thumbnails.deleteThumbnails(versionKey(id, versionId));
		await this.ctx.invalidateListingCaches();
		return true;
	}
}
