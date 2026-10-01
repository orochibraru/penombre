import { error } from "@sveltejs/kit";
import { officeKindForName } from "#lib/documents.js";
import { Logger } from "#lib/logger.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { officeToText } from "#lib/server/office/index.js";
import { editorAccess } from "#lib/server/services/editor-access.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

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
	}).catch((refusal: unknown) => {
		if (refusal instanceof DriveAccessError) {
			return error(404, "That document does not exist.");
		}
		throw refusal;
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
	// A view-only share, a drive viewer or a read-only mount opens in view
	// mode, whatever the page's switch says.
	const file = {
		fileId: params.fileId,
		path,
		name,
		...editorAccess(service, url),
	};

	if (kind) {
		// A Word, Excel or PowerPoint file: converted for the editor, and
		// written back into the original archive when it is saved, so the
		// file on disk stays the format it was.
		try {
			return {
				...file,
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

	// Saving a binary decoded as text would destroy it.
	if (new Uint8Array(raw.buffer.slice(0, 8192)).includes(0)) {
		return error(422, "That file is not text.");
	}

	return {
		...file,
		contentType: raw.meta.metadata.contentType ?? "text/plain",
		content: new TextDecoder().decode(raw.buffer),
		office: false as const,
	};
};
