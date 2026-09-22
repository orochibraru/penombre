import { error, fail } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { auth } from "#lib/server/auth/index.js";
import { requireAdmin } from "#lib/server/auth/require-admin.js";
import { getConfig } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { account, user as userTable } from "#lib/server/db/schema.js";
import { Email } from "#lib/server/email.js";
import { getSmtpSettings } from "#lib/server/services/app-settings.js";
import { createInvite } from "#lib/server/services/invites.js";

const logger = new Logger("admin/users");

export const load = async ({ request }) => {
	try {
		const users = await auth.api.listUsers({
			query: {},
			headers: request.headers,
		});

		// Which of them have no password set: only those can be (re)invited.
		// An account that already has a credential has finished onboarding.
		const userIds = users.users.map((u) => u.id);
		const credentialRows = userIds.length
			? await getDb()
					.select({ userId: account.userId })
					.from(account)
					.where(
						and(
							eq(account.providerId, "credential"),
							inArray(account.userId, userIds),
						),
					)
			: [];
		const withCredential = new Set(credentialRows.map((row) => row.userId));
		const invitable = userIds.filter((id) => !withCredential.has(id));

		// Emailing an invitation is only offered when a mail server is
		// configured; otherwise the admin passes the link on themselves.
		return {
			users,
			invitable,
			smtpEnabled: (await getSmtpSettings()) !== null,
			origin: getConfig().origin,
		};
	} catch {
		return error(500, "Failed to load users");
	}
};

/**
 * Send the invitation, returning a message when it could not go out.
 *
 * Never throws: the account exists by this point, and a mail failure should be
 * reported rather than undo it.
 */
async function sendInvite(
	email: string,
	onboardingUrl: string,
): Promise<string | null> {
	if (!(await getSmtpSettings())) {
		return null;
	}
	try {
		const mail = await Email.create({
			to: email,
			subject: `You have been added to ${getConfig().appName}`,
			content: `An account has been created for you. Open ${onboardingUrl} to choose a password.`,
		});
		await mail.send();
		return null;
	} catch (error) {
		return (error as Error).message;
	}
}

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
	 * Always created without a usable password: the sign-in flow sends an
	 * account with no credential to onboarding, where they choose one. There
	 * is deliberately no way for an admin to set someone's password — that
	 * would mean a second person knowing a credential the owner believes is
	 * theirs alone, and it survives in whatever channel it was passed through.
	 */
	inviteUser: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const email = field(form, "email")?.trim().toLowerCase();
		const name = field(form, "name")?.trim();
		const sendEmail = form.get("sendEmail") === "on";

		if (!(email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) {
			return fail(400, { error: "A valid email address is required." });
		}

		try {
			const created = await auth.api.createUser({
				headers: request.headers,
				body: {
					email,
					name: name || email.split("@")[0] || email,
					// Random, never shared, and deleted immediately below —
					// `createUser` demands one, so this satisfies it and goes.
					password: crypto.randomUUID(),
					role: "user",
				},
			});

			// Dropping the credential row is what makes this an invitation
			// rather than an account with a password nobody knows: sign-in
			// sees no credential and sends them to onboarding.
			await getDb()
				.delete(account)
				.where(
					and(
						eq(account.userId, created.user.id),
						eq(account.providerId, "credential"),
					),
				);

			// The token, not the address, is what proves this request is the
			// invite; anyone who can guess an email must not be able to reach
			// onboarding for it.
			const token = await createInvite(
				created.user.id,
				locals.user?.id ?? null,
			);
			const onboardingUrl = `${getConfig().origin}/auth/onboarding?token=${token}`;

			const mailFailed = sendEmail
				? await sendInvite(email, onboardingUrl)
				: null;
			if (mailFailed) {
				// The account is already usable; a failed mail is worth
				// reporting but not worth rolling back for.
				return { success: true, invited: email, mailFailed, onboardingUrl };
			}

			return {
				success: true,
				invited: email,
				// The admin still needs to pass this on by hand when mail is
				// off, or wants a fallback if it never arrives.
				onboardingUrl: sendEmail ? undefined : onboardingUrl,
			};
		} catch (err) {
			logger.error("Failed to invite a user", err);
			return fail(500, { error: "Failed to create the invite." });
		}
	},

	/**
	 * Mint a fresh invite link for an account that never finished onboarding:
	 * its first link expired (7 days) or predates the `invites` table.
	 * `createInvite` invalidates that account's older unused tokens itself, so
	 * only one link is ever live.
	 */
	resendInvite: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const userId = field(form, "userId");
		if (!userId) {
			return fail(400, { error: "A user is required." });
		}

		const [target] = await getDb()
			.select({ email: userTable.email })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);
		if (!target) {
			return fail(404, { error: "No such user." });
		}

		const hasCredential = await getDb()
			.select({ id: account.id })
			.from(account)
			.where(
				and(eq(account.userId, userId), eq(account.providerId, "credential")),
			)
			.limit(1);
		if (hasCredential.length > 0) {
			return fail(400, {
				error: "This account already has a password set.",
			});
		}

		const sendEmail = form.get("sendEmail") === "on";
		try {
			const token = await createInvite(userId, locals.user?.id ?? null);
			const onboardingUrl = `${getConfig().origin}/auth/onboarding?token=${token}`;

			const mailFailed = sendEmail
				? await sendInvite(target.email, onboardingUrl)
				: null;
			if (mailFailed) {
				return {
					success: true,
					invited: target.email,
					mailFailed,
					onboardingUrl,
				};
			}

			return {
				success: true,
				invited: target.email,
				onboardingUrl: sendEmail ? undefined : onboardingUrl,
			};
		} catch (err) {
			logger.error("Failed to resend an invite", err);
			return fail(500, { error: "Failed to resend the invite." });
		}
	},

	setRole: async ({ request, locals }) => {
		requireAdmin(locals);
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

	setBanned: async ({ request, locals }) => {
		requireAdmin(locals);
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
		requireAdmin(locals);
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
