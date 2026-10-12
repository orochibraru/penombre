import { Http } from "#lib/server/http.js";
import { editPdfFile, getPdfLayout } from "#lib/server/openapi/v1/pdf.js";
import {
	describePdf,
	editPdf,
	PdfEditError,
} from "#lib/server/services/pdf-edit.js";
import type { StorageService } from "#lib/server/services/storage/index.js";
import {
	oneSaveAtATime,
	revisionOf,
} from "#lib/server/services/storage/revision.js";

/** The file's bytes, or the response that says why there are none. */
async function readPdf(service: StorageService, id: string) {
	const path = await service.findFileById(id);
	if (!path) {
		return Http.NotFound(`File ${id} not found`);
	}
	const raw = await service.getRawFileData(path);
	if (!raw) {
		return Http.NotFound(`File ${id} has no content`);
	}
	const name = raw.meta.metadata.name ?? path;
	if (!/\.pdf$/i.test(name)) {
		return Http.BadRequest(`${name} is not a PDF`);
	}
	return new Uint8Array(raw.buffer);
}

export const GET = getPdfLayout.handler(async ({ params, service }) => {
	const bytes = await readPdf(service, params.id);
	if (bytes instanceof Response) {
		return bytes;
	}
	try {
		return Http.Ok({
			revision: revisionOf(bytes),
			canWrite: !service.readOnly,
			...(await describePdf(bytes)),
		});
	} catch (error) {
		if (error instanceof PdfEditError) {
			return Http.UnprocessableEntity(error.message);
		}
		return Http.ServerError("Could not read the PDF", error);
	}
});

export const POST = editPdfFile.handler(({ params, body, service, user }) => {
	if (service.readOnly) {
		return Http.Forbidden("This PDF is read-only here.");
	}
	return oneSaveAtATime(params.id, async () => {
		const bytes = await readPdf(service, params.id);
		if (bytes instanceof Response) {
			return bytes;
		}
		const current = revisionOf(bytes);
		if (body.base && current !== body.base) {
			return Http.Conflict("The file changed since it was opened.", {
				revision: current,
			});
		}
		let edited: Uint8Array;
		try {
			edited = await editPdf(bytes, { ...body, author: user.name });
		} catch (error) {
			if (error instanceof PdfEditError) {
				return Http.UnprocessableEntity(error.message);
			}
			return Http.ServerError("Could not edit the PDF", error);
		}
		try {
			// An explicit save, unlike an editor's autosave: the bytes before
			// it are kept as a version where versioning is on.
			await service.uploadFileBody(params.id, edited);
			return Http.Ok({ message: "PDF saved.", revision: revisionOf(edited) });
		} catch (error) {
			return Http.ServerError("Save error", error);
		}
	});
});
