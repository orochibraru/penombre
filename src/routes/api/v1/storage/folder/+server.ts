import { Http } from "#lib/server/http.js";
import { createFolder, listFolders } from "#lib/server/openapi/v1/storage.js";

export const GET = listFolders.handler(async ({ service }) => {
	try {
		const folders = await service.listFoldersWithMetadata("", {
			includeTrashed: false,
		});
		return Http.Ok(folders);
	} catch (error) {
		return Http.ServerError("Failed to list folders", error);
	}
});

export const POST = createFolder.handler(async ({ body, service }) => {
	try {
		const result = await service.createFolder(body.name, body.parent);
		return Http.StandardizedResponse(
			{
				data: {
					message: "Folder created successfully.",
					id: result.id,
					name: result.name,
					path: result.path,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		return Http.ServerError("Failed to create folder", error);
	}
});
