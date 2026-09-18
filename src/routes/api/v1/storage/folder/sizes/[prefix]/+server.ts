import { Http } from "#lib/server/http.js";
import { getFolderSizes } from "#lib/server/openapi/v1/storage.js";

export const GET = getFolderSizes.handler(async ({ params, service }) => {
	try {
		const sizes = await service.calculateFolderSizes(params.prefix || "");
		const result = Object.fromEntries(sizes);
		return Http.Ok(result);
	} catch (error) {
		return Http.ServerError("Failed to calculate folder sizes", error);
	}
});
