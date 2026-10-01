import { auth } from "#lib/server/auth/index.js";
import { Http } from "#lib/server/http.js";
import { updateAccountProfile } from "#lib/server/openapi/v1/account.js";
import {
	accountOverview,
	updateProfile,
} from "#lib/server/services/account.js";

export const PATCH = updateAccountProfile.handler(
	async ({ body, user, event }) => {
		try {
			const refused = await updateProfile(user, event.request.headers, body);
			if (refused) {
				return Http.BadRequest(refused.message, { code: refused.error });
			}
			// Read back: the session's copy of the user predates the change.
			const fresh = await auth.api.getSession({
				headers: event.request.headers,
				query: { disableCookieCache: true },
			});
			return Http.Ok(await accountOverview(fresh?.user ?? user));
		} catch (error) {
			return Http.ServerError("Failed to update the profile", error);
		}
	},
);
