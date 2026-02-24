import { Http } from "$lib/server/http";
import { createBatchFiles } from "$lib/server/openapi/v1/storage";

export const POST = createBatchFiles.handler(
	async ({ query, body, service }) => {
		try {
			const results = await service.createBatchFiles(body.files, query.folder);
			return Http.Ok(results);
		} catch (error) {
			return Http.ServerError("Failed to create batch files", error);
		}
	},
);
