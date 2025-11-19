import { auth } from "@lib/auth";
import { UnauthorizedError } from "@lib/errors";
import {
	newFileSchema,
	objectListSchema,
	uploadResultSchema,
} from "@lib/schema";
import { StorageService } from "@lib/storage";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async ({ headers, query }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storageService = new StorageService(session.user);
		const objects = await storageService.listFiles(
			decodeURIComponent(query.folder || ""),
		);
		return Response.json(objects);
	},
	spec: {
		parameters: {
			query: z.object({
				folder: z.string().optional(),
			}),
		},
		responseFormat: "json",
		summary: "Get all files",
		description: "Retrieve a list of all files.",
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
			500: {
				schema: z.object({
					message: z.string(),
				}),
			},
		},
	},
});

export const POST = createRoute({
	method: "POST",
	handler: async ({ headers, body, query }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storageService = new StorageService(session.user);

		try {
			const res = await storageService.createFile(body, query.folder);

			return Response.json(res);
		} catch (error) {
			if (error instanceof UnauthorizedError) {
				return Response.json({ message: "Unauthorized" }, { status: 401 });
			}

			return Response.json(
				{ message: "Internal Server Error" },
				{ status: 500 },
			);
		}
	},
	spec: {
		responseFormat: "json",
		summary: "Create a file",
		description:
			"Create a new file in the storage (without uploading the file contents).",
		tags: ["Storage"],
		parameters: {
			body: newFileSchema,
			query: z.object({
				folder: z.string().optional(),
			}),
		},
		responses: {
			200: {
				schema: uploadResultSchema,
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
