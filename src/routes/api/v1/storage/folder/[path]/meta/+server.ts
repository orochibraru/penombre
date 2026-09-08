import { Http } from "$lib/server/http";
import { getFolderMeta } from "$lib/server/openapi/v1/storage";

export const GET = getFolderMeta.handler(async ({ params, query, service }) => {
	const folderPath = service.getFullFolderPath(params.path, query.parent);
	try {
		const meta = await service.getFolderMeta(folderPath);
		if (!meta) {
			return Http.NotFound("Folder not found");
		}
		return Http.Ok(meta);
	} catch (error) {
		return Http.ServerError("Failed to get folder metadata", error);
	}
});
