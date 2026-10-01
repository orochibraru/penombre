/**
 * The signed-in account's own settings, shared by the web's form actions and
 * the API the mobile app calls: one set of rules, whichever client asks.
 */

import { and, eq } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { isDriveOnly } from "#lib/server/auth/drive-only.js";
import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import {
	passwordProblem,
	passwordRules,
} from "#lib/server/auth/password-rules.js";
import { activeSessions } from "#lib/server/auth/sessions.js";
import { getConfig, isSimpleMode } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { type SignInMethod, session } from "#lib/server/db/schema.js";
import {
	getAppSettings,
	getSmtpSettings,
	isTwoFactorRequired,
} from "#lib/server/services/app-settings.js";
import {
	accountCredentials,
	effectivePreferred,
	methodsFor,
} from "#lib/server/services/auth-methods.js";
import {
	getUserPreferences,
	updateUserPreferences,
} from "#lib/server/services/preferences.js";

const logger = new Logger("services/account.ts");

/** The signed-in user as the hooks resolved it. */
export type SessionUser = NonNullable<App.Locals["user"]>;

/** A refusal: a code the web translates, and a sentence for other clients. */
export interface AccountError {
	error: string;
	message: string;
	errorParams?: { count: string };
}

const refused = (
	error: string,
	message: string,
	errorParams?: { count: string },
): AccountError => ({ error, message, errorParams });

/** A strong way to sign in the administrator requires and the account lacks. */
export type Requirement = "twoFactor" | "passkey";

/** Where `unmetRequirements` reads the instance and the account; tests swap it. */
export interface RequirementSources {
	passkeyRequired: () => Promise<boolean>;
	twoFactorRequired: () => Promise<boolean>;
	passkeyEnabled: () => Promise<boolean>;
	hasPasskey: (userId: string) => Promise<boolean>;
}

const SOURCES: RequirementSources = {
	passkeyRequired: async () => (await getAppSettings()).requirePasskey ?? false,
	twoFactorRequired: isTwoFactorRequired,
	passkeyEnabled: async () => (await instanceSignInMethods()).passkey,
	hasPasskey: async (userId) => (await accountCredentials(userId)).hasPasskey,
};

/**
 * What the account must set up before using the app. A passkey is only asked
 * for while passkey sign-in is on, or the requirement could never be met.
 * The settings are read first: most instances require nothing.
 */
export async function unmetRequirements(
	user: { id: string; twoFactorEnabled?: boolean | null },
	sources: RequirementSources = SOURCES,
): Promise<Requirement[]> {
	const [passkey, twoFactor] = await Promise.all([
		sources.passkeyRequired(),
		sources.twoFactorRequired(),
	]);
	const unmet: Requirement[] = [];
	if (twoFactor && !user.twoFactorEnabled) {
		unmet.push("twoFactor");
	}
	if (
		passkey &&
		(await sources.passkeyEnabled()) &&
		!(await sources.hasPasskey(user.id))
	) {
		unmet.push("passkey");
	}
	return unmet;
}

/** Everything a settings screen needs to know about the account at once. */
export async function accountOverview(user: SessionUser) {
	const [
		credentials,
		instance,
		preferences,
		rules,
		smtp,
		required,
		settings,
		requirements,
	] = await Promise.all([
		accountCredentials(user.id),
		instanceSignInMethods(),
		getUserPreferences(user.id),
		passwordRules(),
		getSmtpSettings(),
		isTwoFactorRequired(),
		getAppSettings(),
		unmetRequirements(user),
	]);
	const signInMethods = methodsFor(instance, credentials);
	return {
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image ?? null,
			role: user.role ?? "user",
			emailVerified: user.emailVerified,
			twoFactorEnabled: !!user.twoFactorEnabled,
			createdAt: user.createdAt.toISOString(),
		},
		hasPassword: credentials.hasPassword,
		passwordRules: rules,
		signInMethods,
		preferredSignInMethod: effectivePreferred(
			preferences.preferredSignInMethod,
			signInMethods,
		),
		passkeySignInEnabled: instance.passkey,
		emailSignInEnabled: getConfig().auth.enableEmailSignIn,
		twoFactorRequired: required,
		/** What the administrator requires that the account has not set up. */
		requirements,
		smtpAvailable: !!smtp,
		simpleMode: isSimpleMode(),
		driveOnly: isDriveOnly(user),
		versioning: settings.versioningEnabled ?? false,
	};
}

/**
 * A new name. The address changes only through the emailed-code flow
 * (better-auth's `email-otp/request-email-change` then `change-email`),
 * which proves both mailboxes; it used to change on a plain form post.
 */
export async function updateProfile(
	_user: SessionUser,
	headers: Headers,
	changes: { name?: string },
): Promise<AccountError | null> {
	const name = changes.name?.trim();
	if (!name || name === _user.name) {
		return null;
	}
	try {
		const result = await auth.api.updateUser({ body: { name }, headers });
		if (!result.status) {
			return refused("ACCOUNT_UPDATE_FAILED", "Your name could not be saved.");
		}
		return null;
	} catch (error) {
		logger.error("Error updating account details:", error);
		return refused("ACCOUNT_UPDATE_FAILED", "Your name could not be saved.");
	}
}

/**
 * Sets a first password (`set`) or changes the current one (`change`).
 * Checked against the instance's rules first: better-auth only knows the
 * environment's minimum.
 */
export async function savePassword(
	headers: Headers,
	input: { currentPassword?: string; newPassword: string; confirm: string },
	mode: "set" | "change",
): Promise<AccountError | null> {
	const problem = passwordProblem(
		input.newPassword,
		input.confirm,
		await passwordRules(),
	);
	if (problem) {
		return refused(
			problem.error,
			passwordMessage(problem),
			problem.errorParams,
		);
	}
	return mode === "set"
		? setFirstPassword(headers, input.newPassword)
		: changePassword(headers, input.currentPassword ?? "", input.newPassword);
}

async function setFirstPassword(
	headers: Headers,
	newPassword: string,
): Promise<AccountError | null> {
	if (!getConfig().auth.enableEmailSignIn) {
		return refused(
			"EMAIL_SIGNIN_DISABLED",
			"Signing in with a password is turned off on this server.",
		);
	}
	try {
		// Only succeeds when the account has no credential row yet, so it
		// cannot overwrite a password without knowing the current one.
		await auth.api.setPassword({ headers, body: { newPassword } });
		return null;
	} catch (error) {
		logger.error("Failed to set a password:", error);
		return refused("SET_PASSWORD_FAILED", "The password could not be set.");
	}
}

async function changePassword(
	headers: Headers,
	currentPassword: string,
	newPassword: string,
): Promise<AccountError | null> {
	try {
		await auth.api.changePassword({
			headers,
			body: { currentPassword, newPassword },
		});
		return null;
	} catch (error) {
		logger.error("Failed to change a password:", error);
		return refused(
			"CHANGE_PASSWORD_FAILED",
			"The password could not be changed. Check your current one.",
		);
	}
}

function passwordMessage(problem: {
	error: string;
	errorParams?: { count: string };
}): string {
	switch (problem.error) {
		case "PASSWORD_MISMATCH":
			return "The two passwords are different.";
		case "PASSWORD_TOO_SHORT":
			return `Use at least ${problem.errorParams?.count ?? "8"} characters.`;
		default:
			return "Mix upper and lower case, a digit and a symbol.";
	}
}

/** Null clears the preference; a method the account cannot use is refused. */
export async function setPreferredSignInMethod(
	userId: string,
	value: SignInMethod | null,
): Promise<AccountError | null> {
	const available = methodsFor(
		await instanceSignInMethods(),
		await accountCredentials(userId),
	);
	const method = effectivePreferred(value, available);
	if (value && !method) {
		return refused(
			"SIGN_IN_METHOD_UNAVAILABLE",
			"That sign-in method is not available for your account.",
		);
	}
	await updateUserPreferences(userId, { preferredSignInMethod: method });
	return null;
}

/** Live sessions without their tokens: a client revokes one by id. */
export async function listSessions(userId: string, currentId: string) {
	const rows = await activeSessions(userId);
	return rows.map((row) => ({
		id: row.id,
		current: row.id === currentId,
		userAgent: row.userAgent,
		ipAddress: row.ipAddress,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		expiresAt: row.expiresAt.toISOString(),
	}));
}

/**
 * Ends one of the account's own sessions. Through better-auth, by the token
 * looked up here, so its session cache forgets it too.
 */
export async function revokeSession(
	userId: string,
	sessionId: string,
	headers: Headers,
): Promise<boolean> {
	const [row] = await getDb()
		.select({ token: session.token })
		.from(session)
		.where(and(eq(session.id, sessionId), eq(session.userId, userId)));
	if (!row) {
		return false;
	}
	await auth.api.revokeSession({ body: { token: row.token }, headers });
	return true;
}
