import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { getApiClient } from "$lib/api";
import { route } from "$lib/ROUTES";
import { uploadSchema } from "$lib/schemas/upload";
export const prerender = true;

export const load = async () => {
	const api = getApiClient();

	const {
		data: session,
		error: sessionError,
		response: sessionRes,
	} = await api.GET("/api/auth/get-session", {
		credentials: "include",
	});

	if (sessionRes.status === 401) {
		throw redirect(307, route("/auth/sign-in"));
	}

	if (sessionError) {
		throw new Error(
			`Failed to retrieve user session: ${JSON.stringify(sessionError)} (${sessionRes.status})`,
		);
	}

	if (!session?.user) {
		throw redirect(307, route("/auth/sign-in"));
	}

	const { data: activity, error: activityError } =
		await api.GET("/api/activity");
	if (activityError) {
		throw new Error(
			`Failed to retrieve user activity: ${JSON.stringify(activityError)}`,
		);
	}

	return {
		user: session.user,
		session: session.session,
		activity: activity,
		uploadForm: await superValidate({}, valibot(uploadSchema)),
		authCookie: "123",
	};
};
