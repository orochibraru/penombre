import { Http } from "#lib/server/http.js";
import { reorderFileVersions } from "#lib/server/openapi/v1/versions.js";

export const PUT = reorderFileVersions.handler(
	async ({ params, body, service }) => {
		if (!(await service.reorderFileVersions(params.id, body.ids))) {
			return Http.BadRequest("Not this file's versions");
		}
		return Http.Ok({ message: "Versions reordered" });
	},
);
