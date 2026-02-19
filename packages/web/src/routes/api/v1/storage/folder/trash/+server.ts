import { Http } from "$lib/server/http";
import { listTrashedFolders } from "$lib/server/openapi/v1/storage";

export const GET = listTrashedFolders.handler(async ({ event }) => {
	const storageService = event.locals.storageService;
	try {
		const folders = await storageService.listFolders("", {
			onlyTrashed: true,
		});
		return Http.Ok(folders);
	} catch (error) {
		return Http.ServerError("Failed to list trashed folders", error);
	}
});
