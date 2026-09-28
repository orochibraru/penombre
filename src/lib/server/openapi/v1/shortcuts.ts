import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";

/**
 * Sidebar shortcut route definitions.
 * Importing this module registers all shortcut routes with the OpenAPI registry.
 */

const shortcutSchema = z.object({
	folderId: z.string(),
	name: z.string(),
	href: z.string(),
});

export const listShortcutsRoute = defineRoute({
	method: "get",
	path: "/api/v1/shortcuts",
	summary: "List sidebar shortcuts",
	description:
		"Folders pinned to the sidebar, in order, each with where the caller " +
		"reaches it. Shared by everyone in simple mode.",
	tags: ["Shortcuts"],
	response: z.array(shortcutSchema),
	errors: [500],
});

export const addShortcutRoute = defineRoute({
	method: "post",
	path: "/api/v1/shortcuts",
	summary: "Pin a folder to the sidebar",
	description: "Appends it; pinning it again changes nothing.",
	tags: ["Shortcuts"],
	body: z.object({ folderId: z.string() }),
	response: z.array(shortcutSchema),
	errors: [400, 404, 500],
});

export const reorderShortcutsRoute = defineRoute({
	method: "put",
	path: "/api/v1/shortcuts",
	summary: "Reorder sidebar shortcuts",
	description: "`folderIds` is the whole list, in its new order.",
	tags: ["Shortcuts"],
	body: z.object({ folderIds: z.array(z.string()) }),
	response: z.array(shortcutSchema),
	errors: [400, 500],
});

export const removeShortcutRoute = defineRoute({
	method: "delete",
	path: "/api/v1/shortcuts/{folderId}",
	summary: "Unpin a folder from the sidebar",
	tags: ["Shortcuts"],
	params: z.object({ folderId: z.string() }),
	response: z.array(shortcutSchema),
	errors: [500],
});
