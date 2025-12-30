import { Hono } from "hono";
import type { CustomRouter } from "$lib/server/api-types";
import { getUserActivities } from "$lib/server/dto/activity";
import type { Activity } from "$lib/server/schema";

export const activityRouter = new Hono<CustomRouter>().get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.text("Unauthorized", 401);
	}
	const activities = await getUserActivities(user.id);
	return c.json<Activity[]>(activities);
});
