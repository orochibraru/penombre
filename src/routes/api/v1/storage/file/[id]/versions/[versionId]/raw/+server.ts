import { Http } from "#lib/server/http.js";
import { downloadFileVersion } from "#lib/server/openapi/v1/versions.js";
import {
	isActiveContentType,
	parseRange,
	rawFileSecurityHeaders,
} from "#lib/server/services/storage/mappers.js";

export const GET = downloadFileVersion.handler(
	async ({ params, query, event, service }) => {
		const opened = await service.openVersion(params.id, params.versionId);
		if (!opened) {
			return Http.NotFound("Version not found");
		}
		const { file, version } = opened;
		const contentType = version.contentType;
		const name = file.metadata.name ?? "download";
		// Inline so a version previews and plays; active types never render.
		const disposition =
			query.download === "1" || isActiveContentType(contentType)
				? "attachment"
				: "inline";
		const headers = {
			"Content-Type": contentType,
			"Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(name)}`,
			"Accept-Ranges": "bytes",
			"Cache-Control": "private, no-store",
			...rawFileSecurityHeaders(contentType),
		};
		const range = parseRange(event.request.headers.get("range"), version.size);
		if (range) {
			return new Response(await opened.stream(range.start, range.end), {
				status: 206,
				headers: {
					...headers,
					"Content-Range": `bytes ${range.start}-${range.end}/${version.size}`,
					"Content-Length": String(range.end - range.start + 1),
				},
			});
		}
		return new Response(await opened.stream(), {
			headers: { ...headers, "Content-Length": String(version.size) },
		});
	},
);
