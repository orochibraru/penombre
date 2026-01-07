import { error } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";

export const load = async ({ request }) => {
	try {
		const users = await auth.api.listUsers({
			query: {},
			headers: request.headers,
		});
		return { users };
	} catch (err) {
		console.error("Error loading users:", err);
		return error(500, "Failed to load users");
	}
};
