import { isDriveOnly } from "#lib/server/auth/drive-only.js";
import { getVolumes, isSimpleMode } from "#lib/server/config.js";
import { Http } from "#lib/server/http.js";
import { listPlaces } from "#lib/server/openapi/v1/places.js";
import { drivesService } from "#lib/server/services/drives.js";
import { SharingService } from "#lib/server/services/sharings.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

const sharings = new SharingService();

/** The sidebar's lists, by the same rules as `(app)/+layout.server.ts`. */
export const GET = listPlaces.handler(async ({ user, event }) => {
	try {
		const simple = isSimpleMode();
		const driveOnly = isDriveOnly(user);
		const [drives, shared] = simple
			? [[], []]
			: await Promise.all([
					drivesService.listForUser(user.id),
					driveOnly ? [] : sharings.listSharedWithMe(user.id),
				]);
		let counts = { trash: 0, starred: 0 };
		if (!driveOnly) {
			const own = await storageServiceFor(
				event.locals.storageOwner ?? user,
				event,
			);
			const [trash, starred] = await Promise.all([
				own.countTrashedItems(),
				own.countStarredItems(),
			]);
			counts = { trash, starred };
		}
		return Http.Ok({
			drives: drives.map((drive) => ({
				id: drive.id,
				name: drive.name,
				role: drive.role,
			})),
			volumes: (driveOnly ? [] : getVolumes()).map((volume) => ({
				name: volume.name,
				label: volume.label,
				readOnly: volume.readOnly,
			})),
			sharedWithMe: shared.map((grant) => ({
				id: grant.sharedWithId,
				resourceType: grant.resourceType,
				resourceId: grant.resourceId,
				name: grant.name,
				category: grant.category,
				root: grant.path,
				ownerName: grant.owner.name,
				permission: grant.permission,
			})),
			counts,
			simpleMode: simple,
			driveOnly,
		});
	} catch (error) {
		return Http.ServerError("Failed to list places", error);
	}
});
