import { Http } from "#lib/server/http.js";
import { mergeFileVersions } from "#lib/server/openapi/v1/versions.js";

export const POST = mergeFileVersions.handler(async ({ body, service }) => {
	const id = await service.mergeAsVersions(body.ids, body.name);
	if (!id) {
		return Http.NotFound("File not found");
	}
	return Http.Ok({ id });
});
