import { auth } from "@lib/auth";
import { StorageService } from "@lib/storage";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async () => {
		return Response.json({
			message: "Folders retrieved successfully.",
		});
	},
	spec: {
		responseFormat: "json",
		summary: "Retrieve folders",
		tags: ["Storage"],
		parameters: {
			query: z.object({
				parent: z.string().optional(),
			}),
		},
		description: "Retrieve a list of folders in the storage.",
		responses: {
			200: {
				schema: z.object({
					message: z.string(),
				}),
			},
			401: {
				schema: z.object({
					message: z.string(),
				}),
			},
		},
	},
});

export const POST = createRoute({
	method: "POST",
	handler: async ({ body, headers }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storageService = new StorageService(session.user);
		await storageService.createFolder(body.name, body.parent);
		return Response.json(
			{
				message: "Folder created successfully.",
			},
			{ status: 201 },
		);
	},
	spec: {
		responseFormat: "json",
		summary: "Create a folder",
		description: "Create a new folder in the storage.",
		tags: ["Storage"],
		parameters: {
			body: z.object({
				name: z.string(),
				parent: z.string().optional(),
			}),
		},
		responses: {
			201: {
				schema: z.object({
					message: z.string(),
				}),
			},
			401: {
				schema: z.object({
					message: z.string(),
				}),
			},
		},
	},
});
