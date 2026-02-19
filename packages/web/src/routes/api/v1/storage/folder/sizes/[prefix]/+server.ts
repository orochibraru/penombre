import { Http } from "$lib/server/http";
import { getFolderSizes } from "$lib/server/openapi/v1/storage";

export const GET = getFolderSizes.handler(async ({ params, event }) => {
	const storageService = event.locals.storageService;
	try {
		const sizes = await storageService.calculateFolderSizes(
			params.prefix || "",
		);
		const result = Object.fromEntries(sizes);
		return Http.Ok(result);
	} catch (error) {
		return Http.ServerError("Failed to calculate folder sizes", error);
	}
});
