import { Logger } from "#lib/logger.js";
import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import { getConfig } from "#lib/server/config.js";
import { isRateLimited } from "#lib/server/rate-limit.js";
import { getSmtpSettings } from "#lib/server/services/app-settings.js";

const logger = new Logger("auth/password-link");

/** Whether this instance can mail a link to set a password at all. */
export async function canMailPasswordLinks(): Promise<boolean> {
	const methods = await instanceSignInMethods();
	return methods.password && (await getSmtpSettings()) !== null;
}

/**
 * Mail a link to set the password of `email`'s account: a forgotten one, or
 * an invited account's first, since `resetPassword` creates the credential.
 * Receiving the mail is the proof of ownership, as it is for the admin's
 * invite. The answer never says whether the address has an account.
 */
export async function requestPasswordLink(
	email: string,
	clientAddress: string,
): Promise<"sent" | "unavailable" | "limited"> {
	if (!(await canMailPasswordLinks())) {
		return "unavailable";
	}
	const limited =
		(await isRateLimited(`password-link:${clientAddress}`, {
			max: 10,
			windowSeconds: 15 * 60,
		})) ||
		(await isRateLimited(`password-link-to:${email}`, {
			max: 3,
			windowSeconds: 15 * 60,
		}));
	if (limited) {
		return "limited";
	}
	await auth.api
		.requestPasswordReset({
			body: { email, redirectTo: `${getConfig().origin}/auth/reset-password` },
		})
		.catch((error: unknown) => {
			// Already logged with its reason by the sender; nothing to tell the
			// caller that would not also tell them whether the address exists.
			logger.warn("A password link was not sent", error);
		});
	return "sent";
}
