import { Http } from "#lib/server/http.js";
import { restoreFileVersion } from "#lib/server/openapi/v1/versions.js";

export const POST = restoreFileVersion.handler(async ({ params, service }) => {
	if (!(await service.restoreVersion(params.id, params.versionId))) {
		return Http.NotFound("Version not found");
	}
	return Http.Ok({ message: "Version restored." });
});
