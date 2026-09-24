/**
 * Versions of files replaced outside Penombre. Syncthing and rsync write a
 * temporary file and rename it over the old one, so the old bytes live on for
 * as long as another link to them does. The scan keeps that link, one per
 * file, beside the file's versions, and records the inode it saw. A new inode
 * at the path, on a file newer than its row, means an outside replace: the
 * link becomes a version. A program that writes into the file itself
 * (`rsync --inplace`) rewrites the linked bytes too, and nothing is kept.
 */

import { link, mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { File as DbFile } from "#lib/server/db/schema.js";
import type { StorageContext } from "./context";
import { bytesGone } from "./reconcile";
import type { ThumbnailService } from "./thumbnails";
import {
	type AdminVersioning,
	snapshot,
	versioningForFile,
	versionKey,
} from "./versions";

export function shadowKey(fileId: string): string {
	return `.versions/${fileId}/shadow`;
}

/**
 * Links the file's current bytes as its shadow. Never a copy: where the
 * filesystem refuses a hard link, the file simply goes without one.
 */
export async function relinkShadow(
	ctx: StorageContext,
	fileId: string,
	key: string,
): Promise<void> {
	const shadow = join(ctx.storagePath, shadowKey(fileId));
	try {
		await rm(shadow, { force: true });
		await mkdir(dirname(shadow), { recursive: true });
		await link(join(ctx.storagePath, key), shadow);
	} catch {
		// EXDEV, EPERM, a vanished file: no shadow, and no version later.
	}
}

/**
 * Keeps the shadow's bytes as a version, dated when they were current, with
 * the renders the file had for them. False when there is no shadow or the
 * file's folder does not version.
 */
export async function promoteShadow(
	ctx: StorageContext,
	thumbnails: ThumbnailService,
	file: Pick<
		DbFile,
		"id" | "path" | "contentType" | "name" | "updatedAt" | "folderId"
	>,
	admin: AdminVersioning,
): Promise<boolean> {
	if (await bytesGone(ctx, shadowKey(file.id))) {
		return false;
	}
	const versioning = await versioningForFile(ctx, file, admin);
	if (!versioning.enabled) {
		return false;
	}
	const version = await snapshot(ctx, file, versioning.max, {
		place: (key) =>
			rename(
				join(ctx.storagePath, shadowKey(file.id)),
				join(ctx.storagePath, key),
			),
		dropThumbnails: (key) => thumbnails.deleteThumbnails(key),
		name: file.name,
		createdAt: file.updatedAt,
	});
	await thumbnails.adopt(file.path, versionKey(file.id, version.id));
	return true;
}
