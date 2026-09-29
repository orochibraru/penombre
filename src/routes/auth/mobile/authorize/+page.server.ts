import { redirect } from "@sveltejs/kit";
import { signInReturningTo } from "#lib/next.js";
import { createMobileCode, MOBILE_REDIRECT } from "#lib/server/auth/mobile.js";

/** The app's request, or null when it is malformed. */
function request(url: URL) {
	const challenge = url.searchParams.get("code_challenge") ?? "";
	const state = url.searchParams.get("state") ?? "";
	const device = (url.searchParams.get("device") ?? "").slice(0, 64);
	// Only the app's own scheme: anything else would hand the code to a site.
	const valid =
		/^[\w-]{43}$/.test(challenge) &&
		state.length > 0 &&
		state.length <= 128 &&
		url.searchParams.get("redirect_uri") === MOBILE_REDIRECT;
	return valid ? { challenge, state, device: device || "phone" } : null;
}

export const load = ({ url, locals }) => {
	if (!locals.user) {
		redirect(302, signInReturningTo(url));
	}
	const req = request(url);
	return { device: req?.device ?? null };
};

export const actions = {
	approve: async ({ url, locals }) => {
		if (!locals.user) {
			redirect(302, signInReturningTo(url));
		}
		const req = request(url);
		if (!req) {
			return { invalid: true };
		}
		const code = await createMobileCode({
			userId: locals.user.id,
			challenge: req.challenge,
			device: req.device,
		});
		const target = new URL(MOBILE_REDIRECT);
		target.searchParams.set("code", code);
		target.searchParams.set("state", req.state);
		redirect(303, target.toString(), { external: true });
	},
};
