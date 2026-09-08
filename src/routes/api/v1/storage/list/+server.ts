import { Http } from "$lib/server/http";
import { listFiles } from "$lib/server/openapi/v1/storage";

export const GET = listFiles.handler(async ({ service }) => {
	try {
		const data = await service.listFiles();
		return Http.Ok(data);
	} catch (error) {
		return Http.ServerError("Failed to list items", error);
	}
});
