import { auth } from "@lib/auth";
import { logger } from "@lib/logger";
import {
	allowedFileCategories,
	type FileCategory,
	objectListSchema,
} from "@lib/schema";
import { StorageService } from "@lib/storage";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async ({ headers, params }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const cat = params.category?.toUpperCase();
		const isCategoryValid = allowedFileCategories.includes(cat || "");
		if (!isCategoryValid) {
			return Response.json({ message: "Invalid category" }, { status: 400 });
		}
		logger.info(
			`User ${session.user.id} is fetching files for category ${params.category}`,
		);
		const storageService = new StorageService(session.user);
		const objects = await storageService.listFilesPerCategory(
			cat as FileCategory,
		);
		return Response.json(objects);
	},
	spec: {
		parameters: {
			path: z.object({
				category: z.string().optional(),
			}),
		},
		responseFormat: "json",
		summary: "Get files by category",
		description: "Retrieve a list of files by their category.",
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
