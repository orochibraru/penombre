import { Logger } from "$lib/logger";
import { Http } from "$lib/server/http";
import { listActivities } from "$lib/server/openapi/v1/activity";
import { ActivityService } from "$lib/server/services/activity";

const logger = new Logger("Activity API");

export const GET = listActivities.handler(async ({ event }) => {
	logger.debug("Received request for user activity", {
		method: event.request.method,
		url: event.url.pathname,
	});
	const user = event.locals.user as NonNullable<typeof event.locals.user>;

	logger.debug("User info from session", {
		id: user.id,
		email: user.email,
		role: user.role,
	});
	try {
		logger.debug("Fetching activities for user", { userId: user.id });
		const activityService = new ActivityService();
		const activities = await activityService.get(user.id);
		logger.debug("Successfully retrieved activities", {
			count: activities.length,
		});
		return Http.Ok(activities);
	} catch (error) {
		return Http.ServerError("Failed to list activities", error);
	}
});
