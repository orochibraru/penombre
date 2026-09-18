import { Http } from "#lib/server/http.js";
import { listStarredFiles } from "#lib/server/openapi/v1/storage.js";

export const GET = listStarredFiles.handler(async ({ service }) => {
	try {
		const objects = await service.listStarredFiles();
		return Http.Ok(objects);
	} catch (error) {
		return Http.ServerError("Failed to list starred files", error);
	}
});
