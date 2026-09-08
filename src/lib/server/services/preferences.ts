import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import {
	type UserPreferencesData,
	userPreferences,
} from "$lib/server/db/schema";

const defaultPreferences: UserPreferencesData = {
	layout: "list",
	sortColumn: "name",
	sortDirection: "asc",
};

/**
 * Get user preferences, creating default if not exists.
 */
export async function getUserPreferences(
	userId: string,
): Promise<UserPreferencesData> {
	const result = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, userId))
		.limit(1);

	if (result.length === 0) {
		return defaultPreferences;
	}

	// biome-ignore lint/style/noNonNullAssertion: result[0] is guaranteed to exist after length check
	const prefs = result[0]!;
	return {
		...defaultPreferences,
		...(prefs.preferences ?? {}),
	};
}

/**
 * Update user preferences (merge with existing).
 */
export async function updateUserPreferences(
	userId: string,
	updates: Partial<UserPreferencesData>,
): Promise<UserPreferencesData> {
	const existing = await getUserPreferences(userId);
	const merged = { ...existing, ...updates };

	await db
		.insert(userPreferences)
		.values({
			userId,
			preferences: merged,
		})
		.onConflictDoUpdate({
			target: userPreferences.userId,
			set: {
				preferences: merged,
				updatedAt: new Date(),
			},
		});

	return merged;
}
