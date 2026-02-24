import { Http } from "$lib/server/http";
import { duplicateFile } from "$lib/server/openapi/v1/storage";

export const POST = duplicateFile.handler(async ({ params, service }) => {
	const decodedItemName = decodeURIComponent(params.id);

	const exists = await service.fileExists(decodedItemName);
	if (!exists) {
		return Http.NotFound("File not found");
	}

	try {
		const newFile = await service.duplicateFile(decodedItemName);
		return Http.Ok(newFile);
	} catch (error) {
		return Http.ServerError("Failed to duplicate file", error);
	}
});
