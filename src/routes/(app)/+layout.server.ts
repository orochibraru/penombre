import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { resolve } from "$app/paths";
import { api } from "$lib/api";
import { uploadSchema } from "$lib/schemas/upload";
import { getConfig, getVolumes } from "$lib/server/config";

export const load = async ({ fetch, url, locals, depends }) => {
	depends("app:preferences");
	// Check auth first before making API calls

	if (!(locals.user && locals.session)) {
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
		// Count fetch failure is non-critical, fall through to defaults
	} else if (fileCount.data?.data) {
		counts = fileCount.data.data as { trash: number; starred: number };
	}

	const isAdmin = locals.user.role === "admin";

	const config = getConfig();

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
		// Mounted volumes appear in the sidebar as extra drives. Simple mode
		// shares each one whole; full mode gives every user a subdirectory.
		volumes: getVolumes().map((volume) => ({
			name: volume.name,
			label: volume.label,
			readOnly: volume.readOnly,
		})),
		versionCheck: versionCheck.data?.data,
	};
};
