import { Http } from "$lib/server/http";
import { listRecentFiles } from "$lib/server/openapi/v1/storage";

export const GET = listRecentFiles.handler(async ({ event }) => {
	const storageService = event.locals.storageService;
	try {
		const data = await storageService.listRecentFiles();
		return Http.Ok(data);
	} catch (error) {
		return Http.ServerError("Failed to list recent items", error);
	}
});
