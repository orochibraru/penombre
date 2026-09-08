import { Http } from "$lib/server/http";
import { searchFiles } from "$lib/server/openapi/v1/storage";

export const GET = searchFiles.handler(async ({ query, service }) => {
	const parsedLimit = query.limit ? Number.parseInt(query.limit, 10) : 50;
	try {
		const objects = await service.searchFiles(query.q, parsedLimit);
		return Http.Ok(objects);
	} catch (error) {
		return Http.ServerError("Failed to search files", error);
	}
});
