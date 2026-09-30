import { error } from "@sveltejs/kit";
import { activeSessions } from "#lib/server/auth/sessions.js";

export const load = async ({ locals }) => {
	if (!locals.user) {
		error(401, "Unauthorized");
	}
	return { sessions: await activeSessions(locals.user.id) };
};
