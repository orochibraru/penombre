import { Http } from "$lib/server/http";
import {
	deleteFolder,
	getFolder,
	updateFolder,
} from "$lib/server/openapi/v1/storage";

export const GET = getFolder.handler(async ({ params, event }) => {
	const storageService = event.locals.storageService;
	try {
		const folder = await storageService.getFolder(params.path);
		return Http.Ok(folder);
	} catch (error) {
		return Http.ServerError("Failed to get folder", error);
	}
});

export const PUT = updateFolder.handler(async ({ params, body, event }) => {
	const storageService = event.locals.storageService;
	const folderPath = storageService.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await storageService.updateFolderMeta(folderPath, body);
		return Http.Ok({ message: "Folder metadata updated." });
	} catch (error) {
		return Http.ServerError("Failed to update folder metadata", error);
	}
});

export const DELETE = deleteFolder.handler(async ({ params, body, event }) => {
	const storageService = event.locals.storageService;
	const folderPath = storageService.getFullFolderPath(
		params.path,
		body.parentFolderId,
	);
	try {
		await storageService.deleteFolder(folderPath);
		return Http.Ok({ message: "Folder permanently deleted." });
	} catch (error) {
		return Http.ServerError("Failed to delete folder", error);
	}
});
