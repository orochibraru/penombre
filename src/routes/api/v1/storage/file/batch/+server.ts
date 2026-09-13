import { FileOrFolderNotFoundError } from "$lib/server/errors";
import { Http } from "$lib/server/http";
import { createBatchFiles } from "$lib/server/openapi/v1/storage";

export const POST = createBatchFiles.handler(
	async ({ query, body, service }) => {
		try {
			const results = await service.createBatchFiles(body.files, query.folder);
			return Http.Ok(results);
		} catch (error) {
			if (error instanceof FileOrFolderNotFoundError) {
				return Http.BadRequest("Destination folder not found");
			}
			return Http.ServerError("Failed to create batch files", error);
		}
	},
);
