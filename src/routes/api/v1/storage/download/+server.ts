import { Http } from "#lib/server/http.js";
import {
	bulkDownload,
	bulkDownloadLink,
} from "#lib/server/openapi/v1/storage.js";

async function zipResponse(
	service: {
		createZipFromPaths: (paths: string[]) => Promise<ReadableStream>;
		generateZipFilename: (paths: string[]) => string;
	},
	paths: string[],
) {
	const stream = await service.createZipFromPaths(paths);
	const filename = service.generateZipFilename(paths);

	return new Response(stream, {
		headers: {
			"Content-Type": "application/zip",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-cache",
		},
	});
}

export const POST = bulkDownload.handler(async ({ body, service }) => {
	try {
		return await zipResponse(service, body.paths);
	} catch (error) {
		return Http.ServerError("Failed to create bulk download", error);
	}
});

/**
 * A plain link a `<a href>` can point at, for a native browser download
 * instead of a `fetch` + blob that buffers the whole archive in JS memory.
 */
export const GET = bulkDownloadLink.handler(async ({ query, service }) => {
	const keys = query.keys.split(",").filter(Boolean);
	const paths = keys.map((key) =>
		query.folder ? `${query.folder}/${key}` : key,
	);
	try {
		return await zipResponse(service, paths);
	} catch (error) {
		return Http.ServerError("Failed to create bulk download", error);
	}
});
