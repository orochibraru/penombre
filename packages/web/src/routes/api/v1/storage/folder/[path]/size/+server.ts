import { Http } from "$lib/server/http";
import { getFolderSize } from "$lib/server/openapi/v1/storage";

export const GET = getFolderSize.handler(async ({ params, query, event }) => {
	const storageService = event.locals.storageService;

	let folderPath: string | null;

	try {
		folderPath = storageService.getFullFolderPath(params.path, query.parent);
	} catch (e) {
		return Http.ServerError("Failed to calculate folder size", e);
	}

	try {
		const data = await storageService.calculateFolderSize(folderPath);

		if (!data) {
			return Http.BadRequest("Failed to find requested folder");
		}

		return Http.Ok(data);
	} catch (error) {
		return Http.ServerError("Failed to calculate folder size", error);
	}
});
