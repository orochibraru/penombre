import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";

/**
 * Notification route definitions.
 * Importing this module registers all notification routes with the OpenAPI registry.
 */

export const notificationSchema = z.object({
	id: z.string(),
	type: z.enum(["note", "share"]),
	/** Who did it, as their name read when it happened. */
	actorName: z.string().nullable(),
	/** The file or folder involved. */
	resourceName: z.string().nullable(),
	link: z.string().nullable(),
	read: z.boolean(),
	createdAt: z.iso.datetime(),
});

export const listNotifications = defineRoute({
	method: "get",
	path: "/api/v1/notifications",
	summary: "List your notifications",
	description:
		"Most recent first, with the unread count so a client can render the badge from one call.",
	tags: ["Notifications"],
	query: z.object({
		limit: z.coerce.number().min(1).max(100).optional(),
	}),
	response: z.object({
		notifications: z.array(notificationSchema),
		unread: z.number(),
	}),
	errors: [500],
});

export const markNotificationsRead = defineRoute({
	method: "post",
	path: "/api/v1/notifications/read",
	summary: "Mark notifications read",
	description: "Omit `ids` to mark every unread notification as read.",
	tags: ["Notifications"],
	body: z.object({
		ids: z.array(z.string()).optional(),
	}),
	response: z.object({ read: z.number(), unread: z.number() }),
	errors: [500],
});
