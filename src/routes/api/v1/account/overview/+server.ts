import { Http } from "#lib/server/http.js";
import { getAccountOverview } from "#lib/server/openapi/v1/account.js";
import { accountOverview } from "#lib/server/services/account.js";

export const GET = getAccountOverview.handler(async ({ user }) => {
	try {
		return Http.Ok(await accountOverview(user));
	} catch (error) {
		return Http.ServerError("Failed to read the account", error);
	}
});
