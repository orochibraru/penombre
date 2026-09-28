/**
 * Folders pinned to the sidebar. They belong to the storage owner, so simple
 * mode's shared owner holds one list everyone sees, and full mode gives each
 * account its own.
 */

import { and, asc, eq, inArray, max } from "drizzle-orm";
import { getVolume } from "#lib/server/config.js";
import { type Database, db } from "#lib/server/db/index.js";
import {
	type Folder,
	folders,
	sharedWith,
	sharings,
	sidebarShortcuts,
} from "#lib/server/db/schema.js";
import { drivesService } from "#lib/server/services/drives.js";

export interface Shortcut {
	folderId: string;
	name: string;
	href: string;
}

/**
 * Where `viewerId` reaches a folder, or null when they cannot: a browse URL
 * means something different per viewer (their own drive, a grant under
 * `/shared-with-me`, a drive, a volume).
 */
export async function folderHref(
	folder: Folder,
	viewerId: string,
	storageOwnerId: string | undefined,
	database: Database = db,
): Promise<string | null> {
	// Mounted volumes use real names, which a URL must encode.
	const path = folder.path.split("/").map(encodeURIComponent).join("/");

	if (folder.volumeId === null) {
		if (folder.ownerId === storageOwnerId) {
			return `/browse/${path}`;
		}
		// A personal folder's path is its ancestors' ids, so a grant on it or
		// on any folder above it is one lookup.
		const [grant] = await database
			.select({ id: sharedWith.id })
			.from(sharedWith)
			.innerJoin(sharings, eq(sharings.id, sharedWith.sharingId))
			.where(
				and(
					eq(sharedWith.userId, viewerId),
					eq(sharings.ownerId, folder.ownerId),
					eq(sharings.resourceType, "folder"),
					inArray(sharings.resourceId, folder.path.split("/")),
				),
			)
			.limit(1);
		return grant ? `/shared-with-me/${grant.id}/${path}` : null;
	}

	if (folder.volumeId.startsWith("drive:")) {
		const driveId = folder.volumeId.slice("drive:".length);
		const access = await drivesService
			.requireAccess(driveId, viewerId)
			.catch(() => null);
		return access ? `/drives/${driveId}/${path}` : null;
	}

	return getVolume(folder.volumeId)
		? `/volumes/${folder.volumeId}/${path}`
		: null;
}

/** In order, and only those the viewer can still reach. */
export async function listShortcuts(
	ownerId: string,
	viewerId: string,
	database: Database = db,
): Promise<Shortcut[]> {
	const rows = await database
		.select({ folder: folders })
		.from(sidebarShortcuts)
		.innerJoin(folders, eq(folders.id, sidebarShortcuts.folderId))
		.where(
			and(eq(sidebarShortcuts.ownerId, ownerId), eq(folders.isTrashed, false)),
		)
		.orderBy(asc(sidebarShortcuts.position));
	const shortcuts: Shortcut[] = [];
	for (const { folder } of rows) {
		const href = await folderHref(folder, viewerId, ownerId, database);
		if (href) {
			shortcuts.push({ folderId: folder.id, name: folder.name, href });
		}
	}
	return shortcuts;
}

/** Appends; false when the viewer cannot reach the folder. */
export async function addShortcut(
	ownerId: string,
	viewerId: string,
	folderId: string,
	database: Database = db,
): Promise<boolean> {
	const [folder] = await database
		.select()
		.from(folders)
		.where(and(eq(folders.id, folderId), eq(folders.isTrashed, false)));
	if (!(folder && (await folderHref(folder, viewerId, ownerId, database)))) {
		return false;
	}
	const [last] = await database
		.select({ position: max(sidebarShortcuts.position) })
		.from(sidebarShortcuts)
		.where(eq(sidebarShortcuts.ownerId, ownerId));
	await database
		.insert(sidebarShortcuts)
		.values({
			id: crypto.randomUUID(),
			ownerId,
			folderId,
			position: (last?.position ?? -1) + 1,
		})
		.onConflictDoNothing();
	return true;
}

export async function removeShortcut(
	ownerId: string,
	folderId: string,
	database: Database = db,
): Promise<void> {
	await database
		.delete(sidebarShortcuts)
		.where(
			and(
				eq(sidebarShortcuts.ownerId, ownerId),
				eq(sidebarShortcuts.folderId, folderId),
			),
		);
}

/** `folderIds` is the whole list, in its new order. */
export async function reorderShortcuts(
	ownerId: string,
	folderIds: string[],
	database: Database = db,
): Promise<void> {
	for (const [position, folderId] of folderIds.entries()) {
		await database
			.update(sidebarShortcuts)
			.set({ position })
			.where(
				and(
					eq(sidebarShortcuts.ownerId, ownerId),
					eq(sidebarShortcuts.folderId, folderId),
				),
			);
	}
}
