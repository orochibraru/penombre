import { Http } from "#lib/server/http.js";
import { readZip } from "#lib/server/office/zip.js";
import { presentationMedia } from "#lib/server/openapi/v1/presentations.js";
import { rawFileSecurityHeaders } from "#lib/server/services/storage/mappers.js";

const TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	bmp: "image/bmp",
	webp: "image/webp",
	svg: "image/svg+xml",
	tif: "image/tiff",
	tiff: "image/tiff",
};

/**
 * One picture out of a deck. The whole archive is read to find it, so the
 * answer is cached against the file's own date: a deck's pictures are asked
 * for on every open and change only when the deck does.
 */
export const GET = presentationMedia.handler(
	async ({ params, query, service, event }) => {
		const type = TYPES[query.part.split(".").pop()?.toLowerCase() ?? ""];
		if (!type || !/^ppt\/media\/[^/]+$/.test(query.part)) {
			return Http.BadRequest("Not a picture in this presentation");
		}
		const path = await service.findFileById(params.id);
		const raw = path ? await service.getRawFileData(path) : null;
		if (!raw || !raw.meta.metadata.name?.toLowerCase().endsWith(".pptx")) {
			return Http.NotFound("Presentation not found");
		}
		const tag = `"${raw.mtime}:${query.part}"`;
		if (event.request.headers.get("if-none-match") === tag) {
			return new Response(null, { status: 304, headers: { ETag: tag } });
		}
		// ponytail: inflates every part to find one; a lazy central-directory
		// lookup in zip.ts would do, if big decks make this slow.
		const entry = readZip(raw.buffer).find(
			(candidate) => candidate.name === query.part,
		);
		if (!entry) {
			return Http.NotFound("No such picture");
		}
		return new Response(new Uint8Array(entry.data), {
			headers: {
				"Content-Type": type,
				"Cache-Control": "private, no-cache",
				ETag: tag,
				...rawFileSecurityHeaders(type),
			},
		});
	},
);
