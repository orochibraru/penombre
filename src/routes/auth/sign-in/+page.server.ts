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
import { isOAuthSignInEnabled } from "#lib/server/services/app-settings.js";
import {
	accountCredentials,
	effectivePreferred,
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
			// What the running process loaded, not what the settings currently
			// say: the plugins are built once at init, so a provider added
			// since boot has no endpoint yet and its button would only 404.
			oauthProviders: loadedOAuthProviders,
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
 * email-first flow (Google, Microsoft, GitHub all do it); better-auth's rate
 * limiter caps how fast the endpoint can be walked. If enumeration ever
 * matters more than the flow, return `has-password` unconditionally and let
 * the password step fail instead. The method list widens it slightly: it says
 * whether the account holds a passkey.
 */
export const actions = {
	lookup: async ({ request }) => {
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

		const credentials = await accountCredentials(account.id);
		if (!(credentials.hasPassword || credentials.hasPasskey)) {
			return { step: "onboarding", email };
		}

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
