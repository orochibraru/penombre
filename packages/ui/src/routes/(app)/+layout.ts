import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { browser } from "$app/environment";
import { getApiClient } from "$lib/api";
import { route } from "$lib/ROUTES";
import { uploadSchema } from "$lib/schemas/upload";

export const load = async () => {
	// For static builds, return placeholder data
	// Auth will be checked client-side
	if (!browser) {
		return {
			user: null,
			session: null,
			activity: null,
			uploadForm: await superValidate({}, valibot(uploadSchema)),
			authCookie: null,
		};
	}

	// Client-side: check auth and load data
	const authCookie = document.cookie
		.split("; ")
		.find((row) => row.startsWith("better-auth.session_token="))
		?.split("=")[1];

	if (!authCookie) {
		throw redirect(307, route("/auth/sign-in"));
	}

	const api = getApiClient();

	const {
		data: session,
		error: sessionError,
		response: sessionRes,
	} = await api.GET("/auth/get-session", {
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
		authCookie,
	};
};
