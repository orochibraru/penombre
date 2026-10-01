import { Logger } from "#lib/logger.js";
import { Http } from "#lib/server/http.js";
import { UnsupportedPictureError } from "#lib/server/office/docx-media.js";
import {
	exportFile as convert,
	ExportFormatError,
	ExportUnavailableError,
	SheetTooLargeError,
} from "#lib/server/office/export/index.js";
import { exportFile } from "#lib/server/openapi/v1/documents.js";
import { rawFileSecurityHeaders } from "#lib/server/services/storage/mappers.js";

const logger = new Logger("Export");

/** Refusals the caller can act on, with the message that says how. */
function refusal(error: unknown): Response | null {
	if (error instanceof ExportFormatError) {
		return Http.BadRequest(error.message);
	}
	if (error instanceof ExportUnavailableError) {
		return Http.StandardizedResponse(
			{ message: error.message },
			{ status: 501 },
		);
	}
	if (
		error instanceof SheetTooLargeError ||
		error instanceof UnsupportedPictureError
	) {
		return Http.UnprocessableEntity(error.message);
	}
	return null;
}

export const GET = exportFile.handler(async ({ params, query, service }) => {
	const path = await service.findFileById(params.id);
	const raw = path ? await service.getRawFileData(path) : null;
	if (!raw) {
		return Http.NotFound(`File ${params.id} not found`);
	}
	const name = raw.meta.metadata.name ?? path ?? params.id;

	try {
		const exported = await convert(name, raw.buffer, query.format);
		return new Response(new Uint8Array(exported.data), {
			headers: {
				"Content-Type": exported.contentType,
				"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(exported.filename)}`,
				"Cache-Control": "no-store",
				...rawFileSecurityHeaders(exported.contentType.split(";")[0] ?? ""),
			},
		});
	} catch (error) {
		const refused = refusal(error);
		if (refused) {
			return refused;
		}
		// A file the reader cannot follow; the log has why, not the caller.
		logger.warn(`Export of ${params.id} as ${query.format} failed`, error);
		return Http.UnprocessableEntity(
			`Could not export this file as ${query.format}`,
		);
	}
});
