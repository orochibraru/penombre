import { FileOrFolderNotFoundError } from "#lib/server/errors.js";
import { Http } from "#lib/server/http.js";
import { createBatchFiles } from "#lib/server/openapi/v1/storage.js";

export const POST = createBatchFiles.handler(
	async ({ query, body, service }) => {
		try {
			const results = await service.createBatchFiles(
				body.files,
				query.folder,
				body.mode,
			);
			return Http.Ok(results);
		} catch (error) {
			if (error instanceof FileOrFolderNotFoundError) {
				return Http.BadRequest("Destination folder not found");
			}
			return Http.ServerError("Failed to create batch files", error);
		}
	},
);
