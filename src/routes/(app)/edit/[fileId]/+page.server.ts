import { error } from "@sveltejs/kit";
import { officeKindForName } from "$lib/documents";
import { Logger } from "$lib/logger";
import { officeToText } from "$lib/server/office";
import { storageServiceFor } from "$lib/server/services/storage-for";

const logger = new Logger("Editor");

export const load = async ({ params, url, locals }) => {
	if (!locals.user) {
		return error(401);
	}

	// See the viewer: where the file lives travels in the query, not as a
	// route parameter.
	const service = await storageServiceFor(locals.storageOwner ?? locals.user, {
		url,
		locals,
	});
	const path = await service.findFileById(params.fileId);
	if (!path) {
		return error(404, "That document does not exist.");
	}

	const raw = await service.getRawFileData(path);
	if (!raw) {
		return error(404, "That document has no content yet.");
	}

	const name = raw.meta.metadata.name ?? params.fileId;
	const kind = officeKindForName(name);

	if (kind) {
		// A Word, Excel or PowerPoint file: converted for the editor, and
		// written back into the original archive when it is saved, so the
		// file on disk stays the format it was.
		try {
			return {
				fileId: params.fileId,
				name,
				contentType:
					raw.meta.metadata.contentType ?? "application/octet-stream",
				content: officeToText(name, raw.buffer),
				office: true as const,
			};
		} catch (cause) {
			logger.error(cause, `Could not read ${name} as an Office document`);
			return error(422, "That file could not be read as an Office document.");
		}
	}

	return {
		fileId: params.fileId,
		name,
		contentType: raw.meta.metadata.contentType ?? "text/plain",
		// Text by definition: only the three native kinds reach here, and
		// each of them stores a text format.
		content: new TextDecoder().decode(raw.buffer),
		office: false as const,
	};
};
