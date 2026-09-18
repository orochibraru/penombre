import { Http } from "#lib/server/http.js";
import { listTrashedFolders } from "#lib/server/openapi/v1/storage.js";

export const GET = listTrashedFolders.handler(async ({ service }) => {
	try {
		const folders = await service.listFoldersWithMetadata("", {
			onlyTrashed: true,
		});
		return Http.Ok(folders);
	} catch (error) {
		return Http.ServerError("Failed to list trashed folders", error);
	}
});
