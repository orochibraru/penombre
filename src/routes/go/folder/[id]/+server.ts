import { error, redirect } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { getVolume } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { folders, sharedWith, sharings } from "#lib/server/db/schema.js";
import { drivesService } from "#lib/server/services/drives.js";

/**
 * A folder link anyone on the instance can open.
 *
 * A browse URL means something different per viewer: `/browse/<path>` is the
 * viewer's own drive, and a folder shared with them lives under their own
 * `/shared-with-me/<grant>`. So the link names the folder, and this sends each
 * viewer to wherever they can reach it — 404, never 403, when they cannot, so
 * a guessed id does not reveal that it exists.
 */
export const GET = async ({ params, locals }) => {
	const viewer = locals.user;
	if (!viewer) {
		return redirect(303, "/auth/sign-in");
	}

	const db = getDb();
	const [folder] = await db
		.select()
		.from(folders)
		.where(and(eq(folders.id, params.id), eq(folders.isTrashed, false)));
	if (!folder) {
		return error(404, "Folder not found");
	}
	// Mounted volumes use real names, which a Location header must encode.
	const path = folder.path.split("/").map(encodeURIComponent).join("/");

	if (folder.volumeId === null) {
		if (folder.ownerId === locals.storageOwner?.id) {
			return redirect(303, `/browse/${path}`);
		}
		// A personal folder's path is its ancestors' ids, so a grant on it or
		// on any folder above it is one lookup.
		const [grant] = await db
			.select({ id: sharedWith.id })
			.from(sharedWith)
			.innerJoin(sharings, eq(sharings.id, sharedWith.sharingId))
			.where(
				and(
					eq(sharedWith.userId, viewer.id),
					eq(sharings.ownerId, folder.ownerId),
					eq(sharings.resourceType, "folder"),
					inArray(sharings.resourceId, folder.path.split("/")),
				),
			)
			.limit(1);
		if (grant) {
			return redirect(303, `/shared-with-me/${grant.id}/${path}`);
		}
		return error(404, "Folder not found");
	}

	if (folder.volumeId.startsWith("drive:")) {
		const driveId = folder.volumeId.slice("drive:".length);
		const access = await drivesService
			.requireAccess(driveId, viewer.id)
			.catch(() => null);
		if (!access) {
			return error(404, "Folder not found");
		}
		return redirect(303, `/drives/${driveId}/${path}`);
	}

	if (getVolume(folder.volumeId)) {
		return redirect(303, `/volumes/${folder.volumeId}/${path}`);
	}
	return error(404, "Folder not found");
};
