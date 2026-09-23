import { Http } from "#lib/server/http.js";
import { listTrashFiles } from "#lib/server/openapi/v1/storage.js";
import { pageOptions } from "#lib/server/services/storage/listings.js";

export const GET = listTrashFiles.handler(async ({ query, service }) => {
	try {
		const objects = await service.listTrashFiles(pageOptions(query));
		return Http.Ok(objects);
	} catch (error) {
		return Http.ServerError("Failed to list trashed files", error);
	}
});
