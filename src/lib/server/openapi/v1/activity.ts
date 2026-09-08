import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";
import { activitySchema } from "$lib/server/schema";

/**
 * Activity route definitions.
 * Importing this module registers all activity routes with the OpenAPI registry.
 */

export const listActivities = defineRoute({
	method: "get",
	path: "/api/v1/activity",
	summary: "List activities",
	description: "Returns a list of recent activities for the current user",
	tags: ["Activity"],
	response: z.array(activitySchema),
	errors: [500],
});
