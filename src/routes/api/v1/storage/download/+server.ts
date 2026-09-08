import { Readable } from "node:stream";
import { Http } from "$lib/server/http";
import { bulkDownload } from "$lib/server/openapi/v1/storage";

export const POST = bulkDownload.handler(async ({ body, service }) => {
	try {
		const { stream } = await service.createZipFromPaths(body.paths);
		const filename = service.generateZipFilename(body.paths);

		return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
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
