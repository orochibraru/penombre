import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";

/**
 * Auth route definitions.
 * Importing this module registers all auth routes with the OpenAPI registry.
 */

const authProviderSchema = z.object({
	name: z.string(),
	prettyName: z.string(),
	type: z.enum(["oauth", "email"]),
	enabled: z.boolean(),
});

export const listAuthProviders = defineRoute({
	method: "get",
	path: "/api/v1/auth/providers",
	summary: "List authentication providers",
	description:
		"Returns a list of available authentication providers and their status. Does not require authentication.",
	tags: ["Auth"],
	requireAuth: false,
	response: z.array(authProviderSchema),
	errors: [500],
});
