import { error, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { isAuthBypassed } from "$lib/server/config";

export const load = ({ locals }) => {
	// Nobody signs in under auth bypass — the shared owner is an admin by
	// accident of seeding, not a person who should reach user management.
	if (isAuthBypassed()) {
		return error(404);
	}

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
