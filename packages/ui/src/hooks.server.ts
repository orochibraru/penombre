import { redirect } from "@sveltejs/kit";
import { getApiClient } from "$lib/api";
import { route } from "$lib/ROUTES";

export const handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	if (path.startsWith("/auth/")) {
		return resolve(event);
	}

	const cookieHeader = event.request.headers.get("cookie");

	if (!cookieHeader) {
		throw redirect(307, route("/auth/sign-in"));
	}

	const api = getApiClient({
		fetch: event.fetch,
		cookie: cookieHeader,
		url: event.url,
	});

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

	// better-auth returns { session: null, user: null } when not authenticated
	if (!sessionData?.session || !sessionData?.user) {
		throw redirect(307, route("/auth/sign-in"));
	}
	event.locals.user = sessionData.user;
	event.locals.session = sessionData.session;
	return resolve(event);
};
