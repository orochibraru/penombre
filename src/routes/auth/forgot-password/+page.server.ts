import { error } from "@sveltejs/kit";
import { getPenombreConfig } from "$lib/server/config";

export const load = () => {
	const config = getPenombreConfig();

	if (!config.auth.enableEmailSignIn) {
		return error(404, "Email sign-in is not enabled");
	}

	return { config };
};
