import { error, redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { authCookieName, getServerSideApi } from "$lib/api";
import { route } from "$lib/ROUTES";
import { uploadSchema } from "$lib/schemas/upload";

export const load = async ({ cookies }) => {
	const authCookie = cookies.get("better-auth.session_token");
	if (!authCookie) {
		return redirect(307, route("/auth/sign-in"));
	}
	const api = getServerSideApi(authCookie);
	const {
		data: session,
		error: sessionError,
		response: sessionRes,
	} = await api.GET("/auth/get-session", {
		headers: {
			Cookie: `${authCookieName}=${authCookie}`,
		},
		credentials: "include",
	});

	if (sessionRes.status === 401) {
		return redirect(307, route("/auth/sign-in"));
	}

	if (sessionError) {
		return error(
			500,
			`Failed to retrieve user session: ${JSON.stringify(sessionError)} (${sessionRes.status})`,
		);
	}

	if (!session?.user) {
		return redirect(307, route("/auth/sign-in"));
	}

	const { data: activity, error: activityError } =
		await api.GET("/api/activity");
	if (activityError) {
		return error(
			500,
			`Failed to retrieve user activity: ${JSON.stringify(activityError)}`,
		);
	}

	return {
		user: session.user,
		session: session.session,
		activity: activity,
		uploadForm: await superValidate({}, valibot(uploadSchema)),
		authCookie,
	};
};
