/**
 * "Export everything I own", the JSON half: a cheap dump of the caller's own
 * profile, preferences and activity. The files/folders half goes through the
 * existing zip job machinery instead (see `account/export/+server.ts`).
 */

import type { UserPreferencesData } from "#lib/server/db/schema.js";
import { ActivityService } from "#lib/server/services/activity.js";
import { getUserPreferences } from "#lib/server/services/preferences.js";
import { getUserById } from "#lib/server/services/user.js";

export interface AccountDataExport {
	user: { id: string; name: string; email: string; createdAt: string };
	preferences: UserPreferencesData;
	activity: Array<{
		id: string;
		action: string;
		message: string;
		link: string | null;
		level: string;
		createdAt: string;
	}>;
}

const activityService = new ActivityService();

export async function exportAccountData(
	userId: string,
): Promise<AccountDataExport | null> {
	const account = await getUserById(userId);
	if (!account) {
		return null;
	}
	const [preferences, activity] = await Promise.all([
		getUserPreferences(userId),
		activityService.get(userId, 1000),
	]);

	return {
		user: {
			id: account.id,
			name: account.name,
			email: account.email,
			createdAt: new Date(account.createdAt).toISOString(),
		},
		preferences,
		activity: activity.map((row) => ({
			id: row.id,
			action: row.action,
			message: row.message,
			link: row.link,
			level: row.level,
			createdAt: new Date(row.createdAt).toISOString(),
		})),
	};
}
