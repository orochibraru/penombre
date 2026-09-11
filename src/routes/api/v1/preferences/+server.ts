import { Http } from "$lib/server/http";
import {
	getPreferences,
	updatePreferences,
} from "$lib/server/openapi/v1/preferences";
import {
	getUserPreferences,
	updateUserPreferences,
} from "$lib/server/services/preferences";

export const GET = getPreferences.handler(async ({ user }) => {
	try {
		const preferences = await getUserPreferences(user.id);
		return Http.Ok(preferences);
	} catch (error) {
		return Http.ServerError("Failed to get preferences", error);
	}
});

export const PUT = updatePreferences.handler(async ({ body, user }) => {
	try {
		// The body is already validated against the route's Zod schema, which
		// constrains every field to its enum. Re-filtering by hand here used to
		// silently drop anything not in a hard-coded list of three keys, so new
		// preferences saved as 200 OK and never persisted.
		const preferences = await updateUserPreferences(user.id, body);
		return Http.Ok(preferences);
	} catch (error) {
		return Http.ServerError("Failed to update preferences", error);
	}
});
