/**
 * Instance settings an admin can change at runtime.
 *
 * Deliberately narrow: anything already settable by environment variable stays
 * env-owned, so `config.ts` remains the single source of truth for those and
 * the two can never disagree. The admin UI surfaces env-provided values as
 * read-only alongside these.
 */

import { eq } from "drizzle-orm";
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
