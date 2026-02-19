import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";

export const load = ({ locals }) => {
	if (!locals.user) {
		throw redirect(307, resolve("/auth/sign-in"));
	}

	const isAdmin = locals.user.role === "admin";
	if (!isAdmin) {
		throw redirect(307, resolve("/"));
	}
	return {
		hasCustomMenu: true,
	};
};
