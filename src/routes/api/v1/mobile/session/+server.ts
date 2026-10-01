import { labelMobileSession } from "#lib/server/auth/mobile.js";
import { Http } from "#lib/server/http.js";
import { mobileSession } from "#lib/server/openapi/v1/mobile.js";

export const PUT = mobileSession.handler(async ({ body, event }) => {
	// A session only: an API key has no session of its own to name.
	if (!event.locals.session || event.request.headers.has("x-api-key")) {
		return Http.Forbidden("Sign in to name this session.");
	}
	const userAgent = await labelMobileSession(
		event.locals.session.id,
		body.device,
	);
	return Http.Ok({ userAgent });
});
