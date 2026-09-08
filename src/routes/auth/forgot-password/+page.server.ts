import { error } from "@sveltejs/kit";
import { getConfig } from "$lib/server/config";

export const load = () => {
	const config = getConfig();

	if (!config.auth.enableEmailSignIn) {
		return error(404, "Email sign-in is not enabled");
	}

	return { config };
};
