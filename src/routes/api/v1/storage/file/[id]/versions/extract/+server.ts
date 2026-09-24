import { Http } from "#lib/server/http.js";
import { extractFileVersions } from "#lib/server/openapi/v1/versions.js";

export const POST = extractFileVersions.handler(
	async ({ params, body, service }) => {
		const ids = await service.extractVersions(params.id, body.ids);
		if (!ids) {
			return Http.NotFound("File not found");
		}
		return Http.Ok({ ids });
	},
);
