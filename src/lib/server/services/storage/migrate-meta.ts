/**
 * Startup migration: import legacy .meta.json sidecar files into PostgreSQL.
 *
 * Runs automatically on app start (hooks.server.ts → init).
 * Idempotent — rows whose id already exists are silently skipped.
 * Only applies when the storage backend is "local".
 */

import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { inArray } from "drizzle-orm";
import { Logger } from "$lib/logger";
import { getStoragePath } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { files, folders, user } from "$lib/server/db/schema";

const logger = new Logger("StorageMetaMigration");

interface OldMeta {
	id: string;
	name?: string;
	createdAt?: string;
	contentType?: string;
	category?: string;
	isTrashed?: boolean;
	isStarred?: boolean;
	tags?: string[];
	music?: { duration?: number };
	video?: { duration?: number };
}

async function tryReadMeta(filePath: string): Promise<OldMeta | null> {
	try {
		const f = Bun.file(filePath);
		if (!(await f.exists())) {
			return null;
		}
		return (await f.json()) as OldMeta;
	} catch {
		return null;
	}
}

async function getFileSize(filePath: string): Promise<number> {
	try {
		return (await stat(filePath)).size;
	} catch {
		return 0;
	}
}

interface DirEntry {
	name: string;
	isDirectory: () => boolean;
}

async function collectFolderItems(
	dirPath: string,
	userRoot: string,
): Promise<Array<{ relPath: string; meta: OldMeta }>> {
	const result: Array<{ relPath: string; meta: OldMeta }> = [];

	let entries: DirEntry[];
	try {
		entries = (await readdir(dirPath, {
			withFileTypes: true,
		})) as unknown as DirEntry[];
	} catch {
		return result;
	}

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}
		if (entry.name === ".thumbnails") {
			continue;
		}

		const absPath = join(dirPath, entry.name);
		const relPath = relative(userRoot, absPath);
		const meta = await tryReadMeta(join(absPath, ".keep.meta.json"));

		result.push({
			relPath,
			meta: meta ?? { id: entry.name, name: entry.name },
		});
		result.push(...(await collectFolderItems(absPath, userRoot)));
	}

	result.sort(
		(a, b) => a.relPath.split("/").length - b.relPath.split("/").length,
	);

	return result;
}

async function collectFileItems(
	dirPath: string,
	userRoot: string,
): Promise<
	Array<{
		relPath: string;
		absDataPath: string;
		absMetaPath: string;
		meta: OldMeta;
	}>
> {
	const result: Array<{
		relPath: string;
		absDataPath: string;
		absMetaPath: string;
		meta: OldMeta;
	}> = [];

	let entries: DirEntry[];
	try {
		entries = (await readdir(dirPath, {
			withFileTypes: true,
		})) as unknown as DirEntry[];
	} catch {
		return result;
	}

	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (entry.name === ".thumbnails") {
				continue;
			}
			result.push(
				...(await collectFileItems(join(dirPath, entry.name), userRoot)),
			);
			continue;
		}

		if (entry.name === ".keep.meta.json") {
			continue;
		}
		if (!entry.name.endsWith(".meta.json")) {
			continue;
		}

		const absMetaPath = join(dirPath, entry.name);
		const absDataPath = absMetaPath.slice(0, -".meta.json".length);
		const relPath = relative(userRoot, absDataPath);
		const meta = await tryReadMeta(absMetaPath);

		if (!meta?.id) {
			continue;
		}

		result.push({ relPath, absDataPath, absMetaPath, meta });
	}

	return result;
}

type Db = ReturnType<typeof getDb>;

interface UserDir {
	userId: string;
	absPath: string;
}

/** `user-<id>` directories directly under the storage root */
async function listUserDirs(storagePath: string): Promise<UserDir[]> {
	try {
		const entries = (await readdir(storagePath, {
			withFileTypes: true,
		})) as unknown as DirEntry[];
		return entries
			.filter((e) => e.isDirectory() && e.name.startsWith("user-"))
			.map((e) => ({
				userId: e.name.replace("user-", ""),
				absPath: join(storagePath, e.name),
			}));
	} catch {
		// Unreadable storage root — nothing to migrate
		return [];
	}
}

/**
 * Keep only directories belonging to users that still exist in the database.
 * Directories for deleted/orphaned users are silently skipped.
 */
async function keepExistingUsers(
	db: Db,
	userDirs: UserDir[],
): Promise<UserDir[]> {
	const existingUsers = await db
		.select({ id: user.id })
		.from(user)
		.where(
			inArray(
				user.id,
				userDirs.map((d) => d.userId),
			),
		);
	const existingUserIds = new Set(existingUsers.map((u) => u.id));
	return userDirs.filter((d) => existingUserIds.has(d.userId));
}

/** Parent folder id for a relative path, or null when it sits at the root */
function parentIdFor(
	relPath: string,
	folderPathToId: Map<string, string>,
): string | null {
	if (!relPath.includes("/")) {
		return null;
	}
	return folderPathToId.get(relPath.slice(0, relPath.lastIndexOf("/"))) ?? null;
}

/** Insert this user's folders, returning the row count and a path → id index */
async function migrateUserFolders(
	db: Db,
	userId: string,
	userRoot: string,
): Promise<{ inserted: number; folderPathToId: Map<string, string> }> {
	const folderPathToId = new Map<string, string>();
	let insertedCount = 0;

	for (const { relPath, meta } of await collectFolderItems(
		userRoot,
		userRoot,
	)) {
		const folderId = meta.id;
		folderPathToId.set(relPath, folderId);

		const [inserted] = await db
			.insert(folders)
			.values({
				id: folderId,
				name: meta.name ?? folderId,
				ownerId: userId,
				path: relPath,
				parentId: parentIdFor(relPath, folderPathToId),
				isTrashed: meta.isTrashed ?? false,
				isStarred: meta.isStarred ?? false,
				tags: meta.tags ?? [],
				createdAt: meta.createdAt ? new Date(meta.createdAt) : new Date(),
			})
			.onConflictDoNothing()
			.returning({ id: folders.id });

		if (inserted) {
			insertedCount++;
		}
	}

	return { inserted: insertedCount, folderPathToId };
}

/** Insert this user's files, returning the row count */
async function migrateUserFiles(
	db: Db,
	userId: string,
	userRoot: string,
	folderPathToId: Map<string, string>,
): Promise<number> {
	let insertedCount = 0;

	for (const { relPath, absDataPath, meta } of await collectFileItems(
		userRoot,
		userRoot,
	)) {
		const [inserted] = await db
			.insert(files)
			.values({
				id: meta.id,
				name: meta.name ?? relPath.split("/").pop() ?? relPath,
				ownerId: userId,
				path: relPath,
				folderId: parentIdFor(relPath, folderPathToId),
				contentType: meta.contentType ?? "application/octet-stream",
				category: meta.category ?? "UNKNOWN",
				size: await getFileSize(absDataPath),
				isTrashed: meta.isTrashed ?? false,
				isStarred: meta.isStarred ?? false,
				tags: meta.tags ?? [],
				musicDuration: meta.music?.duration ?? null,
				videoDuration: meta.video?.duration ?? null,
				createdAt: meta.createdAt ? new Date(meta.createdAt) : new Date(),
			})
			.onConflictDoNothing()
			.returning({ id: files.id });

		if (inserted) {
			insertedCount++;
		}
	}

	return insertedCount;
}

export async function migrateStorageMeta(
	storagePath = getStoragePath(),
): Promise<void> {
	if (!existsSync(storagePath)) {
		return;
	}

	const userDirs = await listUserDirs(storagePath);
	if (userDirs.length === 0) {
		return;
	}

	const db = getDb();
	const validUserDirs = await keepExistingUsers(db, userDirs);
	if (validUserDirs.length === 0) {
		return;
	}

	let totalFolders = 0;
	let totalFiles = 0;

	for (const { userId, absPath: userRoot } of validUserDirs) {
		const { inserted, folderPathToId } = await migrateUserFolders(
			db,
			userId,
			userRoot,
		);
		totalFolders += inserted;
		totalFiles += await migrateUserFiles(db, userId, userRoot, folderPathToId);
	}

	if (totalFolders > 0 || totalFiles > 0) {
		logger.info(
			`Migrated legacy meta: ${totalFolders} folder(s), ${totalFiles} file(s)`,
		);
	}
}
