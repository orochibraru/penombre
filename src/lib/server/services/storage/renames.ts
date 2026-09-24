/**
 * Files renamed or moved on disk. Without this a scan saw one path vanish and
 * another appear: it deleted the row, and with it the file's versions, notes,
 * stars and shares, then imported the file again as new. A renamed file is
 * matched to the row it left, which then follows it.
 *
 * By inode first: a rename keeps it. Then by size and date, only when exactly
 * one vanished row and one new file share them: Syncthing re-creates a file it
 * cannot rename, keeping its date, and rows older than inodes have none.
 */

import { and, eq } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { sealedSize } from "#lib/server/crypto/envelope.js";
import { type File as DbFile, files } from "#lib/server/db/schema.js";
import type { StorageContext } from "./context";
import { determineCategory, determineContentType } from "./mappers";
import { ownedFiles } from "./scope";
import type { ThumbnailService } from "./thumbnails";

const logger = new Logger("StorageScan");

type Row = Pick<
	DbFile,
	| "id"
	| "path"
	| "size"
	| "updatedAt"
	| "inode"
	| "name"
	| "contentType"
	| "folderId"
>;

interface Disk {
	keys: string[];
	sizeByKey: Map<string, number>;
	mtimeByKey: Map<string, number>;
	inoByKey: Map<string, string>;
}

/** Whose rows, and the renders that follow them. */
interface Scope {
	ctx: StorageContext;
	thumbnails: ThumbnailService;
}

const seconds = (ms: number) => Math.floor(ms / 1000);
const signature = (size: number, ms: number) => `${size}@${seconds(ms)}`;

function parentOf(path: string): string | null {
	const at = path.lastIndexOf("/");
	return at === -1 ? null : path.slice(0, at);
}

/**
 * Moves each matched row to its file's new path, in place in `rows` too, so
 * the rest of the pass sees it as known rather than vanished. Returns how
 * many followed their file.
 */
export async function followRenames(
	scope: Scope,
	rows: Row[],
	disk: Disk,
	folderIdByPath: Map<string, string>,
): Promise<number> {
	const onDisk = new Set(disk.keys);
	const known = new Set(rows.map((row) => row.path));
	const appeared = disk.keys.filter((key) => !known.has(key));
	const vanished = rows.filter((row) => !onDisk.has(row.path));
	if (appeared.length === 0 || vanished.length === 0) {
		return 0;
	}

	const byInode = new Map(
		vanished.flatMap((row) => (row.inode ? [[row.inode, row] as const] : [])),
	);
	// A sealed file is bigger on disk than the plaintext its row records.
	const bySignature = new Map<string, Row[]>();
	for (const row of vanished) {
		const at = row.updatedAt.getTime();
		for (const size of new Set([row.size, sealedSize(row.size)])) {
			const key = signature(size, at);
			bySignature.set(key, [...(bySignature.get(key) ?? []), row]);
		}
	}
	const appearedSignature = (key: string) =>
		signature(disk.sizeByKey.get(key) ?? -1, disk.mtimeByKey.get(key) ?? 0);
	const appearedCount = new Map<string, number>();
	for (const key of appeared) {
		const sig = appearedSignature(key);
		appearedCount.set(sig, (appearedCount.get(sig) ?? 0) + 1);
	}

	const taken = new Set<string>();
	let followed = 0;
	for (const key of appeared) {
		const ino = disk.inoByKey.get(key);
		let row = ino ? byInode.get(ino) : undefined;
		if (!row) {
			const sig = appearedSignature(key);
			const candidates = (bySignature.get(sig) ?? []).filter(
				(candidate) => !taken.has(candidate.id),
			);
			if (candidates.length === 1 && appearedCount.get(sig) === 1) {
				row = candidates[0];
			}
		}
		if (!row || taken.has(row.id)) {
			continue;
		}
		taken.add(row.id);
		// The inode stays the row's: a match by size and date is a new one, and
		// the scan's inode check then relinks the file's shadow.
		await follow(
			scope,
			row,
			key,
			folderIdByPath.get(parentOf(key) ?? "") ?? null,
		);
		followed++;
	}
	return followed;
}

async function follow(
	{ ctx, thumbnails }: Scope,
	row: Row,
	key: string,
	folderId: string | null,
) {
	const from = row.path;
	const name = key.split("/").pop() ?? key;
	const contentType = determineContentType(name);
	await ctx.db
		.update(files)
		.set({
			path: key,
			name,
			folderId,
			contentType,
			category: determineCategory(name),
			// Restated, or `$onUpdate` stamps a rename with now.
			updatedAt: row.updatedAt,
		})
		.where(and(eq(files.id, row.id), ownedFiles(ctx)));
	await thumbnails.adopt(from, key);
	await thumbnails.deleteThumbnails(from);
	Object.assign(row, { path: key, name, folderId, contentType });
	logger.debug(`Followed a file renamed on disk: ${from} -> ${key}`);
}
