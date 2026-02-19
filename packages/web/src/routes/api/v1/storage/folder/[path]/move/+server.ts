import { Http } from "$lib/server/http";
import { moveFolderRoute } from "$lib/server/openapi/v1/storage";

export const POST = moveFolderRoute.handler(async ({ params, body, event }) => {
	const storageService = event.locals.storageService;
	const folderPath = storageService.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await storageService.moveFolder(folderPath, body.destination);
		return Http.Ok({ message: "Folder moved successfully." });
	} catch (error) {
		if (error instanceof Error && error.message.includes("into itself")) {
			return Http.BadRequest("Cannot move a folder into itself.");
		}
		return Http.ServerError("Failed to move folder", error);
	}
});
