import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { getApiClient } from "$lib/api-client";
import { route } from "$lib/ROUTES";
import { uploadSchema } from "$lib/schemas/upload";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch, locals }) => {
	// Check auth first before making API calls
	if (!locals.user || !locals.session) {
		return redirect(302, route("/auth/sign-in"));
	}

	const client = getApiClient(fetch);

	const res = await client.activity.$get();
	// If 401, user is not authenticated - redirect to signin
	if (res.status === 401) {
		return redirect(302, route("/auth/sign-in"));
	}
	if (!res.ok) {
		throw new Error(`Failed to retrieve user activity: ${res.status}`);
	}

	const activity = await res.json();

	return {
		user: locals.user,
		session: locals.session,
		activity,
		uploadForm: await superValidate({}, valibot(uploadSchema)),
		authCookie: "123",
	};
};
