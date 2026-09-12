import { Logger } from "$lib/logger";
import { Http } from "$lib/server/http";
import { listActivities } from "$lib/server/openapi/v1/activity";
import { ActivityService } from "$lib/server/services/activity";

const logger = new Logger("Activity API");

export const GET = listActivities.handler(async ({ event }) => {
	// The drive's activity, not the viewer's: every storage row is written
	// against the drive's owner, so in simple mode the shared owner holds
	// everyone's — reading the session user's gave every other account an
	// empty feed, including their own uploads.
	const user = (event.locals.storageOwner ?? event.locals.user) as NonNullable<
		typeof event.locals.user
	>;

	try {
		logger.debug(`Fetching activities for user ${user.id}`);
		const activityService = new ActivityService();
		const activities = await activityService.get(user.id);
		logger.debug(
			`Successfully fetched ${activities.length} activities for user ${user.id}`,
		);
		return Http.Ok(activities);
	} catch (error) {
		return Http.ServerError("Failed to list activities", error);
	}
});
