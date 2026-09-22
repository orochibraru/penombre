import { Http } from "#lib/server/http.js";
import { listFiles } from "#lib/server/openapi/v1/storage.js";
import { pageOptions } from "#lib/server/services/storage/listings.js";

export const GET = listFiles.handler(async ({ query, service }) => {
	try {
		const data = await service.listFolderPage(undefined, pageOptions(query));
		return Http.Ok(data);
	} catch (error) {
		return Http.ServerError("Failed to list items", error);
	}
});
