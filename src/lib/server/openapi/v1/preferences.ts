import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";

/**
 * Preferences route definitions.
 * Importing this module registers all preferences routes with the OpenAPI registry.
 */

const userPreferencesSchema = z.object({
	layout: z.enum(["grid", "list"]).optional(),
	sortColumn: z.enum(["name", "size", "updatedAt"]).nullable().optional(),
	sortDirection: z.enum(["asc", "desc"]).optional(),
});

export const getPreferences = defineRoute({
	method: "get",
	path: "/api/v1/preferences",
	summary: "Get user preferences",
	description: "Returns the current user's layout and sort preferences",
	tags: ["Preferences"],
	response: userPreferencesSchema,
	errors: [500],
});

export const updatePreferences = defineRoute({
	method: "put",
	path: "/api/v1/preferences",
	summary: "Update user preferences",
	description: "Updates the current user's layout and sort preferences",
	tags: ["Preferences"],
	body: userPreferencesSchema,
	response: userPreferencesSchema,
	errors: [400, 500],
});
