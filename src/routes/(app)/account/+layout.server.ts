import { error } from "@sveltejs/kit";
import { isAuthBypassed } from "$lib/server/config";

export const load = () => {
	// Nobody signs in under auth bypass — there's no account to manage.
	if (isAuthBypassed()) {
		return error(404);
	}

	return { hasCustomMenu: true };
};
