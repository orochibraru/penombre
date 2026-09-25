/**
 * Folders and files Penombre created before it named them after themselves
 * sit on disk as `<uuid>` / `<uuid>.<ext>`: unreadable on a Syncthing peer.
 * Each scan pass of a named tree renames them to their display names. It runs
 * inside the pass, so the scan never sees a renamed path without its row
 * (which it would import twice, and drop the old row with its stars and notes).
 */

import { rename, rm, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, like, or, sql } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { files, folders } from "#lib/server/db/schema.js";
import type { StorageContext } from "./context";
import { diskName } from "./lookups";
import { ownedFiles, ownedFolders } from "./scope";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("UuidNames");

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const FOLDER_SEGMENT = new RegExp(`^${UUID}$`);
const FILE_SEGMENT = new RegExp(`^${UUID}(\\.[^/]*)?$`);
/** Narrows the SQL before the regex; `_` is any one character. */
const UUID_LIKE = "%________-____-____-____-____________%";

interface Row {
	id: string;
	name: string;
	path: string;
}

function split(path: string): [string | undefined, string] {
	const at = path.lastIndexOf("/");
	return at < 0 ? [undefined, path] : [path.slice(0, at), path.slice(at + 1)];
}

/** Moves every row at or under `from` to `to`, by prefix. */
async function repath(ctx: StorageContext, from: string, to: string) {
	const cut = from.length + 1;
	for (const [table, owned] of [
		[folders, ownedFolders(ctx)],
		[files, ownedFiles(ctx)],
	] as const) {
		await ctx.db
			.update(table)
			.set({ path: sql`${to} || substr(${table.path}, ${cut})` })
			.where(
				and(
					owned,
					or(
						eq(table.path, from),
						sql`substr(${table.path}, 1, ${cut}) = ${`${from}/`}`,
					),
				),
			);
	}
}

async function uuidRows(ctx: StorageContext, kind: "folder" | "file") {
	const table = kind === "folder" ? folders : files;
	const pattern = kind === "folder" ? FOLDER_SEGMENT : FILE_SEGMENT;
	const rows: Row[] = await ctx.db
		.select({ id: table.id, name: table.name, path: table.path })
		.from(table)
		.where(
			and(
				kind === "folder" ? ownedFolders(ctx) : ownedFiles(ctx),
				like(table.path, UUID_LIKE),
			),
		);
	return rows
		.filter((row) => pattern.test(split(row.path)[1]))
		.toSorted((a, b) => a.path.split("/").length - b.path.split("/").length);
}

/** Returns how many were renamed. Never throws: the scan must go on. */
export async function nameUuidPaths(
	ctx: StorageContext,
	thumbnails: ThumbnailService,
): Promise<number> {
	let renamed = 0;
	const skipped = new Set<string>();
	for (const kind of ["folder", "file"] as const) {
		// Re-read after each one: renaming a folder moves the paths under it.
		for (;;) {
			const rows = await uuidRows(ctx, kind).catch(() => [] as Row[]);
			const row = rows.find((candidate) => !skipped.has(candidate.id));
			if (!row) {
				break;
			}
			if (await renameOne(ctx, thumbnails, row, kind)) {
				renamed++;
			} else {
				skipped.add(row.id);
			}
		}
	}
	if (renamed > 0) {
		await ctx.invalidateListingCaches();
	}
	return renamed;
}

async function renameOne(
	ctx: StorageContext,
	thumbnails: ThumbnailService,
	row: Row,
	kind: "folder" | "file",
): Promise<boolean> {
	try {
		return (await renameOnDisk(ctx, thumbnails, { ...row, kind })) !== row.path;
	} catch (error) {
		logger.error(`Could not rename ${row.path}`, error);
		return false;
	}
}

/**
 * Renames a file or folder on disk to `name` in its own folder, claimed like
 * any new name, and moves every row at or under it. Returns the new path, the
 * same one when nothing changed. Throws after putting the bytes back or
 * dropping the claim: the scan must never find a path no row owns.
 */
export async function renameOnDisk(
	ctx: StorageContext,
	thumbnails: ThumbnailService,
	{ path, name, kind }: { path: string; name: string; kind: "folder" | "file" },
): Promise<string> {
	const [parent, segment] = split(path);
	const wanted = await diskName(ctx, parent, name, {
		fallback: segment,
		file: kind === "file",
		self: path,
	});
	if (wanted === segment) {
		return path;
	}
	const to = parent ? `${parent}/${wanted}` : wanted;
	let moved = false;
	try {
		// Over the empty placeholder `diskName` claimed.
		await rename(join(ctx.storagePath, path), join(ctx.storagePath, to));
		moved = true;
		await repath(ctx, path, to);
		if (kind === "file") {
			await thumbnails.adopt(path, to);
			await thumbnails.deleteThumbnails(path);
		}
		return to;
	} catch (error) {
		const claimed = join(ctx.storagePath, to);
		await (moved
			? rename(claimed, join(ctx.storagePath, path))
			: kind === "folder"
				? rmdir(claimed)
				: rm(claimed, { force: true })
		).catch(() => undefined);
		throw error;
	}
}
