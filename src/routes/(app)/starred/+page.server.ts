import { error } from "@sveltejs/kit";
import { isSimpleMode } from "$lib/server/config";

export const load = () => {
	// Simple mode drops drive-only concepts — the nav hides this page, so does the router.
	if (isSimpleMode()) {
		return error(404);
	}
};
