import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { building } from "$app/environment";
import { getApiClient } from "$lib/api";
import { route } from "$lib/ROUTES";
import { uploadSchema } from "$lib/schemas/upload";

export const load = async ({ fetch }) => {
	if (building) {
		return {
			user: {
				id: "",
				name: "",
				email: "",
				image: "",
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			session: {
				id: "",
				userId: "",
				expiresAt: new Date(),
				token: "",
				ipAddress: "",
				userAgent: "",
			},
			activity: [],
			uploadForm: await superValidate({}, valibot(uploadSchema)),
			authCookie: "123",
		};
	}

	const api = getApiClient(fetch);

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
