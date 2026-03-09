import { error } from "@sveltejs/kit";
import { getOpendriveConfig } from "$lib/server/config";

export const load = () => {
	const config = getOpendriveConfig();

	if (!config.auth.enableEmailSignIn) {
		return error(404, "Email sign-in is not enabled");
	}

	return { config };
};
