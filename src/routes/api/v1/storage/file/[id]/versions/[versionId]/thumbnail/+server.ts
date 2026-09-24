import { Http } from "#lib/server/http.js";
import { getFileVersionThumbnail } from "#lib/server/openapi/v1/versions.js";

const PIXELS = { small: 100, medium: 200, large: 300 } as const;

export const GET = getFileVersionThumbnail.handler(
	async ({ params, query, event, service }) => {
		const thumb = await service.versionThumbnail(
			params.id,
			params.versionId,
			PIXELS[query.size ?? "medium"],
			event.request.headers.get("if-none-match") ?? undefined,
		);
		if (!thumb) {
			return Http.NotFound("No thumbnail for this version");
		}
		// Same rules as a file's: scoped to access, revalidated, never public.
		const headers = { "Cache-Control": "private, no-cache", ETag: thumb.etag };
		if (!thumb.buffer) {
			return new Response(null, { status: 304, headers });
		}
		return new Response(new Uint8Array(thumb.buffer), {
			headers: {
				...headers,
				"Content-Type": thumb.contentType,
				"Content-Length": String(thumb.buffer.length),
			},
		});
	},
);
