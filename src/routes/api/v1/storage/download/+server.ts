import { Http } from "#lib/server/http.js";
import { bulkDownload } from "#lib/server/openapi/v1/storage.js";

export const POST = bulkDownload.handler(async ({ body, service }) => {
	try {
		const stream = await service.createZipFromPaths(body.paths);
		const filename = service.generateZipFilename(body.paths);

		return new Response(stream, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Cache-Control": "no-cache",
			},
		});
	} catch (error) {
		return Http.ServerError("Failed to create bulk download", error);
	}
});
