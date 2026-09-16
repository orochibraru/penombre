import { error } from "@sveltejs/kit";
import { isSimpleMode } from "$lib/server/config";
import { SharingService } from "$lib/server/services/sharings";

const sharings = new SharingService();

export const load = async ({ locals, depends }) => {
	if (isSimpleMode()) {
		return error(404);
	}
	depends("app:shares");
	if (!locals.user) {
		return { sharedWithMe: [] };
	}
	return { sharedWithMe: await sharings.listSharedWithMe(locals.user.id) };
};
