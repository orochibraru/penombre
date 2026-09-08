import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";

/**
 * Version route definitions.
 * Importing this module registers all version routes with the OpenAPI registry.
 */

export const checkVersion = defineRoute({
	method: "get",
	path: "/api/v1/version/check",
	summary: "Check for updates",
	description:
		"Checks if a newer version of Penombre is available on GitHub releases",
	tags: ["Version"],
	response: z.object({
		currentVersion: z.string(),
		latestVersion: z.string().nullable(),
		updateAvailable: z.boolean(),
		releaseUrl: z.string().nullable(),
	}),
	errors: [500],
});
