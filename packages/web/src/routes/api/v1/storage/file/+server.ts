import { Http } from "$lib/server/http";
import { createFile } from "$lib/server/openapi/v1/storage";

export const POST = createFile.handler(async ({ query, body, service }) => {
	try {
		const res = await service.createFile(body, query.folder);
		return Http.Ok(res);
	} catch (error) {
		return Http.ServerError("Failed to create file", error);
	}
});
