import { Http } from "$lib/server/http";
import { getFolderTree } from "$lib/server/openapi/v1/storage";

export const GET = getFolderTree.handler(async ({ event }) => {
	const storageService = event.locals.storageService;
	try {
		const folders = await storageService.listFoldersWithMetadata("", {
			includeTrashed: false,
		});
		return Http.Ok(folders);
	} catch (error) {
		return Http.ServerError("Failed to list folder tree", error);
	}
});
