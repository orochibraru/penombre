/**
 * Instance settings an admin can change at runtime.
 *
 * Deliberately narrow: anything already settable by environment variable stays
 * env-owned, so `config.ts` remains the single source of truth for those and
 * the two can never disagree. The admin UI surfaces env-provided values as
 * read-only alongside these.
 */

import { eq } from "drizzle-orm";
import { envProvided, getConfig } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import type { AppSettingsData } from "$lib/server/db/schema";
import { appSettings } from "$lib/server/db/schema";

/** Single-row table; the id is a constant. */
const ROW_ID = "instance";

const defaults: AppSettingsData = {
	requirePasskey: false,
	allowSignups: false,
	allowedEmailDomains: [],
	minPasswordLength: 8,
	requireStrongPassword: false,
	emailSignInEnabled: true,
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

	return { ...defaults, ...(row?.settings ?? {}) };
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
 * Providers stored in the database, for better-auth to merge with the ones
 * declared by environment variables.
 *
 * Read once at boot: better-auth builds its plugin list at module init, so a
 * provider added here only takes effect after a restart. The admin UI says so
 * rather than pretending otherwise.
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
