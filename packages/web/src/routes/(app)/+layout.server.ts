import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { resolve } from "$app/paths";
import { api } from "$lib/api";
import { uploadSchema } from "$lib/schemas/upload";
import { getPenombreConfig } from "$lib/server/config";
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

	const [activityResult, fileCount, preferences, versionCheck] =
		await Promise.all([
			api.GET("/api/v1/activity", { fetch, baseUrl: url.origin }),
			api.GET("/api/v1/storage/file/counts", { fetch, baseUrl: url.origin }),
			api.GET("/api/v1/preferences", { fetch, baseUrl: url.origin }),
			api.GET("/api/v1/version/check", { fetch, baseUrl: url.origin }),
		]);

	// Parse counts, default to 0 if failed
	let counts = { trash: 0, starred: 0 };
	if (fileCount.error) {
		console.error("Failed to load counts", fileCount.error);
	} else if (fileCount.data?.data) {
		counts = fileCount.data.data as { trash: number; starred: number };
	}

	const isAdmin = locals.user.role === "admin";

	const config = getPenombreConfig();

	return {
		user: locals.user,
		config,
		session: locals.session,
		activity: activityResult.data?.data,
		counts,
		preferences: preferences.data?.data,
		uploadForm: await superValidate({}, zod4(uploadSchema)),
		authCookie: "123",
		isAdmin,
		versionCheck: versionCheck.data?.data,
	};
};
