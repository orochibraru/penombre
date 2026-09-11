/**
 * Row scoping for volumes.
 *
 * Every `files`/`folders` query is scoped to an owner *and* a volume. A
 * service bound to `/mnt/media` must never see the main drive's rows, and the
 * main drive must never see a volume's — paths are only unique within a
 * volume, so an unscoped query would happily match the wrong row.
 *
 * The main drive stores `volumeId: null`, which is also what every row created
 * before volumes existed has, so the default scope needs no migration.
 */

import { and, eq, isNull, type SQL } from "drizzle-orm";
import { files, folders } from "$lib/server/db/schema";
import type { StorageContext } from "./context";

/** `volume_id = <name>`, or `volume_id IS NULL` for the main drive. */
function onVolume(
	column: typeof files.volumeId | typeof folders.volumeId,
	volumeId: string | null,
): SQL | undefined {
	return volumeId === null ? isNull(column) : eq(column, volumeId);
}

/** Files belonging to this context's user, on this context's volume. */
export function ownedFiles(ctx: StorageContext): SQL | undefined {
	return and(
		eq(files.ownerId, ctx.user.id),
		onVolume(files.volumeId, ctx.volumeId),
	);
}

/** Folders belonging to this context's user, on this context's volume. */
export function ownedFolders(ctx: StorageContext): SQL | undefined {
	return and(
		eq(folders.ownerId, ctx.user.id),
		onVolume(folders.volumeId, ctx.volumeId),
	);
}

/** The `volumeId` to stamp on rows this context creates. */
export function volumeIdFor(ctx: StorageContext): string | null {
	return ctx.volumeId;
}
