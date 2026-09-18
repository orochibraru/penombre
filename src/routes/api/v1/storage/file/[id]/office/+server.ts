import { Http } from "#lib/server/http.js";
import { isOfficeFile, textToOffice } from "#lib/server/office/index.js";
import { saveOfficeDocument } from "#lib/server/openapi/v1/storage.js";

/**
 * Saving an Office document is not an upload: the new bytes are the old file
 * with one part replaced, so the original has to be read here rather than
 * round-tripped through the browser. That is also what keeps the editor
 * honest — the client never holds a `.docx` it could mangle.
 */
export const POST = saveOfficeDocument.handler(
	async ({ params, body, service }) => {
		const path = await service.findFileById(params.id);
		if (!path) {
			return Http.NotFound(`File ${params.id} not found`);
		}

		const raw = await service.getRawFileData(path);
		if (!raw) {
			return Http.NotFound(`File ${params.id} has no content`);
		}

		const name = raw.meta.metadata.name ?? path;
		if (!isOfficeFile(name)) {
			return Http.BadRequest(`${name} is not an Office document`);
		}

		let bytes: Buffer;
		try {
			bytes = textToOffice(name, raw.buffer, body.content);
		} catch (err) {
			// The document was read to produce what the editor is sending
			// back, so a failure here is a document we cannot rewrite safely.
			// Answering 422 leaves the file on disk exactly as it was.
			return Http.UnprocessableEntity(
				`Could not write ${name} back as an Office document`,
				err,
			);
		}

		try {
			await service.uploadFileBody(params.id, bytes);
			return Http.Ok({ message: "Document saved." });
		} catch (err) {
			return Http.ServerError("Save error", err);
		}
	},
);
