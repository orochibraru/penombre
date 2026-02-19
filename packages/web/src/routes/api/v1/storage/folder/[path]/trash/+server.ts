import { Http } from "$lib/server/http";
import { trashFolder } from "$lib/server/openapi/v1/storage";

export const POST = trashFolder.handler(async ({ params, body, event }) => {
	const storageService = event.locals.storageService;
	const folderPath = storageService.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await storageService.trashFolder(folderPath);
		return Http.Ok({ message: "Folder moved to trash." });
	} catch (error) {
		return Http.ServerError("Failed to trash folder", error);
	}
});
