import { Http } from "$lib/server/http";
import { createFolder, listFolders } from "$lib/server/openapi/v1/storage";

export const GET = listFolders.handler(async ({ event }) => {
	const storageService = event.locals.storageService;
	try {
		const folders = await storageService.listFolders("", {
			includeTrashed: false,
		});
		return Http.Ok(folders);
	} catch (error) {
		return Http.ServerError("Failed to list folders", error);
	}
});

export const POST = createFolder.handler(async ({ body, event }) => {
	const storageService = event.locals.storageService;
	try {
		const result = await storageService.createFolder(body.name, body.parent);
		return Http.StandardizedResponse(
			{
				data: {
					message: "Folder created successfully.",
					id: result.id,
					name: result.name,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		return Http.ServerError("Failed to create folder", error);
	}
});
