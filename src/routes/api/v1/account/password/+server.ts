import { Http } from "#lib/server/http.js";
import { saveAccountPassword } from "#lib/server/openapi/v1/account.js";
import { savePassword } from "#lib/server/services/account.js";
import { accountCredentials } from "#lib/server/services/auth-methods.js";

export const POST = saveAccountPassword.handler(
	async ({ body, user, event }) => {
		try {
			const { hasPassword } = await accountCredentials(user.id);
			const refused = await savePassword(
				event.request.headers,
				body,
				hasPassword ? "change" : "set",
			);
			if (refused) {
				return Http.BadRequest(refused.message, {
					code: refused.error,
					...refused.errorParams,
				});
			}
			return Http.Ok({ saved: true });
		} catch (error) {
			return Http.ServerError("Failed to save the password", error);
		}
	},
);
