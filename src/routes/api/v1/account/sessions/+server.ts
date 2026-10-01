import { Http } from "#lib/server/http.js";
import { listAccountSessions } from "#lib/server/openapi/v1/account.js";
import { listSessions } from "#lib/server/services/account.js";

export const GET = listAccountSessions.handler(async ({ user, event }) => {
	try {
		return Http.Ok(await listSessions(user.id, event.locals.session?.id ?? ""));
	} catch (error) {
		return Http.ServerError("Failed to list sessions", error);
	}
});
