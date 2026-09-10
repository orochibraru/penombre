import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";

/**
 * User-to-user sharing route definitions.
 * Importing this module registers all sharing routes with the OpenAPI registry.
 */

const permissionSchema = z.enum(["read", "write", "admin"]);

const recipientSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	image: z.string().nullable(),
});

export const resourceShareSchema = z.object({
	sharingId: z.string(),
	sharedWithId: z.string(),
	permission: permissionSchema,
	expiration: z.iso.datetime().nullable(),
	user: recipientSchema,
});

export const searchUsers = defineRoute({
	method: "get",
	path: "/api/v1/users/search",
	summary: "Search users to share with",
	description:
		"Matches a query against user names and emails. Requires a query — the full directory is not enumerable.",
	tags: ["Sharings"],
	query: z.object({ q: z.string().min(1) }),
	response: z.array(recipientSchema),
	errors: [400, 500],
});

export const listResourceSharings = defineRoute({
	method: "get",
	path: "/api/v1/sharings",
	summary: "List who a resource is shared with",
	tags: ["Sharings"],
	query: z.object({
		resourceType: z.enum(["file", "folder"]),
		resourceId: z.string().min(1),
	}),
	response: z.array(resourceShareSchema),
	errors: [400, 500],
});

export const createSharing = defineRoute({
	method: "post",
	path: "/api/v1/sharings",
	summary: "Share a resource with users",
	description: "Grants named accounts access to a file or folder you own",
	tags: ["Sharings"],
	body: z.object({
		resourceType: z.enum(["file", "folder"]),
		resourceId: z.string().min(1),
		userIds: z.array(z.string().min(1)).min(1),
		permission: permissionSchema.default("read"),
	}),
	response: z.object({ shared: z.boolean() }),
	errors: [400, 404, 500],
});

export const revokeSharing = defineRoute({
	method: "delete",
	path: "/api/v1/sharings/{id}",
	summary: "Revoke a user's access",
	description: "Removes one person from a sharing",
	tags: ["Sharings"],
	params: z.object({ id: z.string() }),
	response: z.object({ revoked: z.boolean() }),
	errors: [404, 500],
});
