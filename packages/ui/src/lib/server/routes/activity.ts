import { Hono } from "hono";
import { getUserActivities } from "$lib/server/dto/activity";
import type { Activity } from "$lib/server/schema";

export const activityRouter = new Hono().get("/activity", async (c) => {
	const activities = await getUserActivities(session.user.id);
	return c.json<Activity[]>(activities);
});
