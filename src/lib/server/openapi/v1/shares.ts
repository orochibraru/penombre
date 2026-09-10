import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";

/**
 * Share-link route definitions.
 * Importing this module registers all share routes with the OpenAPI registry.
 */

export const shareSchema = z.object({
	id: z.string(),
	token: z.string(),
	resourceType: z.enum(["file", "folder"]),
	resourceId: z.string(),
	resourceName: z.string(),
	/** The hash itself is never returned — only whether one is set. */
	hasPassword: z.boolean(),
	requiresAuth: z.boolean(),
	expiresAt: z.iso.datetime().nullable(),
	downloadCount: z.number(),
	createdAt: z.iso.datetime(),
});

const createShareBody = z.object({
	resourceType: z.enum(["file", "folder"]),
	resourceId: z.string().min(1),
	password: z.string().min(1).optional(),
	/** 0 or omitted means the link never expires. */
	expiresInDays: z.number().int().min(0).max(3650).optional(),
	requiresAuth: z.boolean().optional(),
});

export const listShares = defineRoute({
	method: "get",
	path: "/api/v1/shares",
	summary: "List share links",
	description: "Returns every share link owned by the current user",
	tags: ["Shares"],
	response: z.array(shareSchema),
	errors: [500],
});

export const createShare = defineRoute({
	method: "post",
	path: "/api/v1/shares",
	summary: "Create a share link",
	description:
		"Creates a token-addressed link to a file or folder the caller owns",
	tags: ["Shares"],
	body: createShareBody,
	response: shareSchema,
	errors: [400, 404, 500],
});

export const revokeShare = defineRoute({
	method: "delete",
	path: "/api/v1/shares/{id}",
	summary: "Revoke a share link",
	description: "Deletes a share link, immediately breaking the URL",
	tags: ["Shares"],
	params: z.object({ id: z.string() }),
	response: z.object({ revoked: z.boolean() }),
	errors: [404, 500],
});
