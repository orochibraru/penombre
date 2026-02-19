import { FileOrFolderNotFoundError } from "$lib/server/errors";
import { Http } from "$lib/server/http";
import {
	deleteFile,
	getFile,
	updateFile,
} from "$lib/server/openapi/v1/storage";

export const GET = getFile.handler(async ({ params, query, event }) => {
	const storageService = event.locals.storageService;
	const decodedItemName = decodeURIComponent(params.id);

	try {
		const result = await storageService.handleProxyRequest({
			itemName: decodedItemName,
			raw: query.raw === "true",
			thumbnail: query.thumbnail === "true",
			size: query.size,
			ifNoneMatch: event.request.headers.get("If-None-Match") ?? undefined,
			rangeHeader:
				event.request.headers.get("range") ??
				event.request.headers.get("Range") ??
				undefined,
		});

		if (result instanceof Response) {
			return result;
		}

		return Http.Ok(result);
	} catch (error) {
		if (error instanceof FileOrFolderNotFoundError) {
			return Http.NotFound("File not found");
		}
		return Http.ServerError("Failed to retrieve file", error);
	}
});

export const PUT = updateFile.handler(
	async ({ params, query, body, event }) => {
		const storageService = event.locals.storageService;
		const fullPath = `${query.folder ? `${query.folder}/` : ""}${params.id}`;
		const decodedItemName = decodeURIComponent(fullPath);

		const exists = await storageService.fileExists(decodedItemName);
		if (!exists) {
			return Http.NotFound("File not found");
		}

		try {
			await storageService.updateFile(decodedItemName, body);
			return Http.Ok({ message: "File metadata updated successfully." });
		} catch (error) {
			return Http.ServerError("Failed to update file metadata", error);
		}
	},
);

export const DELETE = deleteFile.handler(async ({ params, event }) => {
	const storageService = event.locals.storageService;
	const decodedItemName = decodeURIComponent(params.id);

	const exists = await storageService.fileExists(decodedItemName);
	if (!exists) {
		return Http.NotFound("File not found");
	}

	try {
		await storageService.deleteFile(decodedItemName);
		return Http.Ok({ message: "File deleted successfully." });
	} catch (error) {
		return Http.ServerError("Failed to delete file", error);
	}
});
