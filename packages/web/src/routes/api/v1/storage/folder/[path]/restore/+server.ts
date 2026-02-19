import { Http } from "$lib/server/http";
import { restoreFolder } from "$lib/server/openapi/v1/storage";

export const POST = restoreFolder.handler(async ({ params, body, event }) => {
	const storageService = event.locals.storageService;
	const folderPath = storageService.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await storageService.restoreFolder(folderPath);
		return Http.Ok({ message: "Folder restored from trash." });
	} catch (error) {
		return Http.ServerError("Failed to restore folder", error);
	}
});
