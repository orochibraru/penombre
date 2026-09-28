import { Http } from "#lib/server/http.js";
import {
	addShortcutRoute,
	listShortcutsRoute,
	reorderShortcutsRoute,
} from "#lib/server/openapi/v1/shortcuts.js";
import {
	addShortcut,
	listShortcuts,
	reorderShortcuts,
} from "#lib/server/services/shortcuts.js";

export const GET = listShortcutsRoute.handler(async ({ user, event }) => {
	const owner = event.locals.storageOwner?.id ?? user.id;
	try {
		return Http.Ok(await listShortcuts(owner, user.id));
	} catch (error) {
		return Http.ServerError("Failed to list shortcuts", error);
	}
});

export const POST = addShortcutRoute.handler(async ({ body, user, event }) => {
	const owner = event.locals.storageOwner?.id ?? user.id;
	try {
		if (!(await addShortcut(owner, user.id, body.folderId))) {
			return Http.NotFound("Folder not found");
		}
		return Http.Ok(await listShortcuts(owner, user.id));
	} catch (error) {
		return Http.ServerError("Failed to add shortcut", error);
	}
});

export const PUT = reorderShortcutsRoute.handler(
	async ({ body, user, event }) => {
		const owner = event.locals.storageOwner?.id ?? user.id;
		try {
			await reorderShortcuts(owner, body.folderIds);
			return Http.Ok(await listShortcuts(owner, user.id));
		} catch (error) {
			return Http.ServerError("Failed to reorder shortcuts", error);
		}
	},
);
