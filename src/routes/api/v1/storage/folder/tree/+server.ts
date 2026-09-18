import { Http } from "#lib/server/http.js";
import { getFolderTree } from "#lib/server/openapi/v1/storage.js";

export const GET = getFolderTree.handler(async ({ service }) => {
	try {
		const folders = await service.listFoldersWithMetadata("", {
			includeTrashed: false,
		});
		return Http.Ok(folders);
	} catch (error) {
		return Http.ServerError("Failed to list folder tree", error);
	}
});
