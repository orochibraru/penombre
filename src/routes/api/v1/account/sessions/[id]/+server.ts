import { Http } from "#lib/server/http.js";
import { revokeAccountSession } from "#lib/server/openapi/v1/account.js";
import { revokeSession } from "#lib/server/services/account.js";

export const DELETE = revokeAccountSession.handler(
	async ({ params, user, event }) => {
		try {
			const revoked = await revokeSession(
				user.id,
				params.id,
				event.request.headers,
			);
			return revoked ? Http.Ok({ revoked }) : Http.NotFound("No such session");
		} catch (error) {
			return Http.ServerError("Failed to revoke the session", error);
		}
	},
);
