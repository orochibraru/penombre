import { Logger } from "#lib/logger.js";
import { Http } from "#lib/server/http.js";
import { listFilesInFolder } from "#lib/server/openapi/v1/storage.js";

const logger = new Logger("Storage List API");

export const GET = listFilesInFolder.handler(async ({ params, service }) => {
	logger.debug(`Listing files in: ${params.path}`);
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
