import { getUserActivities } from "@lib/activity";
import { auth } from "@lib/auth";
import { activitySchema } from "@lib/schema";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async ({ headers }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}

		const activities = await getUserActivities(session.user.id);

		return Response.json(activities);
	},
	spec: {
		responseFormat: "json",
		summary: "Get user activities",
		description: "Retrieve a list of activities for the authenticated user.",
		tags: ["Activity"],
		responses: {
			200: {
				schema: z.array(activitySchema),
			},
			401: {
				schema: z.object({
					message: z.string(),
				}),
			},
			500: {
				schema: z.object({
					message: z.string(),
				}),
			},
		},
	},
});
