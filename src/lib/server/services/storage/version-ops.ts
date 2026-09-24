/**
 * Versions as the storage service sees them: keeping, restoring, reading and
 * deleting a file's earlier bytes. The rows and bytes themselves are
 * `versions.ts`'s; this adds the file lookups and the renders.
 */

import { rename, stat } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { FileCategoryEnum } from "#lib/file-helpers.js";
import {
	type File as DbFile,
	type FileVersion,
	fileNotes,
	files,
	fileVersions,
} from "#lib/server/db/schema.js";
import {
	VersioningDisabledError,
	VersionMergeError,
} from "#lib/server/errors.js";
import type { StorageContext } from "./context";
import type { FileOperations } from "./files";
import { diskName, getUniqueDisplayName } from "./lookups";
import {
	determineCategory,
	fileDbToObjectItem,
	generateFileNameWithExtension,
} from "./mappers";
import { recordDurations } from "./media";
import { ownedFiles } from "./scope";
import type { ThumbnailService } from "./thumbnails";
import {
	adminVersioning,
	deleteVersion,
	getVersion,
	type ListedVersion,
	latestSeqs,
	listVersions,
	reorderVersions,
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
	{ size, updatedAt = new Date() }: { size: number; updatedAt?: Date },
): Promise<void> {
	const { id, path: key } = file;
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

interface DatedFile {
	file: DbFile;
	at: Date;
}

export interface MergePlan {
	target: DbFile;
	sources: DatedFile[];
	/**
	 * The target's history once merged, oldest first: source file ids and its
	 * existing version ids. Absent when the caller only appends.
	 */
	order?: Array<{ file: string } | { version: string }>;
	max: number;
}

/** `v:<id>` in a merge's ids names one of the kept file's existing versions. */
const VERSION_TOKEN = "v:";

export class VersionOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
		/** Deletes the merged-away files and renames the kept one. */
		private readonly fileOperations?: FileOperations,
	) {}

	/**
	 * The newest of `ids` in the order given stays; the rest become its
	 * versions, placed as previewed, and are deleted. Returns the kept file's
	 * id, null if any is not here.
	 */
	async merge(ids: string[], name?: string): Promise<string | null> {
		const plan = await this.planMerge(ids);
		if (!(plan && this.fileOperations)) {
			return null;
		}
		const { target, sources, order, max } = plan;
		const made = new Map<string, string>();
		// One at a time, each deleted only once its version exists: a
		// failure part way leaves every take either a file or a version.
		for (const source of sources) {
			const version = await this.absorb(target, source, max);
			made.set(source.file.id, version.id);
			await this.fileOperations.deleteFile(source.file.path);
		}
		await this.place(target.id, order, made);
		const wanted = name?.trim();
		if (wanted && wanted.toLowerCase() !== target.name.toLowerCase()) {
			const folder = target.path.includes("/")
				? target.path.slice(0, target.path.lastIndexOf("/"))
				: undefined;
			await this.fileOperations.updateFile(target.path, {
				key: await getUniqueDisplayName(this.ctx, wanted, folder, "file"),
			});
		}
		await this.ctx.invalidateListingCaches();
		return target.id;
	}

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
		const version = await snapshot(this.ctx, file, limit, {
			dropThumbnails: (key) => this.thumbnails.deleteThumbnails(key),
		});
		await this.thumbnails.adopt(file.path, versionKey(file.id, version.id));
		return version;
	}

	/**
	 * `ids` oldest first, as the dialog previewed them: the last stays, the
	 * rest become its versions in that order, each dated by its file's mtime.
	 * Null when any id is not a live file here.
	 */
	async planMerge(tokens: string[]): Promise<MergePlan | null> {
		const unique = [...new Set(tokens)].filter(
			(id) => !id.startsWith(VERSION_TOKEN),
		);
		const placed = tokens
			.filter((id) => id.startsWith(VERSION_TOKEN))
			.map((id) => id.slice(VERSION_TOKEN.length));
		if (unique.length < 2) {
			throw new VersionMergeError("Select at least two files to merge");
		}
		const rows = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(
					ownedFiles(this.ctx),
					inArray(files.id, unique),
					eq(files.isTrashed, false),
				),
			);
		if (rows.length !== unique.length) {
			return null;
		}
		const admin = await adminVersioning();
		if (!admin.enabled) {
			throw new VersioningDisabledError("File versioning is turned off");
		}

		const byId = new Map(rows.map((row) => [row.id, row] as const));
		const dated = await Promise.all(
			unique.map(async (id) => {
				const file = byId.get(id) as DbFile;
				return {
					file,
					at: await stat(join(this.ctx.storagePath, file.path)).then(
						(s) => s.mtime,
						() => file.updatedAt,
					),
				};
			}),
		);
		const target = dated.at(-1) as DatedFile;
		const sources = dated.slice(0, -1);

		const seqs = await latestSeqs(this.ctx, unique);
		const withHistory = sources.find(({ file }) => seqs.has(file.id));
		if (withHistory) {
			throw new VersionMergeError(
				`"${withHistory.file.name}" already has versions of its own`,
			);
		}
		const { max } = await versioningForFile(this.ctx, target.file, admin);
		const existing = await listVersions(this.ctx, target.file.id);
		const total = existing.length + sources.length;
		if (total > max) {
			throw new VersionMergeError(
				`This folder keeps ${max} versions per file; merging would make ${total}`,
			);
		}
		if (placed.length === 0) {
			return { target: target.file, sources, max };
		}
		const ids = new Set(existing.map((v) => v.id));
		if (placed.length !== ids.size || !placed.every((id) => ids.has(id))) {
			throw new VersionMergeError(
				"The history changed since the preview; open the merge again",
			);
		}
		const order = tokens
			.filter((id) => id !== target.file.id)
			.map((id) =>
				id.startsWith(VERSION_TOKEN)
					? { version: id.slice(VERSION_TOKEN.length) }
					: { file: id },
			);
		return { target: target.file, sources, order, max };
	}

	/**
	 * `source`'s bytes become a version of `target`, dated and named after
	 * it, and its notes move over. The caller then deletes `source`.
	 */
	async absorb(
		target: DbFile,
		source: DatedFile,
		max: number,
	): Promise<FileVersion> {
		const version = await snapshot(
			this.ctx,
			{
				id: target.id,
				path: source.file.path,
				contentType: source.file.contentType,
			},
			max,
			{
				dropThumbnails: (key) => this.thumbnails.deleteThumbnails(key),
				name: source.file.name,
				createdAt: source.at,
			},
		);
		await this.thumbnails.adopt(
			source.file.path,
			versionKey(target.id, version.id),
		);
		await this.ctx.db
			.update(fileNotes)
			.set({ fileId: target.id })
			.where(eq(fileNotes.fileId, source.file.id));
		return version;
	}

	/**
	 * Versions back out as files beside the file, the reverse of a merge: each
	 * under its original name (made unique), dated by its own bytes. A move,
	 * not a copy: the bytes are renamed out of the history. All of them when
	 * `versionIds` is absent. Returns the new files' ids, null if not here.
	 */
	async extract(
		fileId: string,
		versionIds?: string[],
	): Promise<string[] | null> {
		const file = await this.findOwnFile(fileId);
		if (!file) {
			return null;
		}
		const wanted = versionIds && new Set(versionIds);
		const versions = (await listVersions(this.ctx, fileId))
			.filter((version) => !wanted || wanted.has(version.id))
			.toReversed();
		const parent = file.path.includes("/")
			? file.path.slice(0, file.path.lastIndexOf("/"))
			: undefined;
		const dot = file.name.lastIndexOf(".");
		const [stem, ext] =
			dot > 0
				? [file.name.slice(0, dot), file.name.slice(dot)]
				: [file.name, ""];
		const created: string[] = [];
		for (const version of versions) {
			const name = await getUniqueDisplayName(
				this.ctx,
				version.name ?? `${stem} v${version.seq}${ext}`,
				parent,
				"file",
			);
			const segment = await diskName(this.ctx, parent, name, {
				fallback: generateFileNameWithExtension(name),
				file: true,
			});
			const path = parent ? `${parent}/${segment}` : segment;
			const from = versionKey(fileId, version.id);
			const source = join(this.ctx.storagePath, from);
			// Its own date: the render's, not when it was kept.
			const at = await stat(source).then(
				(s) => s.mtime,
				() => version.createdAt,
			);
			await this.thumbnails.adopt(from, path);
			// Over the placeholder `diskName` claimed.
			await rename(source, join(this.ctx.storagePath, path));
			const id = crypto.randomUUID();
			try {
				await this.ctx.db.insert(files).values({
					id,
					name,
					ownerId: this.ctx.user.id,
					volumeId: this.ctx.volumeId,
					path,
					folderId: file.folderId,
					contentType: version.contentType,
					category: determineCategory(name),
					size: version.size,
					createdAt: at,
					updatedAt: at,
				});
			} catch (error) {
				await rename(join(this.ctx.storagePath, path), source);
				throw error;
			}
			await this.ctx.db
				.delete(fileVersions)
				.where(eq(fileVersions.id, version.id));
			await this.thumbnails.deleteThumbnails(from);
			created.push(id);
		}
		await this.ctx.invalidateListingCaches();
		return created;
	}

	/** A merge's order, with each absorbed file replaced by its new version. */
	async place(
		fileId: string,
		order: MergePlan["order"],
		made: Map<string, string>,
	): Promise<void> {
		if (order) {
			await this.reorder(
				fileId,
				order.map((entry) =>
					"file" in entry ? (made.get(entry.file) ?? "") : entry.version,
				),
			);
		}
	}

	/** Renumbers a file's versions in the order given; false if it is not here. */
	async reorder(fileId: string, versionIds: string[]): Promise<boolean> {
		const file = await this.findOwnFile(fileId);
		if (!(file && (await reorderVersions(this.ctx, fileId, versionIds)))) {
			return false;
		}
		await this.ctx.invalidateListingCaches();
		return true;
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
		await afterWrite(this.ctx, this.thumbnails, file, { size: version.size });
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
