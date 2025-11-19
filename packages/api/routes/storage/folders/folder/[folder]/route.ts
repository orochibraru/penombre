import { auth } from "@lib/auth";
import { StorageService } from "@lib/storage";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async () => {
		return Response.json({
			message: "Folder retrieved successfully.",
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
			path: z.object({
				folder: z.string().min(3).max(100),
			}),
		},
		description: "Retrieve a single folder.",
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

export const DELETE = createRoute({
	method: "DELETE",
	handler: async ({ headers, query, params }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storageService = new StorageService(session.user);

		const decoded = {
			folder: decodeURIComponent(params.folder),
			parent: query.parent ? decodeURIComponent(query.parent) : undefined,
		};

		// Build the full folder path
		const folderPath = decoded.parent
			? `${decoded.parent}/${decoded.folder}`
			: decoded.folder;

		await storageService.deleteFolder(folderPath);

		return Response.json({ message: "Folder deleted successfully." });
	},
	spec: {
		responseFormat: "json",
		summary: "Delete a folder",
		tags: ["Storage"],
		parameters: {
			query: z.object({
				parent: z.string().optional(),
			}),
			path: z.object({
				folder: z.string().min(3).max(100),
			}),
		},
		description: "Delete a folder from the storage.",
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
