import { error } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";

export const load = async ({ request }) => {
	try {
		const sessions = await auth.api.listSessions({ headers: request.headers });
		return { sessions };
	} catch (err) {
		console.error("Error loading sessions:", err);
		return error(500, "Failed to load sessions");
	}
};
