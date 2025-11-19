import { auth } from "@lib/auth";
import { objectListSchema } from "@lib/schema";
import { StorageService } from "@lib/storage";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async ({ headers }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storageService = new StorageService(session.user);
		const objects = await storageService.listRecentFiles();
		return Response.json(objects);
	},
	spec: {
		responseFormat: "json",
		summary: "Get recent files",
		description: "Retrieve a list of recently accessed files.",
		tags: ["Storage"],
		responses: {
			200: {
				schema: objectListSchema,
			},
			401: {
				schema: z.object({
					message: z.string(),
				}),
			},
		},
	},
});
