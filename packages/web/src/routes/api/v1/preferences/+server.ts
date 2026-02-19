import type { UserPreferencesData } from "$lib/server/db/schema";
import { Http } from "$lib/server/http";
import {
	getPreferences,
	updatePreferences,
} from "$lib/server/openapi/v1/preferences";
import {
	getUserPreferences,
	updateUserPreferences,
} from "$lib/server/services/preferences";

export const GET = getPreferences.handler(async ({ event }) => {
	const user = event.locals.user as NonNullable<typeof event.locals.user>;
	try {
		const preferences = await getUserPreferences(user.id);
		return Http.Ok(preferences);
	} catch (error) {
		return Http.ServerError("Failed to get preferences", error);
	}
});

export const PUT = updatePreferences.handler(async ({ body, event }) => {
	const user = event.locals.user as NonNullable<typeof event.locals.user>;

	const validLayouts = ["grid", "list"];
	const validSortColumns = ["name", "size", "updatedAt", null];
	const validSortDirections = ["asc", "desc"];

	const updates: Partial<UserPreferencesData> = {};

	if (body.layout && validLayouts.includes(body.layout)) {
		updates.layout = body.layout;
	}
	if (body.sortColumn !== undefined) {
		if (
			body.sortColumn === null ||
			validSortColumns.includes(body.sortColumn)
		) {
			updates.sortColumn = body.sortColumn;
		}
	}
	if (body.sortDirection && validSortDirections.includes(body.sortDirection)) {
		updates.sortDirection = body.sortDirection;
	}

	try {
		const preferences = await updateUserPreferences(user.id, updates);
		return Http.Ok(preferences);
	} catch (error) {
		return Http.ServerError("Failed to update preferences", error);
	}
});
