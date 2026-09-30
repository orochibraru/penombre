import { eq } from "drizzle-orm";
import {
	createMobileSession,
	redeemMobileCode,
	redeemPairCode,
} from "#lib/server/auth/mobile.js";
import { db } from "#lib/server/db/index.js";
import { user } from "#lib/server/db/schema.js";
import { Http } from "#lib/server/http.js";
import { mobileToken } from "#lib/server/openapi/v1/mobile.js";
import { isRateLimited } from "#lib/server/rate-limit.js";

export const POST = mobileToken.handler(async ({ body, event }) => {
	if (
		await isRateLimited(`mobile-token:${event.getClientAddress()}`, {
			max: 20,
			windowSeconds: 5 * 60,
		})
	) {
		return Http.TooManyRequests();
	}
	// With a verifier, a code from the browser sign-in; without, one a
	// signed-in browser showed as a QR code.
	const redeemed = body.code_verifier
		? await redeemMobileCode(body.code, body.code_verifier)
		: await redeemPairCode(body.code).then(
				(userId) => userId && { userId, device: body.device ?? "phone" },
			);
	if (!redeemed) {
		return Http.Unauthorized();
	}
	const [account] = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(eq(user.id, redeemed.userId));
	if (!account) {
		return Http.Unauthorized();
	}
	const session = await createMobileSession(account.id, redeemed.device);
	return Http.Ok({
		...session,
		expiresAt: session.expiresAt.toISOString(),
		user: account,
	});
});
