import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/**
 * Self-service "export everything I own": one route for the caller's own
 * files as a ZIP (reusing the existing bulk-download job machinery), one for
 * their account data as JSON.
 */

export const exportAccountFiles = defineRoute({
	method: "get",
	path: "/api/v1/account/export",
	summary: "Export owned files",
	description:
		"Streams every top-level file and folder the caller owns as one ZIP archive.",
	tags: ["Account"],
	response: z.any().describe("Binary ZIP stream"),
	errors: [404, 500],
	service: storageServiceFor,
});

const accountDataSchema = z.object({
	user: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string(),
		createdAt: z.string(),
	}),
	preferences: z.record(z.string(), z.unknown()),
	activity: z.array(
		z.object({
			id: z.string(),
			action: z.string(),
			message: z.string(),
			link: z.string().nullable(),
			level: z.string(),
			createdAt: z.string(),
		}),
	),
});

export const exportAccountData = defineRoute({
	method: "get",
	path: "/api/v1/account/data",
	summary: "Export account data",
	description:
		"Returns the caller's profile, preferences and activity as JSON.",
	tags: ["Account"],
	response: accountDataSchema,
	errors: [404, 500],
});
