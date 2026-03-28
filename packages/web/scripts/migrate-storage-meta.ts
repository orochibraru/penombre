#!/usr/bin/env bun
/**
 * Phase 5 — Migrate .meta.json sidecar files into the PostgreSQL database.
 *
 * Run from packages/web/:
 *   bun run migrate:storage [--dry-run] [--cleanup]
 *
 * Flags:
 *   --dry-run   Print what would be inserted; no DB writes, no file deletions.
 *   --cleanup   Delete .meta.json sidecars from disk after a successful migration.
 *
 * The script is idempotent: rows whose id already exists are silently skipped.
 */

import { existsSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { cwd } from "node:process";
import { plugin } from "bun";

// Register SvelteKit virtual module stubs so $lib imports resolve correctly.
plugin({
	name: "sveltekit-mocks",
	setup(build) {
		build.module("$app/environment", () => ({
			exports: { dev: false, building: false, version: "0" },
			loader: "object",
		}));
		build.module("$env/dynamic/private", () => ({
			exports: { env: process.env },
			loader: "object",
		}));
		build.module("$env/dynamic/public", () => ({
			exports: { env: {} },
			loader: "object",
		}));
		build.module("$app/server", () => ({
			exports: { getRequestEvent: () => undefined },
			loader: "object",
		}));
	},
});

// Dynamic imports must follow plugin registration.
const { getDb } = await import("$lib/server/db");
const { files, folders } = await import("$lib/server/db/schema");

// ─── CLI flags ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const cleanup = args.includes("--cleanup") && !dryRun;

if (dryRun) console.log("DRY RUN — no changes will be made.\n");

// ─── Storage path ──────────────────────────────────────────────────────────

const storagePath = resolve(
	process.env.STORAGE_PATH ?? join(cwd(), "data/storage"),
);

if (!existsSync(storagePath)) {
	console.error(`Storage path not found: ${storagePath}`);
	process.exit(1);
}

console.log(`Storage path: ${storagePath}\n`);

// ─── Old metadata shape ────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── Collectors ────────────────────────────────────────────────────────────

interface FolderItem {
	relPath: string;
	meta: OldMeta;
	metaFilePath: string | null;
}

interface FileItem {
	relPath: string;
	absDataPath: string;
	absMetaPath: string;
	meta: OldMeta;
}

type DirEntry = { name: string; isDirectory(): boolean };

/** Recursively collect all subdirectories (excluding .thumbnails), depth-first. */
async function collectFolders(
	dirPath: string,
	userRoot: string,
): Promise<FolderItem[]> {
	const result: FolderItem[] = [];

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
		const metaFilePath = join(absPath, ".keep.meta.json");
		const meta = await tryReadMeta(metaFilePath);

		result.push({
			relPath,
			meta: meta ?? { id: entry.name, name: entry.name },
			metaFilePath: meta ? metaFilePath : null,
		});

		result.push(...(await collectFolders(absPath, userRoot)));
	}

	// Process shallower folders first so parents exist when children are inserted.
	result.sort(
		(a, b) => a.relPath.split("/").length - b.relPath.split("/").length,
	);

	return result;
}

/** Recursively collect all .meta.json files (excluding .keep.meta.json). */
async function collectFiles(
	dirPath: string,
	userRoot: string,
): Promise<FileItem[]> {
	const result: FileItem[] = [];

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
			result.push(...(await collectFiles(join(dirPath, entry.name), userRoot)));
			continue;
		}

		if (entry.name === ".keep.meta.json") continue;
		if (!entry.name.endsWith(".meta.json")) continue;

		const absMetaPath = join(dirPath, entry.name);
		const absDataPath = absMetaPath.slice(0, -".meta.json".length);
		const relPath = relative(userRoot, absDataPath);
		const meta = await tryReadMeta(absMetaPath);

		if (!meta?.id) {
			console.warn(
				`  Warning: skipping malformed meta (no id): ${absMetaPath}`,
			);
			continue;
		}

		result.push({ relPath, absDataPath, absMetaPath, meta });
	}

	return result;
}

// ─── Main ──────────────────────────────────────────────────────────────────

const db = getDb();

let totalFolders = 0;
let totalFiles = 0;
let skippedFolders = 0;
let skippedFiles = 0;
const metaFilesToDelete: string[] = [];

const userDirs = (await readdir(storagePath, { withFileTypes: true }))
	.filter((e) => e.isDirectory() && e.name.startsWith("user-"))
	.map((e) => ({
		userId: e.name.replace("user-", ""),
		absPath: join(storagePath, e.name),
	}));

console.log(
	`Found ${userDirs.length} user director${userDirs.length === 1 ? "y" : "ies"}.`,
);

for (const { userId, absPath: userRoot } of userDirs) {
	console.log(`\n── user: ${userId}`);

	// ── Folders ──────────────────────────────────────────────────────────────

	const folderItems = await collectFolders(userRoot, userRoot);
	// folderPathToId lets file insertion resolve folderId from relPath
	const folderPathToId = new Map<string, string>();

	for (const { relPath, meta, metaFilePath } of folderItems) {
		const folderId = meta.id;
		folderPathToId.set(relPath, folderId);

		const parentRelPath = relPath.includes("/")
			? relPath.slice(0, relPath.lastIndexOf("/"))
			: null;
		const parentId = parentRelPath
			? (folderPathToId.get(parentRelPath) ?? null)
			: null;

		const row = {
			id: folderId,
			name: meta.name ?? folderId,
			ownerId: userId,
			path: relPath,
			parentId,
			isTrashed: meta.isTrashed ?? false,
			isStarred: meta.isStarred ?? false,
			tags: meta.tags ?? [],
			createdAt: meta.createdAt ? new Date(meta.createdAt) : new Date(),
		};

		if (dryRun) {
			console.log(`  [folder] ${relPath}  name="${row.name}" id=${folderId}`);
			continue;
		}

		const [inserted] = await db
			.insert(folders)
			.values(row)
			.onConflictDoNothing()
			.returning({ id: folders.id });

		if (inserted) {
			totalFolders++;
			if (metaFilePath) metaFilesToDelete.push(metaFilePath);
		} else {
			skippedFolders++;
		}
	}

	// ── Files ─────────────────────────────────────────────────────────────────

	const fileItems = await collectFiles(userRoot, userRoot);

	for (const { relPath, absDataPath, absMetaPath, meta } of fileItems) {
		const parentRelPath = relPath.includes("/")
			? relPath.slice(0, relPath.lastIndexOf("/"))
			: null;
		const folderId = parentRelPath
			? (folderPathToId.get(parentRelPath) ?? null)
			: null;
		const size = await getFileSize(absDataPath);

		const row = {
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
		};

		if (dryRun) {
			console.log(`  [file]   ${relPath}  name="${row.name}" size=${size}`);
			continue;
		}

		const [inserted] = await db
			.insert(files)
			.values(row)
			.onConflictDoNothing()
			.returning({ id: files.id });

		if (inserted) {
			totalFiles++;
			metaFilesToDelete.push(absMetaPath);
		} else {
			skippedFiles++;
		}
	}

	if (dryRun) {
		console.log(
			`  → would insert ${folderItems.length} folder(s), ${fileItems.length} file(s)`,
		);
	}
}

// ─── Summary ───────────────────────────────────────────────────────────────

console.log("\n─────────────────────────────────────");
if (dryRun) {
	console.log("Dry run complete — no changes were made.");
} else {
	console.log(
		`Folders: ${totalFolders} inserted, ${skippedFolders} already existed`,
	);
	console.log(
		`Files:   ${totalFiles} inserted, ${skippedFiles} already existed`,
	);

	if (cleanup) {
		const count = metaFilesToDelete.length;
		if (count === 0) {
			console.log("\nNo meta files to clean up.");
		} else {
			console.log(`\nCleaning up ${count} meta file(s)...`);
			let deleted = 0;
			for (const metaPath of metaFilesToDelete) {
				try {
					await unlink(metaPath);
					deleted++;
				} catch (err) {
					console.warn(`  Warning: could not delete ${metaPath}:`, err);
				}
			}
			console.log(`Deleted ${deleted} / ${count} meta file(s).`);
		}
	}
}
