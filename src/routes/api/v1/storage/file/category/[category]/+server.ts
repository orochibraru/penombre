import { Http } from "#lib/server/http.js";
import { listFilesByCategory } from "#lib/server/openapi/v1/storage.js";
import {
	allowedFileCategories,
	type FileCategory,
} from "#lib/server/schema.js";
import { pageOptions } from "#lib/server/services/storage/listings.js";

export const GET = listFilesByCategory.handler(
	async ({ params, query, service }) => {
		const cat = params.category?.toUpperCase();
		if (!allowedFileCategories.includes(cat as FileCategory)) {
			return Http.BadRequest("Invalid category");
		}
		try {
			const objects = await service.listFilesPerCategory(
				cat as FileCategory,
				pageOptions(query),
			);
			return Http.Ok(objects);
		} catch (error) {
			return Http.ServerError("Failed to list files by category", error);
		}
	},
);
