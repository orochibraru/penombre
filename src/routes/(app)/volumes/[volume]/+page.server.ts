import { error } from "@sveltejs/kit";
import type { User } from "better-auth";
import { getVolume } from "$lib/server/config";
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

	// The storage owner, not the session user: simple mode shares a mounted
	// volume whole, so everyone reads the one owner's rows.
	const service = new StorageService(locals.storageOwner as User, volume);
	await service.ensureUserDirectory();

	// A mounted directory is written from outside the app, so the rows only
	// match reality if we look. The boot scanner runs as the shared owner,
	// which in full mode only covers that one account's subdirectory — so each
	// user reconciles their own the first time they open the volume.
	await service.scanStorage();

	return {
		volume: {
			name: volume.name,
			label: volume.label,
			readOnly: volume.readOnly,
		},
		files: await service.listFiles(),
	};
};
