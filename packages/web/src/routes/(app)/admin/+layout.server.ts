import { redirect } from "@sveltejs/kit";
import { route } from "$lib/ROUTES";

export const load = ({ locals }) => {
	if (!locals.user) {
		throw redirect(307, route("/auth/sign-in"));
	}

	const isAdmin = locals.user.role === "admin";
	if (!isAdmin) {
		throw redirect(307, route("/"));
	}
	return {
		hasCustomMenu: true,
	};
};
