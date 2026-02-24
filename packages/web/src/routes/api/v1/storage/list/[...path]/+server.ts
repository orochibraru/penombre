import { Http } from "$lib/server/http";
import { listFilesInFolder } from "$lib/server/openapi/v1/storage";

export const GET = listFilesInFolder.handler(async ({ params, service }) => {
	console.debug(params.path);
	try {
		const data = await service.listFiles(params.path);
		if (!data) {
			return Http.BadRequest("Failed to find requested folder");
		}
		return Http.Ok(data);
	} catch (error) {
		return Http.ServerError("Failed to list items in folder", error);
	}
});
