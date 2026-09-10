import { error, fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { auth } from "$lib/server/auth";
import { getDb } from "$lib/server/db";
import { account } from "$lib/server/db/schema";

export const load = async ({ request }) => {
	try {
		const users = await auth.api.listUsers({
			query: {},
			headers: request.headers,
		});
		return { users };
	} catch {
		return error(500, "Failed to load users");
	}
};

/** Read a required string field, or null when it is missing/blank. */
function field(form: FormData, name: string): string | null {
	const value = form.get(name);
	return typeof value === "string" && value.trim() ? value : null;
}

export const actions = {
	/**
	 * Register an account by email so someone can sign in and finish setting
	 * it up themselves.
	 *
	 * Created without a password on purpose: the sign-in flow sends an account
	 * with no credential to onboarding, where they choose one. That avoids an
	 * admin ever knowing a user's password, and needs no mail server.
	 */
	inviteUser: async ({ request }) => {
		const form = await request.formData();
		const email = field(form, "email")?.trim().toLowerCase();
		const name = field(form, "name")?.trim();

		if (!(email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) {
			return fail(400, { error: "A valid email address is required." });
		}

		try {
			const created = await auth.api.createUser({
				headers: request.headers,
				body: {
					email,
					name: name || email.split("@")[0] || email,
					// better-auth requires a password to create an account.
					// This one is random, never shared, and deleted immediately
					// below — the account is left with no credential at all.
					password: crypto.randomUUID(),
					role: "user",
				},
			});

			// Dropping the credential row is what makes this an invitation
			// rather than an account with a password nobody knows: sign-in sees
			// no credential and routes the person to onboarding to choose one.
			await getDb()
				.delete(account)
				.where(
					and(
						eq(account.userId, created.user.id),
						eq(account.providerId, "credential"),
					),
				);

			return { success: true, invited: email };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	setRole: async ({ request }) => {
		const form = await request.formData();
		const userId = field(form, "userId");
		const role = field(form, "role");
		if (!userId || (role !== "admin" && role !== "user")) {
			return fail(400, { error: "A user and a valid role are required." });
		}
		try {
			await auth.api.setRole({
				headers: request.headers,
				body: { userId, role },
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	setBanned: async ({ request }) => {
		const form = await request.formData();
		const userId = field(form, "userId");
		if (!userId) {
			return fail(400, { error: "A user is required." });
		}
		// The button posts the state it wants, not a toggle — two admins acting
		// at once then converge instead of flipping each other's change.
		const banned = form.get("banned") === "true";
		try {
			if (banned) {
				await auth.api.banUser({
					headers: request.headers,
					body: { userId, banReason: field(form, "reason") ?? undefined },
				});
			} else {
				await auth.api.unbanUser({
					headers: request.headers,
					body: { userId },
				});
			}
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	removeUser: async ({ request, locals }) => {
		const form = await request.formData();
		const userId = field(form, "userId");
		if (!userId) {
			return fail(400, { error: "A user is required." });
		}
		// Deleting yourself locks the instance out of its own admin panel.
		if (userId === locals.user?.id) {
			return fail(400, { error: "You cannot delete your own account." });
		}
		try {
			await auth.api.removeUser({
				headers: request.headers,
				body: { userId },
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},
};
