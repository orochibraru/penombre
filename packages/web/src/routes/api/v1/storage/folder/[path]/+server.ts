import { Http } from "$lib/server/http";
import {
	deleteFolder,
	getFolder,
	updateFolder,
} from "$lib/server/openapi/v1/storage";

export const GET = getFolder.handler(async ({ params, service }) => {
	try {
		const folder = await service.getFolder(params.path);
		return Http.Ok(folder);
	} catch (error) {
		return Http.ServerError("Failed to get folder", error);
	}
});

export const PUT = updateFolder.handler(async ({ params, body, service }) => {
	const folderPath = service.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await service.updateFolderMeta(folderPath, body);
		return Http.Ok({ message: "Folder metadata updated." });
	} catch (error) {
		return Http.ServerError("Failed to update folder metadata", error);
	}
});

export const DELETE = deleteFolder.handler(
	async ({ params, body, service }) => {
		const folderPath = service.getFullFolderPath(
			params.path,
			body.parentFolderId,
		);
		try {
			await service.deleteFolder(folderPath);
			return Http.Ok({ message: "Folder permanently deleted." });
		} catch (error) {
			return Http.ServerError("Failed to delete folder", error);
		}
	},
);
