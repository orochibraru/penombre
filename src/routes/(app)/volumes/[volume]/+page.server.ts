import { error } from "@sveltejs/kit";
import type { User } from "better-auth";
import { getVolume } from "$lib/server/config";
import { isStorageUnavailable } from "$lib/server/errors";
import { loadSharedOwner } from "$lib/server/services/library-scan";
import { StorageService } from "$lib/server/services/storage";

export const load = async ({ params, locals, depends }) => {
	depends("app:files");

	const volume = getVolume(params.volume);
	if (!volume) {
		return error(404, "No such volume");
	}
	if (!locals.storageOwner) {
		return error(401);
	}

	// Whose rows this volume's files are. A volume shared whole — simple mode,
	// or `VOLUME_<NAME>_SHARED` — belongs to the shared owner, or each account
	// scanning it would build a second set of rows for the same files. A
	// per-user volume is the session user's own subdirectory.
	const owner = volume.shared
		? ((await loadSharedOwner()) ?? locals.storageOwner)
		: locals.storageOwner;

	// The session user stays the actor, so the activity log names whoever
	// actually did the thing.
	const service = new StorageService(
		owner as User,
		volume,
		locals.user as User | undefined,
	);

	try {
		await service.ensureUserDirectory();

		// A mounted directory is written from outside the app, so the rows only
		// match reality if we look. The boot scanner runs as the shared owner,
		// which in full mode only covers that one account's subdirectory — so
		// each user reconciles their own the first time they open the volume.
		await service.scanStorage();

		return {
			volume: {
				name: volume.name,
				label: volume.label,
				readOnly: volume.readOnly,
			},
			files: await service.listFiles(),
		};
	} catch (cause) {
		// A mount the container has no rights on: say so, rather than the
		// generic 500 that tells the person to contact the admin they are.
		if (isStorageUnavailable(cause)) {
			return error(503, `Cannot read the files mounted at ${volume.path}`);
		}
		throw cause;
	}
};
