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
import { getDb } from "$lib/server/db";
import { files, folders, user } from "$lib/server/db/schema";
import { DEFAULT_STORAGE_PATH } from "./constants";

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
		if (!(await f.exists())) return null;
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

type DirEntry = { name: string; isDirectory(): boolean };

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
		if (!entry.isDirectory()) continue;
		if (entry.name === ".thumbnails") continue;

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
			if (entry.name === ".thumbnails") continue;
			result.push(
				...(await collectFileItems(join(dirPath, entry.name), userRoot)),
			);
			continue;
		}

		if (entry.name === ".keep.meta.json") continue;
		if (!entry.name.endsWith(".meta.json")) continue;

		const absMetaPath = join(dirPath, entry.name);
		const absDataPath = absMetaPath.slice(0, -".meta.json".length);
		const relPath = relative(userRoot, absDataPath);
		const meta = await tryReadMeta(absMetaPath);

		if (!meta?.id) continue;

		result.push({ relPath, absDataPath, absMetaPath, meta });
	}

	return result;
}

export async function migrateStorageMeta(
	storagePath = DEFAULT_STORAGE_PATH,
): Promise<void> {
	if (!existsSync(storagePath)) {
		return;
	}

	let userDirs: Array<{ userId: string; absPath: string }>;
	try {
		const entries = (await readdir(storagePath, {
			withFileTypes: true,
		})) as unknown as DirEntry[];
		userDirs = entries
			.filter((e) => e.isDirectory() && e.name.startsWith("user-"))
			.map((e) => ({
				userId: e.name.replace("user-", ""),
				absPath: join(storagePath, e.name),
			}));
	} catch {
		return;
	}

	if (userDirs.length === 0) return;

	const db = getDb();

	// Only migrate data for users that actually exist in the database.
	// Directories for deleted/orphaned users are silently skipped.
	const userIds = userDirs.map((d) => d.userId);
	const existingUsers = await db
		.select({ id: user.id })
		.from(user)
		.where(inArray(user.id, userIds));
	const existingUserIds = new Set(existingUsers.map((u) => u.id));
	const validUserDirs = userDirs.filter((d) => existingUserIds.has(d.userId));

	if (validUserDirs.length === 0) return;

	let totalFolders = 0;
	let totalFiles = 0;

	for (const { userId, absPath: userRoot } of validUserDirs) {
		const folderItems = await collectFolderItems(userRoot, userRoot);
		const folderPathToId = new Map<string, string>();

		for (const { relPath, meta } of folderItems) {
			const folderId = meta.id;
			folderPathToId.set(relPath, folderId);

			const parentRelPath = relPath.includes("/")
				? relPath.slice(0, relPath.lastIndexOf("/"))
				: null;
			const parentId = parentRelPath
				? (folderPathToId.get(parentRelPath) ?? null)
				: null;

			const [inserted] = await db
				.insert(folders)
				.values({
					id: folderId,
					name: meta.name ?? folderId,
					ownerId: userId,
					path: relPath,
					parentId,
					isTrashed: meta.isTrashed ?? false,
					isStarred: meta.isStarred ?? false,
					tags: meta.tags ?? [],
					createdAt: meta.createdAt ? new Date(meta.createdAt) : new Date(),
				})
				.onConflictDoNothing()
				.returning({ id: folders.id });

			if (inserted) totalFolders++;
		}

		const fileItems = await collectFileItems(userRoot, userRoot);

		for (const { relPath, absDataPath, meta } of fileItems) {
			const parentRelPath = relPath.includes("/")
				? relPath.slice(0, relPath.lastIndexOf("/"))
				: null;
			const folderId = parentRelPath
				? (folderPathToId.get(parentRelPath) ?? null)
				: null;
			const size = await getFileSize(absDataPath);

			const [inserted] = await db
				.insert(files)
				.values({
					id: meta.id,
					name: meta.name ?? relPath.split("/").pop() ?? relPath,
					ownerId: userId,
					path: relPath,
					folderId,
					contentType: meta.contentType ?? "application/octet-stream",
					category: meta.category ?? "UNKNOWN",
					size,
					isTrashed: meta.isTrashed ?? false,
					isStarred: meta.isStarred ?? false,
					tags: meta.tags ?? [],
					musicDuration: meta.music?.duration ?? null,
					videoDuration: meta.video?.duration ?? null,
					createdAt: meta.createdAt ? new Date(meta.createdAt) : new Date(),
				})
				.onConflictDoNothing()
				.returning({ id: files.id });

			if (inserted) totalFiles++;
		}
	}

	if (totalFolders > 0 || totalFiles > 0) {
		logger.info(
			`Migrated legacy meta: ${totalFolders} folder(s), ${totalFiles} file(s)`,
		);
	}
}
