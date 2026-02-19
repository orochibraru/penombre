import { Http } from "$lib/server/http";
import { moveFile } from "$lib/server/openapi/v1/storage";

export const POST = moveFile.handler(async ({ params, body, event }) => {
	const storageService = event.locals.storageService;
	const decodedItemName = decodeURIComponent(params.id);

	const exists = await storageService.fileExists(decodedItemName);
	if (!exists) {
		return Http.NotFound("File not found");
	}

	try {
		await storageService.moveFile(decodedItemName, body.destination);
		return Http.Ok({ message: "File moved successfully." });
	} catch (error) {
		return Http.ServerError("Failed to move file", error);
	}
});
