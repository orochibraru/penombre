import { Http } from "#lib/server/http.js";
import { removeShortcutRoute } from "#lib/server/openapi/v1/shortcuts.js";
import {
	listShortcuts,
	removeShortcut,
} from "#lib/server/services/shortcuts.js";

export const DELETE = removeShortcutRoute.handler(
	async ({ params, user, event }) => {
		const owner = event.locals.storageOwner?.id ?? user.id;
		try {
			await removeShortcut(owner, params.folderId);
			return Http.Ok(await listShortcuts(owner, user.id));
		} catch (error) {
			return Http.ServerError("Failed to remove shortcut", error);
		}
	},
);
