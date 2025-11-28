import { redirect } from "@sveltejs/kit";
import { getApiClient, type User, type UserSession } from "$lib/api";
import { route } from "$lib/ROUTES";

let session: {
	session: UserSession;
	user: User;
} | null = null;

export const handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	if (path.startsWith("/auth/")) {
		session = null;
		return resolve(event);
	}
	const api = getApiClient({ fetch: event.fetch, url: event.url.origin });

	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;
		return resolve(event);
	}

	const {
		data: sessionData,
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
			`Failed to retrieve user session: ${JSON.stringify(
				sessionError,
			)} (${sessionRes.status})`,
		);
	}

	if (!sessionData) {
		throw redirect(307, route("/auth/sign-in"));
	}
	event.locals.user = sessionData.user;
	event.locals.session = sessionData.session;
	session = sessionData;
	return resolve(event);
};
