import { Http } from "$lib/server/http";
import { listStarredFiles } from "$lib/server/openapi/v1/storage";

export const GET = listStarredFiles.handler(async ({ event }) => {
	const storageService = event.locals.storageService;
	try {
		const objects = await storageService.listStarredFiles();
		return Http.Ok(objects);
	} catch (error) {
		return Http.ServerError("Failed to list starred files", error);
	}
});
