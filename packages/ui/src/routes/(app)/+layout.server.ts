import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { getApiClient } from "$lib/api";
import { uploadSchema } from "$lib/schemas/upload";

export const load = async ({ fetch, locals, request }) => {
	const api = getApiClient({
		fetch,
		url: new URL(request.url),
		cookie: request.headers.get("cookie") || undefined,
	});

	const { data: activity, error: activityError } =
		await api.GET("/api/activity");
	if (activityError) {
		throw new Error(
			`Failed to retrieve user activity: ${JSON.stringify(activityError)}`,
		);
	}

	return {
		user: locals.user,
		session: locals.session,
		activity: activity,
		uploadForm: await superValidate({}, valibot(uploadSchema)),
		authCookie: "123",
	};
};
