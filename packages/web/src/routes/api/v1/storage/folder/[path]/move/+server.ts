import { Http } from "$lib/server/http";
import { moveFolderRoute } from "$lib/server/openapi/v1/storage";

export const POST = moveFolderRoute.handler(
	async ({ params, body, service }) => {
		const folderPath = service.getFullFolderPath(
			params.path,
			body.parentFolderId,
		);
		try {
			await service.moveFolder(folderPath, body.destination);
			return Http.Ok({ message: "Folder moved successfully." });
		} catch (error) {
			if (error instanceof Error && error.message.includes("into itself")) {
				return Http.BadRequest("Cannot move a folder into itself.");
			}
			return Http.ServerError("Failed to move folder", error);
		}
	},
);
