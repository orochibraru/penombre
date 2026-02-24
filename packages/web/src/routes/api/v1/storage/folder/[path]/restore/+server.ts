import { Http } from "$lib/server/http";
import { restoreFolder } from "$lib/server/openapi/v1/storage";

export const POST = restoreFolder.handler(async ({ params, body, service }) => {
	const folderPath = service.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await service.restoreFolder(folderPath);
		return Http.Ok({ message: "Folder restored from trash." });
	} catch (error) {
		return Http.ServerError("Failed to restore folder", error);
	}
});
