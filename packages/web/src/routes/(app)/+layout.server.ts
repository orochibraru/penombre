import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { resolve } from "$app/paths";
import { api } from "$lib/api";
import { uploadSchema } from "$lib/schemas/upload";
import { getUserPreferences } from "$lib/server/services/preferences";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({
	fetch,
	url,
	locals,
	depends,
}) => {
	depends("app:preferences");
	// Check auth first before making API calls

	if (!locals.user || !locals.session) {
		return redirect(302, resolve("/auth/sign-in"));
	}

	const [activityResult, countsResult, preferences] = await Promise.all([
		api.GET("/api/v1/activity", { fetch, baseUrl: url.origin }),
		api.GET("/api/v1/storage/file/counts", { fetch, baseUrl: url.origin }),
		getUserPreferences(locals.user.id),
	]);

	// If 401, user is not authenticated - redirect to signin
	if (activityResult.response.status === 401) {
		return redirect(302, resolve("/auth/sign-in"));
	}
	if (activityResult.error) {
		throw new Error(
			`Failed to retrieve user activity: ${activityResult.response.status}`,
		);
	}

	const activity = activityResult.data?.data;

	// Parse counts, default to 0 if failed
	let counts = { trash: 0, starred: 0 };
	if (countsResult.error) {
		console.error("Failed to load counts", countsResult.error);
	} else if (countsResult.data?.data) {
		counts = countsResult.data.data as { trash: number; starred: number };
	}

	const isAdmin = locals.user.role === "admin";

	return {
		user: locals.user,
		session: locals.session,
		activity,
		counts,
		preferences,
		uploadForm: await superValidate({}, zod4(uploadSchema)),
		authCookie: "123",
		isAdmin,
	};
};
