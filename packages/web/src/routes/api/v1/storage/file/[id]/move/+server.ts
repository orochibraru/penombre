import { Http } from "$lib/server/http";
import { moveFile } from "$lib/server/openapi/v1/storage";

export const POST = moveFile.handler(async ({ params, body, service }) => {
	const decodedItemName = decodeURIComponent(params.id);

	const exists = await service.fileExists(decodedItemName);
	if (!exists) {
		return Http.NotFound("File not found");
	}

	try {
		await service.moveFile(decodedItemName, body.destination);
		return Http.Ok({ message: "File moved successfully." });
	} catch (error) {
		return Http.ServerError("Failed to move file", error);
	}
});
