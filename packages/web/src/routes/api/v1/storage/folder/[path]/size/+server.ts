import { Http } from "$lib/server/http";
import { getFolderSize } from "$lib/server/openapi/v1/storage";

export const GET = getFolderSize.handler(async ({ params, query, service }) => {
	let folderPath: string | null;

	try {
		folderPath = service.getFullFolderPath(params.path, query.parent);
	} catch (e) {
		return Http.ServerError("Failed to calculate folder size", e);
	}

	try {
		const data = await service.calculateFolderSize(folderPath);

		if (!data) {
			return Http.BadRequest("Failed to find requested folder");
		}

		return Http.Ok(data);
	} catch (error) {
		return Http.ServerError("Failed to calculate folder size", error);
	}
});
