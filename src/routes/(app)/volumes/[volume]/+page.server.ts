import { readdir } from "node:fs/promises";
import { error } from "@sveltejs/kit";
import type { User } from "better-auth";
import { getVolume, isSimpleMode } from "$lib/server/config";
import { isStorageUnavailable } from "$lib/server/errors";
import {
	loadSharedOwner,
	scanOnVisit,
} from "$lib/server/services/library-scan";
import { StorageService } from "$lib/server/services/storage";

/**
 * The env var that would share this volume whole, in the spelling the admin
 * has to type: the volume's id is the lowercased, hyphenated name.
 */
function sharedVariable(name: string): string {
	return `VOLUME_${name.toUpperCase().replace(/-/g, "_")}_SHARED`;
}

/**
 * Files sitting at the root of the mount, which a per-user volume shows to
 * nobody.
 *
 * This is the whole of "I mounted my library and the page is empty": in full
 * mode the driver is rooted at `<volume>/user-<id>`, so an existing tree is
 * invisible and the only thing that appears is a `user-<uuid>` folder nobody
 * asked for. Detected rather than explained in the docs alone, because the
 * page is where the question gets asked.
 */
async function hasFilesOutsideUserFolders(path: string): Promise<boolean> {
	try {
		const entries = await readdir(path, { withFileTypes: true });
		return entries.some(
			(entry) =>
				!(entry.name.startsWith("user-") || entry.name.startsWith(".")),
		);
	} catch {
		// Unreadable is a different problem, and `ensureUserDirectory` reports it.
		return false;
	}
}

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

	const perUser = !(volume.shared || isSimpleMode());

	try {
		await service.ensureUserDirectory();

		// A mounted directory is written from outside the app, so the rows only
		// match reality if we look — but not while the request waits.
		const scanning = scanOnVisit(`${volume.name}:${owner.id}`, () =>
			service.scanStorage().then(() => undefined),
		);

		return {
			volume: {
				name: volume.name,
				label: volume.label,
				readOnly: volume.readOnly,
				shared: volume.shared,
			},
			scanning,
			hidden: perUser && (await hasFilesOutsideUserFolders(volume.path)),
			sharedVariable: sharedVariable(volume.name),
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
