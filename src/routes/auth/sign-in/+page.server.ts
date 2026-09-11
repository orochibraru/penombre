import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { resolve } from "$app/paths";
import { auth } from "$lib/server/auth";
import { getConfig, isAuthBypassed } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { account as authAccount, user } from "$lib/server/db/schema";
import { getPasswordlessSettings } from "$lib/server/services/app-settings";

export const load = async ({ url, request }) => {
	const config = getConfig();

	// Escape hatch: /auth/sign-in?form always renders the form, so a broken IdP
	// or a locked-out admin can still reach email/passkey sign-in.
	const skip = url.searchParams.has("form");

	if (!skip) {
		if (isAuthBypassed()) {
			redirect(302, resolve("/"));
		}

		if (config.autoRedirectProvider) {
			const { url: providerUrl } = await auth.api.signInSocial({
				body: {
					provider: config.autoRedirectProvider,
					callbackURL: resolve("/"),
				},
				headers: request.headers,
			});
			if (providerUrl) {
				redirect(302, providerUrl);
			}
		}
	}

	return {
		authConfig: config.auth,
		// Both are already gated on SMTP being configured, so the form can
		// offer whatever comes back without checking mail separately.
		passwordless: await getPasswordlessSettings(),
	};
};

/**
 * Email-first sign-in: look up what the next step is for an address.
 *
 * An account registered by an admin has no password of its own yet, so it is
 * sent to onboarding to choose one instead of being asked for a password it
 * does not have.
 *
 * ponytail: this does confirm whether an address has an account, which a
 * combined email+password form does not. That is the accepted trade of every
 * email-first flow (Google, Microsoft, GitHub all do it); better-auth's rate
 * limiter caps how fast the endpoint can be walked. If enumeration ever
 * matters more than the flow, return `has-password` unconditionally and let
 * the password step fail instead.
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

		const credentials = await db
			.select({ id: authAccount.id })
			.from(authAccount)
			.where(
				and(
					eq(authAccount.userId, account.id),
					eq(authAccount.providerId, "credential"),
				),
			)
			.limit(1);

		return {
			step: credentials.length > 0 ? "password" : "onboarding",
			email,
		};
	},
};
