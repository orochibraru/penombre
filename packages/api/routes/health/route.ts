import { getDb } from "@lib/db";
import { logger } from "@lib/logger";
import { createRoute } from "koritsu";
import z from "zod";

export const GET = createRoute({
	method: "GET",
	handler: async () => {
		const db = getDb();
		try {
			const dbHealth = await db.execute("SELECT 1");
			if (dbHealth.length !== 1) {
				throw new Error("Database health check failed");
			}
			return Response.json("OK");
		} catch (error) {
			logger.error("Health check failed", { error });
			return Response.json("NOT OK => Storage service is down", {
				status: 500,
			});
		}
	},
	spec: {
		responseFormat: "text",
		tags: ["Utilities"],
		summary: "Health check",
		description: "Checks the health status of the storage service",
		responses: {
			200: {
				schema: z.string().default("OK"),
			},
			500: {
				schema: z.string().default("NOT OK => <reason>"),
			},
		},
	},
});
