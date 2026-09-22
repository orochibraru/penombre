/**
 * Instance settings an admin can change at runtime.
 *
 * Deliberately narrow: anything already settable by environment variable stays
 * env-owned, so `config.ts` remains the single source of truth for those and
 * the two can never disagree. The admin UI surfaces env-provided values as
 * read-only alongside these.
 */

import { eq } from "drizzle-orm";
import { envProvided, getConfig } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import type { AppSettingsData } from "#lib/server/db/schema.js";
import { appSettings } from "#lib/server/db/schema.js";

/** Single-row table; the id is a constant. */
const ROW_ID = "instance";

const defaults: AppSettingsData = {
	requirePasskey: false,
	allowSignups: false,
	allowedEmailDomains: [],
	minPasswordLength: 8,
	requireStrongPassword: false,
	emailSignInEnabled: true,
	magicLinkEnabled: false,
	emailOtpEnabled: false,
	passkeySignInEnabled: true,
	requireTwoFactor: false,
	smtp: { enabled: false },
	oauthProviders: [],
};

export async function getAppSettings(): Promise<AppSettingsData> {
	const db = getDb();
	const [row] = await db
		.select()
		.from(appSettings)
		.where(eq(appSettings.id, ROW_ID))
		.limit(1);

	return { ...defaults, ...row?.settings };
}

export async function updateAppSettings(
	updates: Partial<AppSettingsData>,
): Promise<AppSettingsData> {
	const db = getDb();
	const merged = { ...(await getAppSettings()), ...updates };

	await db
		.insert(appSettings)
		.values({ id: ROW_ID, settings: merged })
		.onConflictDoUpdate({
			target: appSettings.id,
			set: { settings: merged, updatedAt: new Date() },
		});

	return merged;
}

/**
 * Whether this email may create an account.
 *
 * Signups closed means no, regardless of domain. An empty allow-list means any
 * domain — the filter only narrows.
 */
export function signupAllowed(
	settings: AppSettingsData,
	email: string,
): boolean {
	if (!settings.allowSignups) {
		return false;
	}
	const domains = settings.allowedEmailDomains ?? [];
	if (domains.length === 0) {
		return true;
	}
	const domain = email.split("@")[1]?.toLowerCase();
	return !!domain && domains.some((d) => d.toLowerCase() === domain);
}

/**
 * Providers stored in the database, merged with the env-declared ones by
 * `refreshAuth()` in `auth/index.ts`.
 */
export async function getStoredOAuthProviders() {
	try {
		const settings = await getAppSettings();
		return (settings.oauthProviders ?? []).filter(
			(provider) => provider.clientId && provider.clientSecret,
		);
	} catch {
		// The table may not exist yet on a first boot — migrations run after
		// this module is imported.
		return [];
	}
}

/**
 * Whether OAuth sign-in is on, resolving env over database.
 *
 * `ENABLE_OAUTH_SIGNIN` wins whenever it is present. Otherwise having a
 * provider *is* the switch: an admin who adds one in the UI has said what they
 * mean, and a second toggle only gives them a provider that silently does
 * nothing.
 */
export async function isOAuthSignInEnabled(): Promise<boolean> {
	if (envProvided().oauthSignIn) {
		return getConfig().auth.enableOAuthSignIn;
	}
	const fromEnv = getConfig().auth.oauthProviders.some(
		(provider) => provider.enabled,
	);
	const stored = await getStoredOAuthProviders();
	return fromEnv || stored.some((provider) => provider.enabled !== false);
}

/**
 * Whether email + password sign-in is on, resolving env over database.
 *
 * `ENABLE_EMAIL_SIGNIN` wins whenever it is present. When it is absent the
 * stored setting governs, so removing the var from `.env` hands control to the
 * admin UI rather than pinning it to a default nothing can change.
 */
export async function isEmailSignInEnabled(): Promise<boolean> {
	if (envProvided().emailSignIn) {
		return getConfig().auth.enableEmailSignIn;
	}
	try {
		return (await getAppSettings()).emailSignInEnabled ?? true;
	} catch {
		return getConfig().auth.enableEmailSignIn;
	}
}

/** Whether passkey sign-in is on, resolving env over database. */
export async function isPasskeySignInEnabled(): Promise<boolean> {
	if (envProvided().passkeySignIn) {
		return getConfig().auth.enablePasskeySignIn;
	}
	try {
		return (await getAppSettings()).passkeySignInEnabled ?? true;
	} catch {
		return true;
	}
}

/**
 * Passwordless sign-in toggles.
 *
 * No environment variable governs these, so the stored value always wins —
 * but neither is usable without SMTP, and an admin can remove SMTP after
 * enabling them, so both are gated on mail actually being configured.
 */
export async function getPasswordlessSettings(): Promise<{
	magicLink: boolean;
	emailOtp: boolean;
}> {
	try {
		const settings = await getAppSettings();
		const smtp = await getSmtpSettings();
		const canSend = !!smtp;
		return {
			magicLink: canSend && (settings.magicLinkEnabled ?? false),
			emailOtp: canSend && (settings.emailOtpEnabled ?? false),
		};
	} catch {
		return { magicLink: false, emailOtp: false };
	}
}

/** Whether every account must enrol in two-factor before using the app. */
export async function isTwoFactorRequired(): Promise<boolean> {
	try {
		return (await getAppSettings()).requireTwoFactor ?? false;
	} catch {
		return false;
	}
}

/** SMTP settings, resolving env over database in the same way. */
export async function getSmtpSettings(): Promise<{
	enabled: boolean;
	host: string;
	port: number;
	user: string;
	password: string;
	from: string;
	secure: boolean;
} | null> {
	if (envProvided().smtp) {
		const smtp = getConfig().smtp;
		return smtp?.enabled
			? {
					enabled: true,
					host: smtp.host,
					port: smtp.port,
					user: smtp.user,
					password: smtp.password,
					from: smtp.from,
					secure: smtp.secure,
				}
			: null;
	}

	try {
		const stored = (await getAppSettings()).smtp;
		if (!(stored?.enabled && stored.host && stored.from)) {
			return null;
		}
		return {
			enabled: true,
			host: stored.host,
			port: stored.port ?? 587,
			user: stored.user ?? "",
			password: stored.password ?? "",
			from: stored.from,
			secure: stored.secure ?? false,
		};
	} catch {
		return null;
	}
}

/**
 * Whether the hourly GitHub release check runs, resolving env over database.
 *
 * Off-instance by default in the sense that it calls `api.github.com`, so
 * this is the opt-out for a privacy-sensitive or air-gapped deployment.
 */
export async function isVersionCheckEnabled(
	settings?: AppSettingsData,
): Promise<boolean> {
	if (envProvided().versionCheck) {
		return getConfig().versionCheck.enabled;
	}
	try {
		return (settings ?? (await getAppSettings())).versionCheckEnabled ?? true;
	} catch {
		return true;
	}
}

/**
 * Which release stream to compare the running version against.
 *
 * With nothing set, a `-canary.N` build defaults to watching canary; anything
 * else watches stable; a canary image should not nag its admin about a
 * stable release it has already moved past.
 */
export async function effectiveReleaseChannel(
	settings?: AppSettingsData,
): Promise<"stable" | "canary"> {
	const config = getConfig();
	if (envProvided().releaseChannel) {
		return config.versionCheck.releaseChannel ?? "stable";
	}
	try {
		const stored = (settings ?? (await getAppSettings())).releaseChannel;
		if (stored) {
			return stored;
		}
	} catch {
		// fall through to the version-derived default
	}
	return config.appVersion.includes("-canary.") ? "canary" : "stable";
}

/**
 * How many days of activity/notifications/finished-job history to keep, or
 * `null` to keep everything forever. Resolves env over database, same rule
 * as everything else here.
 */
export async function effectiveRetentionDays(
	settings?: AppSettingsData,
): Promise<number | null> {
	if (envProvided().dataRetention) {
		return getConfig().dataRetentionDays ?? null;
	}
	try {
		return (settings ?? (await getAppSettings())).retentionDays ?? null;
	} catch {
		return null;
	}
}
