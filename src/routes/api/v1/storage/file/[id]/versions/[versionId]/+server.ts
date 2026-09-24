import { Http } from "#lib/server/http.js";
import { deleteFileVersion } from "#lib/server/openapi/v1/versions.js";

export const DELETE = deleteFileVersion.handler(async ({ params, service }) => {
	if (!(await service.deleteFileVersion(params.id, params.versionId))) {
		return Http.NotFound("Version not found");
	}
	return Http.Ok({ message: "Version deleted." });
});
