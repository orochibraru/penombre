import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { auth } from "#lib/server/auth/index.js";
import { getConfig } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { user } from "#lib/server/db/schema.js";
import { getAppSettings } from "#lib/server/services/app-settings.js";
import {
	consumeInvite,
	findValidInvite,
} from "#lib/server/services/invites.js";
import { resolve } from "$app/paths";

const logger = new Logger("auth/onboarding");

export const load = async ({ url }) => {
	const token = url.searchParams.get("token")?.trim() ?? "";
	const invite = token ? await findValidInvite(token) : null;
	if (!invite) {
		// Unknown, expired or already-used token; nothing to onboard here.
		return redirect(307, resolve("auth/sign-in"));
	}

	const [account] = await getDb()
		.select({ email: user.email })
		.from(user)
		.where(eq(user.id, invite.userId))
		.limit(1);
	if (!account) {
		return redirect(307, resolve("auth/sign-in"));
	}

	const settings = await getAppSettings();
	return {
		token,
		email: account.email,
		minLength: Math.max(
			getConfig().auth.minPasswordLength,
			settings.minPasswordLength ?? 8,
		),
		requireStrong: settings.requireStrongPassword ?? false,
	};
};

/** Mixed case, a digit and a symbol. */
function isStrong(password: string): boolean {
	return (
		/[a-z]/.test(password) &&
		/[A-Z]/.test(password) &&
		/\d/.test(password) &&
		/[^A-Za-z0-9]/.test(password)
	);
}

export const actions = {
	setPassword: async ({ request }) => {
		const form = await request.formData();
		const token = String(form.get("token") ?? "").trim();
		const password = String(form.get("password") ?? "");
		const confirm = String(form.get("confirm") ?? "");

		if (!token) {
			return fail(400, { error: "INVITE_INVALID" });
		}
		if (password !== confirm) {
			return fail(400, { error: "PASSWORD_MISMATCH" });
		}

		const settings = await getAppSettings();
		const minLength = Math.max(
			getConfig().auth.minPasswordLength,
			settings.minPasswordLength ?? 8,
		);
		if (password.length < minLength) {
			return fail(400, {
				error: "PASSWORD_TOO_SHORT",
				errorParams: { count: String(minLength) },
			});
		}
		if ((settings.requireStrongPassword ?? false) && !isStrong(password)) {
			return fail(400, { error: "PASSWORD_NOT_STRONG" });
		}

		// Atomic: a second submit, or a second tab, with the same token finds
		// it already used and fails rather than setting the password twice.
		const invite = await consumeInvite(token);
		if (!invite) {
			return fail(400, { error: "INVITE_EXPIRED" });
		}

		const [record] = await getDb()
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(eq(user.id, invite.userId))
			.limit(1);
		if (!record) {
			return fail(404, { error: "INVITE_NO_ACCOUNT" });
		}

		try {
			// The invite left this account with no credential at all, so there
			// is no current password to change and no admin session to act
			// through. Hash with better-auth's own hasher and write the row it
			// would have written, so the result is indistinguishable from a
			// normal sign-up.
			const ctx = await auth.$context;
			const hash = await ctx.password.hash(password);
			await ctx.internalAdapter.createAccount({
				userId: record.id,
				providerId: "credential",
				accountId: record.id,
				password: hash,
			});
		} catch (err) {
			logger.error("Failed to finish onboarding:", err);
			return fail(500, { error: "ONBOARDING_FAILED" });
		}

		return redirect(
			303,
			`${resolve("auth/sign-in")}?email=${encodeURIComponent(record.email)}`,
		);
	},
};
