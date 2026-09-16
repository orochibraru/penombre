import { error } from "@sveltejs/kit";
import { isSimpleMode } from "$lib/server/config";
import { drivesService } from "$lib/server/services/drives";

export const load = async ({ locals, depends }) => {
	// Simple mode is one drive shared by everyone already; a second sharing
	// model on top of it would mean nothing. The nav hides it, so does this.
	if (isSimpleMode()) {
		return error(404);
	}

	depends("app:drives");

	if (!locals.user) {
		return { drives: [] };
	}

	return { drives: await drivesService.listForUser(locals.user.id) };
};
