import { and, eq, inArray, or } from "drizzle-orm";
import { editorKindForName } from "#lib/documents.js";
import { getVolume } from "#lib/server/config.js";
import { type Database, db } from "#lib/server/db/index.js";
import { sharedWith, sharings } from "#lib/server/db/schema.js";
import { drivesService } from "#lib/server/services/drives.js";

interface FileRow {
	id: string;
	name: string;
	ownerId: string;
	volumeId: string | null;
	path: string;
}

/**
 * Where `viewerId` opens a file, or null when they cannot: the editor for an
 * office file, the viewer for anything else, carrying the location that
 * viewer reaches it through. The file twin of `folderHref`.
 */
export async function fileHref(
	file: FileRow,
	viewerId: string,
	storageOwnerId: string | undefined,
	database: Database = db,
): Promise<string | null> {
	const base = `/${editorKindForName(file.name) ? "edit" : "view"}/${file.id}`;

	if (file.volumeId === null) {
		if (file.ownerId === storageOwnerId) {
			return base;
		}
		// A personal path is its ancestors' ids: a grant on the file or on any
		// folder above it is one lookup.
		const ancestors = file.path.split("/").slice(0, -1);
		const [grant] = await database
			.select({ id: sharedWith.id })
			.from(sharedWith)
			.innerJoin(sharings, eq(sharings.id, sharedWith.sharingId))
			.where(
				and(
					eq(sharedWith.userId, viewerId),
					eq(sharings.ownerId, file.ownerId),
					or(
						and(
							eq(sharings.resourceType, "file"),
							eq(sharings.resourceId, file.id),
						),
						ancestors.length > 0
							? and(
									eq(sharings.resourceType, "folder"),
									inArray(sharings.resourceId, ancestors),
								)
							: undefined,
					),
				),
			)
			.limit(1);
		return grant ? `${base}?share=${grant.id}` : null;
	}

	if (file.volumeId.startsWith("drive:")) {
		const driveId = file.volumeId.slice("drive:".length);
		const access = await drivesService
			.requireAccess(driveId, viewerId)
			.catch(() => null);
		return access ? `${base}?drive=${encodeURIComponent(driveId)}` : null;
	}

	return getVolume(file.volumeId)
		? `${base}?volume=${encodeURIComponent(file.volumeId)}`
		: null;
}
