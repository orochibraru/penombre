import { Http } from "$lib/server/http";
import { listFilesByCategory } from "$lib/server/openapi/v1/storage";
import { allowedFileCategories, type FileCategory } from "$lib/server/schema";

export const GET = listFilesByCategory.handler(async ({ params, event }) => {
	const cat = params.category?.toUpperCase();
	if (!allowedFileCategories.includes(cat as FileCategory)) {
		return Http.BadRequest("Invalid category");
	}
	const storageService = event.locals.storageService;
	try {
		const objects = await storageService.listFilesPerCategory(
			cat as FileCategory,
		);
		return Http.Ok(objects);
	} catch (error) {
		return Http.ServerError("Failed to list files by category", error);
	}
});
