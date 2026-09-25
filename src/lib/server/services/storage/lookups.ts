/**
 * Lookups shared by the file, folder and listing modules.
 *
 * They live here rather than on one of those modules so none of them has to
 * depend on another just to resolve a path or de-duplicate a name.
 */

import { mkdir, open } from "node:fs/promises";
import { dirname, join } from "node:path";
import { and, eq, isNull, sql } from "drizzle-orm";
import { type File, files, folders } from "#lib/server/db/schema.js";
import { rethrowUnreachable } from "#lib/server/errors.js";
import type { StorageContext } from "./context";
import { ownedFiles, ownedFolders } from "./scope";

export async function getFolderIdByPath(
	ctx: StorageContext,
	path: string,
): Promise<string | null> {
	const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
	if (!normalized) {
		return null;
	}
	const [folder] = await ctx.db
		.select({ id: folders.id })
		.from(folders)
		.where(and(eq(folders.path, normalized), ownedFolders(ctx)));
	return folder?.id ?? null;
}

export async function getUniqueDisplayName(
	ctx: StorageContext,
	name: string,
	folder?: string,
	type: "file" | "folder" = "file",
): Promise<string> {
	const folderId = folder ? await getFolderIdByPath(ctx, folder) : null;

	let existingNames: Set<string>;
	if (type === "folder") {
		const existing = await ctx.db
			.select({ name: folders.name })
			.from(folders)
			.where(
				and(
					ownedFolders(ctx),
					eq(folders.isTrashed, false),
					folderId ? eq(folders.parentId, folderId) : isNull(folders.parentId),
				),
			);
		existingNames = new Set(existing.map((r) => r.name.toLowerCase()));
	} else {
		const existing = await ctx.db
			.select({ name: files.name })
			.from(files)
			.where(
				and(
					ownedFiles(ctx),
					eq(files.isTrashed, false),
					folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
				),
			);
		existingNames = new Set(existing.map((r) => r.name.toLowerCase()));
	}

	if (!existingNames.has(name.toLowerCase())) {
		return name;
	}

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

	let counter = 1;
	let newName = `${baseName} (${counter})${extension}`;
	while (existingNames.has(newName.toLowerCase())) {
		counter++;
		newName = `${baseName} (${counter})${extension}`;
	}
	return newName;
}

/** The untrashed file in a folder whose name matches, as `getUniqueDisplayName` compares. */
export async function findLiveSibling(
	ctx: StorageContext,
	name: string,
	folderId: string | null,
): Promise<File | undefined> {
	const siblings = await ctx.db
		.select()
		.from(files)
		.where(
			and(
				ownedFiles(ctx),
				eq(files.isTrashed, false),
				folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
			),
		);
	const wanted = name.toLowerCase();
	return siblings.find((file) => file.name.toLowerCase() === wanted);
}

/** A name as one path segment that is not one of the app's dot-directories. */
export function safeSegment(name: string): string {
	return name
		.trim()
		.replace(/[/\\]|\p{Cc}/gu, "_")
		.replace(/^\.+/, (dots) => "_".repeat(dots.length))
		.slice(0, 200);
}

/**
 * The segment a new or moved file or folder gets on disk under `parent`:
 * `fallback` (a UUID), or where the tree is browsed outside Penombre, its
 * name, suffixed before the extension until no row (trashed ones included:
 * they keep their bytes) holds it and it can be claimed on disk. `self` is
 * the item's own current path, free to keep.
 *
 * The claim (an empty file, or the directory) is what makes a name safe to
 * hand out: a transfer writes its row only after the worker copied the bytes,
 * so two copies of `a.wav` racing into one folder both found it free, and the
 * loser's cleanup deleted the winner's bytes. Every writer renames over it.
 */
export async function diskName(
	ctx: StorageContext,
	parent: string | undefined,
	name: string,
	{ fallback, self, file }: { fallback: string; self?: string; file?: boolean },
): Promise<string> {
	const base = ctx.namedPaths ? safeSegment(name) : "";
	if (!base) {
		return fallback;
	}
	const dot = file ? base.lastIndexOf(".") : -1;
	const [stem, extension] =
		dot > 0 ? [base.slice(0, dot), base.slice(dot)] : [base, ""];
	for (let n = 0; n < 1000; n++) {
		const segment = n === 0 ? base : `${stem} (${n})${extension}`;
		const path = parent ? `${parent}/${segment}` : segment;
		// A case-only rename is its own path: it must not be told it is taken.
		if (
			path.toLowerCase() === self?.toLowerCase() ||
			(await claim(ctx, path, file === true))
		) {
			return segment;
		}
	}
	return fallback;
}

/** Case-insensitive: a Syncthing peer on macOS cannot hold `a` beside `A`. */
async function claim(
	ctx: StorageContext,
	path: string,
	file: boolean,
): Promise<boolean> {
	// Unscoped: a share recipient's scope hides rows that still own a path.
	const unscoped = { ...ctx, scope: undefined };
	const [folder] = await ctx.db
		.select({ id: folders.id })
		.from(folders)
		.where(
			and(ownedFolders(unscoped), sql`lower(${folders.path}) = lower(${path})`),
		)
		.limit(1);
	if (folder) {
		return false;
	}
	const [row] = await ctx.db
		.select({ id: files.id })
		.from(files)
		.where(
			and(ownedFiles(unscoped), sql`lower(${files.path}) = lower(${path})`),
		)
		.limit(1);
	if (row) {
		return false;
	}
	const full = join(ctx.storagePath, path);
	try {
		await mkdir(dirname(full), { recursive: true });
		if (file) {
			await (await open(full, "wx")).close();
		} else {
			await mkdir(full);
		}
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "EEXIST") {
			return false;
		}
		return rethrowUnreachable(error, full);
	}
}
