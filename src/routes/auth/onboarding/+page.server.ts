import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { resolve } from "$app/paths";
import { auth } from "$lib/server/auth";
import { getConfig } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { account as authAccount, user } from "$lib/server/db/schema";
import { getAppSettings } from "$lib/server/services/app-settings";

/** Accounts an admin registered have no credential row until they set one. */
async function needsPassword(email: string): Promise<boolean> {
	const db = getDb();
	const [account] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	if (!account) {
		return false;
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
	return credentials.length === 0;
}

export const load = async ({ url }) => {
	const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
	if (!(email && (await needsPassword(email)))) {
		// Nothing to do here — either no such account, or it already has a
		// password and belongs in the normal sign-in flow.
		return redirect(307, resolve("/auth/sign-in"));
	}

	const settings = await getAppSettings();
	return {
		email,
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
		const email = String(form.get("email") ?? "")
			.trim()
			.toLowerCase();
		const password = String(form.get("password") ?? "");
		const confirm = String(form.get("confirm") ?? "");

		if (!(await needsPassword(email))) {
			return fail(400, { error: "This account already has a password." });
		}
		if (password !== confirm) {
			return fail(400, { error: "The passwords do not match." });
		}

		const settings = await getAppSettings();
		const minLength = Math.max(
			getConfig().auth.minPasswordLength,
			settings.minPasswordLength ?? 8,
		);
		if (password.length < minLength) {
			return fail(400, {
				error: `Password must be at least ${minLength} characters.`,
			});
		}
		if ((settings.requireStrongPassword ?? false) && !isStrong(password)) {
			return fail(400, {
				error: "Password needs upper and lower case, a digit and a symbol.",
			});
		}

		const db = getDb();
		const [record] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);
		if (!record) {
			return fail(404, { error: "No account for that address." });
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
			return fail(500, { error: (err as Error).message });
		}

		return redirect(
			303,
			`${resolve("/auth/sign-in")}?email=${encodeURIComponent(email)}`,
		);
	},
};
