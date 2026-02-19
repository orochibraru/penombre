import { Http } from "$lib/server/http";
import { getFileCounts } from "$lib/server/openapi/v1/storage";

export const GET = getFileCounts.handler(async ({ event }) => {
	const storageService = event.locals.storageService;
	try {
		const [trash, starred] = await Promise.all([
			storageService.countTrashedItems(),
			storageService.countStarredItems(),
		]);
		return Http.Ok({ trash, starred });
	} catch (error) {
		return Http.ServerError("Failed to get counts", error);
	}
});
