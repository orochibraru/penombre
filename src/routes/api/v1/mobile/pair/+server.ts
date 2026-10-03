import { createPairCode, pairingUrl } from "#lib/server/auth/mobile.js";
import { getConfig } from "#lib/server/config.js";
import { Http } from "#lib/server/http.js";
import { mobilePair } from "#lib/server/openapi/v1/mobile.js";
import { isRateLimited } from "#lib/server/rate-limit.js";

export const POST = mobilePair.handler(async ({ user, event }) => {
	// A session only: an API key must not be able to mint itself one.
	if (!event.locals.session || event.request.headers.has("x-api-key")) {
		return Http.Forbidden("Sign in to connect a phone.");
	}
	if (
		await isRateLimited(`mobile-pair:${user.id}`, {
			max: 20,
			windowSeconds: 5 * 60,
		})
	) {
		return Http.TooManyRequests();
	}
	const { code, expiresAt } = await createPairCode(user.id);
	return Http.Ok({
		url: pairingUrl(getConfig().origin, code),
		expiresAt: expiresAt.toISOString(),
	});
});
