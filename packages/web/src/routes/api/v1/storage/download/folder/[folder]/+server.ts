import { Readable } from "node:stream";
import { Http } from "$lib/server/http";
import { downloadFolder } from "$lib/server/openapi/v1/storage";

export const GET = downloadFolder.handler(
	async ({ params, query, service }) => {
		const decodedFolder = decodeURIComponent(params.folder);
		const fullPath = query.folder
			? `${query.folder}/${decodedFolder}`
			: decodedFolder;

		try {
			const { stream } = await service.createZipFromFolder(fullPath);
			const filename = `${decodedFolder}.zip`;

			return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
				headers: {
					"Content-Type": "application/zip",
					"Content-Disposition": `attachment; filename="${filename}"`,
					"Cache-Control": "no-cache",
				},
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes("not found")) {
				return Http.NotFound("Folder not found");
			}
			return Http.ServerError("Failed to create folder download", error);
		}
	},
);
