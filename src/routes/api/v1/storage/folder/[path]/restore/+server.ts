import { Http } from "#lib/server/http.js";
import { restoreFolder } from "#lib/server/openapi/v1/storage.js";

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
