import { Http } from "$lib/server/http";
import { listActivities } from "$lib/server/openapi/v1/activity";
import { ActivityService } from "$lib/server/services/activity";

export const GET = listActivities.handler(async ({ event }) => {
	const user = event.locals.user as NonNullable<typeof event.locals.user>;
	try {
		const activityService = new ActivityService();
		const activities = await activityService.get(user.id);
		return Http.Ok(activities);
	} catch (error) {
		return Http.ServerError("Failed to list activities", error);
	}
});
