import { fail, redirect } from "@sveltejs/kit";
import { auth } from "#lib/server/auth/index.js";
import { resolve } from "$app/paths";

function signIn(url: URL): string {
	return `${resolve("auth/sign-in")}?next=${encodeURIComponent(url.pathname + url.search)}`;
}

/**
 * Where the sync client's code is approved. Verifying binds the code to the
 * signed-in user, which approving then requires.
 */
export const load = async ({ url, locals, request }) => {
	if (!locals.user) {
		return redirect(302, signIn(url));
	}
	const userCode = url.searchParams.get("user_code")?.trim() ?? "";
	if (!userCode) {
		return { userCode: null, pending: false };
	}
	const verified = await auth.api
		.deviceVerify({ query: { user_code: userCode }, headers: request.headers })
		.catch(() => null);
	return { userCode, pending: verified?.status === "pending" };
};

async function decide(
	event: { request: Request; locals: App.Locals; url: URL },
	approve: boolean,
) {
	if (!event.locals.user) {
		return redirect(302, signIn(event.url));
	}
	const userCode = String(
		(await event.request.formData()).get("userCode") ?? "",
	);
	const call = approve ? auth.api.deviceApprove : auth.api.deviceDeny;
	const done = await call({
		body: { userCode },
		headers: event.request.headers,
	}).catch(() => null);
	if (!done) {
		return fail(400, { invalid: true });
	}
	return { decision: approve ? ("approved" as const) : ("denied" as const) };
}

export const actions = {
	approve: (event) => decide(event, true),
	deny: (event) => decide(event, false),
};
