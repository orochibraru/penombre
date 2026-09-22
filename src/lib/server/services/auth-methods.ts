/**
 * Guards against locking everyone out: one method must survive, and a method
 * in use cannot be removed. Magic link and emailed codes are exempt from the
 * second rule — they authenticate an address, not a stored credential.
 */

import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "#lib/server/db/index.js";
import {
	account,
	passkey,
	type SignInMethod,
	user,
} from "#lib/server/db/schema.js";

/** better-auth writes password credentials under this provider id. */
const CREDENTIAL = "credential";
/** Passkeys live in their own table; this names them among provider ids. */
const PASSKEY = "passkey";

/** Display order, also the order the sign-in page offers them in. */
export const SIGN_IN_METHODS: readonly SignInMethod[] = [
	"password",
	"passkey",
	"magicLink",
	"emailOtp",
];

export type InstanceMethods = Record<SignInMethod, boolean>;

/** Which instance-enabled methods this account can actually complete. */
export function methodsFor(
	instance: InstanceMethods,
	account: { hasPassword: boolean; hasPasskey: boolean },
): SignInMethod[] {
	return SIGN_IN_METHODS.filter((method) => {
		if (!instance[method]) {
			return false;
		}
		if (method === "password") {
			return account.hasPassword;
		}
		if (method === "passkey") {
			return account.hasPasskey;
		}
		return true;
	});
}

/** A preference for a method the account cannot use is no preference. */
export function effectivePreferred(
	preferred: SignInMethod | null | undefined,
	available: readonly SignInMethod[],
): SignInMethod | null {
	return preferred && available.includes(preferred) ? preferred : null;
}

/** Whether a user holds a password and at least one passkey. */
export async function accountCredentials(
	userId: string,
): Promise<{ hasPassword: boolean; hasPasskey: boolean }> {
	const db = getDb();
	const [credentials, passkeys] = await Promise.all([
		db
			.select({ id: account.id })
			.from(account)
			.where(
				and(eq(account.userId, userId), eq(account.providerId, CREDENTIAL)),
			)
			.limit(1),
		db
			.select({ id: passkey.id })
			.from(passkey)
			.where(eq(passkey.userId, userId))
			.limit(1),
	]);
	return {
		hasPassword: credentials.length > 0,
		hasPasskey: passkeys.length > 0,
	};
}

/**
 * Whether this account already has some way to sign in on its own: any
 * `account` row (password or OAuth) or a passkey.
 *
 * Broader than `accountCredentials`, which only asks about a password and a
 * passkey; an OAuth-only account holds neither, but is not a pending
 * invite either, so offering it onboarding would let anyone who knows the
 * address take it over.
 */
export async function hasAnyIdentity(userId: string): Promise<boolean> {
	const db = getDb();
	const [accounts, passkeys] = await Promise.all([
		db
			.select({ id: account.id })
			.from(account)
			.where(eq(account.userId, userId))
			.limit(1),
		db
			.select({ id: passkey.id })
			.from(passkey)
			.where(eq(passkey.userId, userId))
			.limit(1),
	]);
	return accounts.length > 0 || passkeys.length > 0;
}

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

	// better-auth keeps passkeys in their own table, not in `account`.
	const [passkeys] = await db
		.select({ total: sql<number>`count(distinct ${passkey.userId})` })
		.from(passkey);

	return {
		credentialAccounts,
		oauthAccounts,
		passkeyUsers: Number(passkeys?.total ?? 0),
		totalUsers: Number(users?.total ?? 0),
	};
}

/**
 * Accounts that use `providerId` and none of the `surviving` methods, i.e.
 * who would be locked out. A passkey counts as the provider `"passkey"`.
 */
export async function strandedAccounts(
	providerId: string,
	surviving: readonly string[],
): Promise<number> {
	const db = getDb();
	const [accounts, passkeys] = await Promise.all([
		db
			.select({ userId: account.userId, providerId: account.providerId })
			.from(account),
		db.select({ userId: passkey.userId }).from(passkey),
	]);

	const byUser = new Map<string, Set<string>>();
	const rows = [
		...accounts,
		...passkeys.map((row) => ({ userId: row.userId, providerId: PASSKEY })),
	];
	for (const row of rows) {
		const set = byUser.get(row.userId) ?? new Set<string>();
		set.add(row.providerId);
		byUser.set(row.userId, set);
	}

	let stranded = 0;
	for (const providers of byUser.values()) {
		if (
			providers.has(providerId) &&
			!surviving.some((method) => providers.has(method))
		) {
			stranded += 1;
		}
	}
	return stranded;
}

export interface ProposedMethods {
	emailSignIn: boolean;
	passkey: boolean;
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
	passkey: boolean;
	oauthProviders: string[];
}

/** Subject/verb agreement. */
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** How many usable ways in the proposal leaves. */
function remainingMethods(next: ProposedMethods): number {
	// A passwordless method with no way to send mail is not a way in.
	const magic = next.magicLink && next.smtpAvailable ? 1 : 0;
	const otp = next.emailOtp && next.smtpAvailable ? 1 : 0;
	return (
		(next.emailSignIn ? 1 : 0) +
		(next.passkey ? 1 : 0) +
		magic +
		otp +
		next.oauthProviders.length
	);
}

/** Stored-credential methods still enabled after the change. */
function survivingMethods(next: ProposedMethods): string[] {
	return [
		...(next.emailSignIn ? [CREDENTIAL] : []),
		...(next.passkey ? [PASSKEY] : []),
		...next.oauthProviders,
	];
}

function credentialMessage(n: number): string {
	const subject = plural(n, "account has", "accounts have");
	const it = plural(n, "it", "them");
	return `${n} ${subject} no sign-in method other than email and password. Register a passkey or link another provider to ${it} first, or delete ${it}.`;
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
	stranded: (
		providerId: string,
		surviving: readonly string[],
	) => Promise<number> = strandedAccounts,
): Promise<string | null> {
	if ((next.magicLink || next.emailOtp) && !next.smtpAvailable) {
		return "Configure SMTP before enabling magic link or one-time code sign-in — without it the emails cannot be sent.";
	}

	if (remainingMethods(next) === 0) {
		return "At least one sign-in method must stay enabled, otherwise nobody can sign in.";
	}

	// Rule 2 — only for methods backed by a stored account row.
	const surviving = survivingMethods(next);
	if (current.emailSignIn && !next.emailSignIn) {
		const blocked = await stranded(CREDENTIAL, surviving);
		if (blocked > 0) {
			return credentialMessage(blocked);
		}
	}

	if (current.passkey && !next.passkey) {
		const blocked = await stranded(PASSKEY, surviving);
		if (blocked > 0) {
			return providerMessage(blocked, "a passkey");
		}
	}

	const removed = current.oauthProviders.filter(
		(name) => !next.oauthProviders.includes(name),
	);
	for (const name of removed) {
		const blocked = await stranded(name, surviving);
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
