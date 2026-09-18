import { error } from "@sveltejs/kit";
import { isSimpleMode } from "#lib/server/config.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { driveStorage, drivesService } from "#lib/server/services/drives.js";

/**
 * A drive's own trash.
 *
 * Without it a file trashed in a shared drive would be gone for good: the
 * personal `/trash` lists the caller's own rows, and a drive's belong to the
 * drive. Everything the listing then does — restore, delete, empty — goes
 * through the storage API, which the `drive` parameter already points here.
 */
export const load = async ({ params, locals, depends }) => {
	depends("app:files", "app:trash");

	if (isSimpleMode()) {
		return error(404);
	}
	if (!locals.user) {
		return error(401);
	}

	const { drive, role } = await drivesService
		.requireAccess(params.drive, locals.user.id)
		.catch((cause: unknown) => {
			if (cause instanceof DriveAccessError) {
				return error(cause.status, cause.message);
			}
			throw cause;
		});

	const service = await driveStorage(drive, role, locals.user);

	return {
		drive: {
			id: drive.id,
			name: drive.name,
			role,
			readOnly: role === "viewer",
		},
		files: { data: await service.listTrashFiles(), err: undefined },
		title: drive.name,
	};
};
