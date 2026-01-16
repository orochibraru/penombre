import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { getApiClient } from "$lib/api-client";
import { route } from "$lib/ROUTES";
import { uploadSchema } from "$lib/schemas/upload";
import { getUserPreferences } from "$lib/server/dto/preferences";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch, locals }) => {
	// Check auth first before making API calls

	if (!locals.user || !locals.session) {
		return redirect(302, route("/auth/sign-in"));
	}

	const client = getApiClient(fetch);

	const [activityRes, countsRes, preferences] = await Promise.all([
		client.activity.$get(),
		client.storage.objects.counts.$get(),
		getUserPreferences(locals.user.id),
	]);

	// If 401, user is not authenticated - redirect to signin
	if (activityRes.status === 401) {
		return redirect(302, route("/auth/sign-in"));
	}
	if (!activityRes.ok) {
		throw new Error(`Failed to retrieve user activity: ${activityRes.status}`);
	}

	const activity = await activityRes.json();

	// Parse counts, default to 0 if failed
	let counts = { trash: 0, starred: 0 };
	if (countsRes.ok) {
		counts = (await countsRes.json()) as { trash: number; starred: number };
	}

	const isAdmin = locals.user.role === "admin";

	return {
		user: locals.user,
		session: locals.session,
		activity,
		counts,
		preferences,
		uploadForm: await superValidate({}, valibot(uploadSchema)),
		authCookie: "123",
		isAdmin,
	};
};
