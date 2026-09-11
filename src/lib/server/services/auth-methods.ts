/**
 * Guards against locking everyone out: one method must survive, and a method
 * in use cannot be removed. Magic link and emailed codes are exempt from the
 * second rule — they authenticate an address, not a stored credential.
 */

import { count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { account, user } from "$lib/server/db/schema";

/** better-auth writes password credentials under this provider id. */
const CREDENTIAL = "credential";

export interface SignInMethodState {
	/** Accounts holding a password, i.e. users who sign in with email. */
	credentialAccounts: number;
	/** Accounts per OAuth provider id. */
	oauthAccounts: Record<string, number>;
	/** Users with at least one passkey registered. */
	passkeyUsers: number;
	/** Total user rows, for reporting. */
	totalUsers: number;
}

/** How many accounts currently depend on each sign-in method. */
export async function getSignInMethodUsage(): Promise<SignInMethodState> {
	const db = getDb();

	const rows = await db
		.select({ providerId: account.providerId, total: count() })
		.from(account)
		.groupBy(account.providerId);

	const oauthAccounts: Record<string, number> = {};
	let credentialAccounts = 0;
	for (const row of rows) {
		if (row.providerId === CREDENTIAL) {
			credentialAccounts = Number(row.total);
		} else {
			oauthAccounts[row.providerId] = Number(row.total);
		}
	}

	const [users] = await db.select({ total: count() }).from(user);

	// Counted through `user` so a person with three passkeys counts once.
	const [passkeys] = await db
		.select({ total: sql<number>`count(distinct ${account.userId})` })
		.from(account)
		.where(inArray(account.providerId, ["passkey", "webauthn"]));

	return {
		credentialAccounts,
		oauthAccounts,
		passkeyUsers: Number(passkeys?.total ?? 0),
		totalUsers: Number(users?.total ?? 0),
	};
}

/** How many accounts would still have a way in if `providerId` were removed. */
export async function accountsWithOnly(providerId: string): Promise<number> {
	const db = getDb();
	const rows = await db
		.select({ userId: account.userId, providerId: account.providerId })
		.from(account);

	const byUser = new Map<string, Set<string>>();
	for (const row of rows) {
		const set = byUser.get(row.userId) ?? new Set<string>();
		set.add(row.providerId);
		byUser.set(row.userId, set);
	}

	let stranded = 0;
	for (const providers of byUser.values()) {
		if (providers.has(providerId) && providers.size === 1) {
			stranded += 1;
		}
	}
	return stranded;
}

export interface ProposedMethods {
	emailSignIn: boolean;
	magicLink: boolean;
	emailOtp: boolean;
	/** Enabled OAuth provider ids, from both env and the database. */
	oauthProviders: string[];
	/** Whether email can actually be delivered — the passwordless ones need it. */
	smtpAvailable: boolean;
}

/** The state before the change, so we only object to what is being removed. */
export interface CurrentMethods {
	emailSignIn: boolean;
	oauthProviders: string[];
}

/** Subject/verb agreement. */
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** How many usable ways in the proposal leaves. */
function remainingMethods(next: ProposedMethods): number {
	// A passwordless method with no way to send mail is not a way in.
	const magic = next.magicLink && next.smtpAvailable ? 1 : 0;
	const otp = next.emailOtp && next.smtpAvailable ? 1 : 0;
	return (next.emailSignIn ? 1 : 0) + magic + otp + next.oauthProviders.length;
}

function credentialMessage(n: number): string {
	const subject = plural(n, "account has", "accounts have");
	const it = plural(n, "it", "them");
	return `${n} ${subject} no sign-in method other than email and password. Link another provider to ${it} first, or delete ${it}.`;
}

function providerMessage(n: number, name: string): string {
	const subject = plural(n, "account signs", "accounts sign");
	const it = plural(n, "it", "them");
	return `${n} ${subject} in only with ${name}. Give ${it} another method before disabling it.`;
}

/** Returns why the change must be refused, or null when it is safe. */
export async function validateSignInMethods(
	next: ProposedMethods,
	current: CurrentMethods,
	/** How many accounts would be stranded by losing a provider. Injectable
	 *  so the rules can be exercised without a database. */
	stranded: (providerId: string) => Promise<number> = accountsWithOnly,
): Promise<string | null> {
	if ((next.magicLink || next.emailOtp) && !next.smtpAvailable) {
		return "Configure SMTP before enabling magic link or one-time code sign-in — without it the emails cannot be sent.";
	}

	if (remainingMethods(next) === 0) {
		return "At least one sign-in method must stay enabled, otherwise nobody can sign in.";
	}

	// Rule 2 — only for methods backed by a stored account row.
	if (current.emailSignIn && !next.emailSignIn) {
		const blocked = await stranded(CREDENTIAL);
		if (blocked > 0) {
			return credentialMessage(blocked);
		}
	}

	const removed = current.oauthProviders.filter(
		(name) => !next.oauthProviders.includes(name),
	);
	for (const name of removed) {
		const blocked = await stranded(name);
		if (blocked > 0) {
			return providerMessage(blocked, name);
		}
	}

	return null;
}

/** Users who have not enrolled in two-factor, for the require-2FA warning. */
export async function usersWithoutTwoFactor(): Promise<number> {
	const db = getDb();
	const [row] = await db
		.select({ total: count() })
		.from(user)
		.where(eq(user.twoFactorEnabled, false));
	return Number(row?.total ?? 0);
}
