import { Http } from "#lib/server/http.js";
import {
	getFolderSettings,
	updateFolderSettings,
} from "#lib/server/openapi/v1/versions.js";

export const GET = getFolderSettings.handler(async ({ params, service }) => {
	const found = await service.getFolderVersioning(params.path);
	if (!found) {
		return Http.NotFound("Folder not found");
	}
	return Http.Ok({
		settings: found.settings,
		effective: found.effective,
		inherited: found.inherited,
		adminEnabled: found.adminEnabled,
		adminMax: found.adminMax,
	});
});

export const PUT = updateFolderSettings.handler(
	async ({ params, body, service }) => {
		if (!(await service.setFolderSettings(params.path, body))) {
			return Http.NotFound("Folder not found");
		}
		return Http.Ok({ message: "Folder settings saved." });
	},
);
