import { Http } from "#lib/server/http.js";
import { downloadAllFileVersions } from "#lib/server/openapi/v1/versions.js";

export const GET = downloadAllFileVersions.handler(
	async ({ params, service }) => {
		const [listed, stream] = await Promise.all([
			service.listFileVersions(params.id),
			service.versionsZip(params.id),
		]);
		if (!(listed && stream)) {
			return Http.NotFound("No versions");
		}
		const name = listed.file.name.replace(/\.[^.]+$/, "");
		return new Response(stream, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${name} (versions).zip`)}`,
				"Cache-Control": "no-cache",
			},
		});
	},
);
