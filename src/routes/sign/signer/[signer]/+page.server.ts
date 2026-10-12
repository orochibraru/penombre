import { redirect } from "@sveltejs/kit";
import { signInReturningTo } from "#lib/next.js";
import {
	accountSigner,
	signingPage,
} from "#lib/server/services/signatures/page.js";

/**
 * A request as a notification links to it: no token, so it opens only for
 * the account it was addressed to, and 404s for anyone else.
 */
const page = signingPage((event) => accountSigner(event, event.params.signer));

export const load: typeof page.load = async (event) => {
	if (!event.locals.user) {
		redirect(303, signInReturningTo(event.url));
	}
	return await page.load(event);
};
export const actions = page.actions;
