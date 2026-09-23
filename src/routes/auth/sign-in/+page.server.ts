import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import {
	auth,
	instanceSignInMethods,
	loadedOAuthProviders,
} from "#lib/server/auth/index.js";
import { getConfig, isAuthBypassed } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { user } from "#lib/server/db/schema.js";
import { isRateLimited } from "#lib/server/rate-limit.js";
import { isOAuthSignInEnabled } from "#lib/server/services/app-settings.js";
import {
	accountCredentials,
	effectivePreferred,
	hasAnyIdentity,
	methodsFor,
} from "#lib/server/services/auth-methods.js";
import { getUserPreferences } from "#lib/server/services/preferences.js";
import { resolve } from "$app/paths";

export const load = async ({ url, request }) => {
	const config = getConfig();

	// Escape hatch: /auth/sign-in?form always renders the form, so a broken IdP
	// or a locked-out admin can still reach email/passkey sign-in.
	const skip = url.searchParams.has("form");

	if (!skip) {
		if (isAuthBypassed()) {
			redirect(302, resolve("/(app)"));
		}

		if (config.autoRedirectProvider) {
			const { url: providerUrl } = await auth.api.signInSocial({
				body: {
					provider: config.autoRedirectProvider,
					callbackURL: resolve("/(app)"),
				},
				headers: request.headers,
			});
			if (providerUrl) {
				redirect(302, providerUrl, { external: true });
			}
		}
	}

	const methods = await instanceSignInMethods();

	return {
		// Named fields, never `config.auth` whole: that object carries the auth
		// secret and every provider's client secret, and this payload is
		// serialised into the sign-in page.
		authConfig: {
			// The email step also leads to the passwordless methods.
			enableEmailSignIn:
				methods.password || methods.magicLink || methods.emailOtp,
			enablePasskeySignIn: methods.passkey,
			enableOAuthSignIn: await isOAuthSignInEnabled(),
			oauthProviders: await loadedOAuthProviders(),
		},
	};
};

/**
 * Email-first sign-in: look up what the next step is for an address.
 *
 * An account registered by an admin has no password of its own yet, so it is
 * sent to onboarding to choose one instead of being asked for a password it
 * does not have. Otherwise it returns the methods this account can use and its
 * preferred one, if still usable.
 *
 * ponytail: this does confirm whether an address has an account, which a
 * combined email+password form does not. That is the accepted trade of every
 * email-first flow (Google, Microsoft, GitHub all do it); a per-IP throttle
 * (`isRateLimited`, not better-auth's; its limiter only covers
 * `/api/v1/auth/**`) caps how fast the endpoint can be walked. If
 * enumeration ever matters more than the flow, return `has-password`
 * unconditionally and let the password step fail instead. The method list
 * widens it slightly: it says whether the account holds a passkey.
 */
export const actions = {
	lookup: async ({ request, getClientAddress }) => {
		if (
			await isRateLimited(`sign-in-lookup:${getClientAddress()}`, {
				max: 30,
				windowSeconds: 5 * 60,
			})
		) {
			return fail(429, {
				step: "email",
				error: "Too many attempts. Try again later.",
			});
		}
		const form = await request.formData();
		const email = String(form.get("email") ?? "")
			.trim()
			.toLowerCase();

		if (!email) {
			return fail(400, { step: "email", error: "Enter your email address." });
		}

		const db = getDb();
		const [account] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		if (!account) {
			return fail(404, {
				step: "email",
				error: "No account for that address. Ask an admin to add you.",
			});
		}

		if (!(await hasAnyIdentity(account.id))) {
			// No password, no passkey, no OAuth account either: a genuine
			// pending invite. This is informational only; the onboarding page
			// itself requires the token an admin issued, so this cannot be used
			// to reach it for someone else's address.
			return { step: "onboarding", email };
		}
		const credentials = await accountCredentials(account.id);

		const methods = methodsFor(await instanceSignInMethods(), credentials);
		const { preferredSignInMethod } = await getUserPreferences(account.id);

		return {
			step: "password",
			email,
			methods,
			preferred: effectivePreferred(preferredSignInMethod, methods),
		};
	},
};
