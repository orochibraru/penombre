import { auth } from "@lib/auth";
import { FileNotFoundError } from "@lib/errors";
import { logger } from "@lib/logger";
import { objectItemSchema, updateFileSchema } from "@lib/schema";
import { StorageService } from "@lib/storage";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async ({ headers, params, query }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storage = new StorageService(session.user);
		const decodedItemName = decodeURIComponent(params.item);
		try {
			if (query.raw && query.raw === "true") {
				const fileData = await storage.getRawFileData(decodedItemName);
				if (!fileData) {
					return Response.json({ message: "File not found" }, { status: 404 });
				}

				const range = headers.range || headers.Range;
				if (range) {
					const { chunk, headers: newHeaders } = storage.generateRangeHeaders({
						file: fileData.file,
						object: fileData.meta,
						headers,
					});

					return new Response(chunk, {
						status: 206,
						headers: newHeaders,
					});
				}

				const newHeaders = storage.generateRawFileHeaders({
					file: fileData.file,
					object: fileData.meta,
				});

				return new Response(fileData.file, {
					headers: newHeaders,
					status: 200,
				});
			}
			const file = await storage.getFile(decodedItemName);
			if (!file) {
				return Response.json({ message: "File not found" }, { status: 404 });
			}

			if (file.metadata.owner !== session.user.id) {
				return Response.json({ message: "Unauthorized" }, { status: 401 });
			}

			return Response.json(file);
		} catch (error) {
			if (error instanceof FileNotFoundError) {
				return Response.json({ message: "File not found" }, { status: 404 });
			}

			logger.error("Error retrieving file metadata:", error);
			return Response.json(
				{ message: "Error retrieving file metadata." },
				{ status: 500 },
			);
		}
	},
	spec: {
		responseFormat: "json",
		summary: "Get file metadata",
		parameters: {
			path: z.object({
				item: z.string().describe("The name of the file to retrieve."),
			}),
			query: z.object({
				raw: z.string().optional(),
			}),
		},
		description: "Get file metadata from the storage.",
		tags: ["Storage"],
		responses: {
			200: {
				schema: objectItemSchema,
			},
			206: {
				schema: objectItemSchema,
			},
			400: {
				schema: z.object({
					message: z.string(),
				}),
			},
			401: {
				schema: z.object({
					message: z.string(),
				}),
			},
			404: {
				schema: z.object({
					message: z.string(),
				}),
			},
			416: {
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

export const DELETE = createRoute({
	method: "DELETE",
	handler: async ({ headers, params }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storage = new StorageService(session.user);

		const decodedItemName = decodeURIComponent(params.item);
		params.item = decodedItemName;

		const exists = await storage.fileExists(params.item);
		if (!exists) {
			return Response.json({ message: "File not found" }, { status: 404 });
		}
		try {
			await storage.deleteFile(params.item);
			return Response.json({ message: "File deleted successfully." });
		} catch (error) {
			logger.error("Error deleting file:", error);
			return Response.json(
				{ message: "Error deleting file." },
				{ status: 500 },
			);
		}
	},
	spec: {
		responseFormat: "json",
		summary: "Delete a file",
		parameters: {
			query: z.object({
				folder: z.string().optional(),
			}),
			path: z.object({
				item: z.string().describe("The name of the file to delete."),
			}),
		},
		tags: ["Storage"],
		description: "Delete a file from the storage.",
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
			404: {
				schema: z.object({
					message: z.string(),
				}),
			},
		},
	},
});

// Upload file body
export const POST = createRoute({
	method: "POST",
	handler: async ({ headers, params, body }) => {
		const file = body.file;
		if (!file) {
			return Response.json({ message: "No file provided." }, { status: 400 });
		}
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storage = new StorageService(session.user);

		const decodedItemName = decodeURIComponent(params.item);
		const exists = await storage.fileExists(decodedItemName);
		if (!exists) {
			return Response.json({ message: "File not found" }, { status: 404 });
		}

		logger.info("Uploading file body for:", decodedItemName, file);

		try {
			await storage.uploadFileBody(decodedItemName, file);
			logger.info("File body uploaded for:", decodedItemName);
			return Response.json({ message: "File uploaded successfully." });
		} catch (error) {
			logger.error("Error uploading file body:", error);
			return Response.json(
				{ message: "Error uploading file body." },
				{ status: 500 },
			);
		}
	},
	spec: {
		responseFormat: "json",
		summary: "Upload a file's body",
		description: "Upload the body of a file to the storage.",
		tags: ["Storage"],
		parameters: {
			path: z.object({
				item: z.string().describe("The name of the file to upload."),
			}),
			body: z.object({
				file: z.instanceof(File).describe("The file to upload."),
			}),
		},
		responses: {
			200: {
				schema: z.object({
					message: z.string(),
				}),
			},
			400: {
				schema: z.object({
					message: z.string(),
				}),
			},
			401: {
				schema: z.object({
					message: z.string(),
				}),
			},
			404: {
				schema: z.object({
					message: z.string(),
				}),
			},
		},
	},
});

export const PUT = createRoute({
	method: "PUT",
	handler: async ({ headers, params, body, query }) => {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}
		const storage = new StorageService(session.user);

		const fullPath = `${query.folder ? `${query.folder}/` : ""}${params.item}`;

		const decodedItemName = decodeURIComponent(fullPath);

		const exists = await storage.fileExists(decodedItemName);
		if (!exists) {
			return Response.json({ message: "File not found" }, { status: 404 });
		}

		try {
			await storage.updateFile(decodedItemName, body);
			return Response.json({
				message: "File metadata updated successfully.",
			});
		} catch (error) {
			logger.error("Error updating file metadata:", error);
			return Response.json(
				{ message: "Error updating file metadata." },
				{ status: 500 },
			);
		}
	},
	spec: {
		responseFormat: "json",
		summary: "Update file metadata",
		tags: ["Storage"],
		parameters: {
			query: z.object({
				folder: z.string().optional(),
			}),
			path: z.object({
				item: z.string().describe("The name of the file to delete."),
			}),
			body: updateFileSchema,
		},
		description: "Update metadata for a file in the storage.",
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
			404: {
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
