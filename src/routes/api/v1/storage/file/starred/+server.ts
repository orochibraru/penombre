import { Http } from "#lib/server/http.js";
import { listStarredFiles } from "#lib/server/openapi/v1/storage.js";
import { pageOptions } from "#lib/server/services/storage/listings.js";

export const GET = listStarredFiles.handler(async ({ query, service }) => {
	try {
		const objects = await service.listStarredFiles(pageOptions(query));
		return Http.Ok(objects);
	} catch (error) {
		return Http.ServerError("Failed to list starred files", error);
	}
});
