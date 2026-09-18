import { Http } from "#lib/server/http.js";
import { listTrashFiles } from "#lib/server/openapi/v1/storage.js";

export const GET = listTrashFiles.handler(async ({ service }) => {
	try {
		const objects = await service.listTrashFiles();
		return Http.Ok(objects);
	} catch (error) {
		return Http.ServerError("Failed to list trashed files", error);
	}
});
