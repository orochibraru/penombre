import { Http } from "#lib/server/http.js";
import { setAccountSignInMethod } from "#lib/server/openapi/v1/account.js";
import { setPreferredSignInMethod } from "#lib/server/services/account.js";

export const PUT = setAccountSignInMethod.handler(async ({ body, user }) => {
	try {
		const refused = await setPreferredSignInMethod(user.id, body.method);
		if (refused) {
			return Http.BadRequest(refused.message, { code: refused.error });
		}
		return Http.Ok({ method: body.method });
	} catch (error) {
		return Http.ServerError("Failed to save the sign-in method", error);
	}
});
