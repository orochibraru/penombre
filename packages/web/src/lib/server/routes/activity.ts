import { Hono } from "hono";
import type { CustomRouter } from "$lib/server/api-types";
import { ActivityService } from "$lib/server/dto/activity";
import type { Activity } from "$lib/server/schema";

const activityRouter = new Hono<CustomRouter>().get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.text("Unauthorized", 401);
	}
	const activityService = new ActivityService();
	const activities = await activityService.get(user.id);
	return c.json<Activity[]>(activities);
});

export { activityRouter };
