import { Http } from "$lib/server/http";
import { trashFolder } from "$lib/server/openapi/v1/storage";

export const POST = trashFolder.handler(async ({ params, body, service }) => {
	const folderPath = service.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await service.trashFolder(folderPath);
		return Http.Ok({ message: "Folder moved to trash." });
	} catch (error) {
		return Http.ServerError("Failed to trash folder", error);
	}
});
