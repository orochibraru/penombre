import { Http } from "#lib/server/http.js";
import { ensureRendition } from "#lib/server/openapi/v1/storage.js";
import type { RenditionHeight } from "#lib/server/services/storage/renditions.js";

export const POST = ensureRendition.handler(async ({ params, service }) => {
	const name = decodeURIComponent(params.id);
	const target = (await service.fileExists(name))
		? name
		: await service.findFileById(name);
	if (!target) {
		return Http.NotFound("File not found");
	}
	try {
		return Http.Ok(
			await service.renditions.ensure(
				target,
				Number(params.height) as RenditionHeight,
			),
		);
	} catch (error) {
		return Http.ServerError("Failed to prepare the rendition", error);
	}
});
