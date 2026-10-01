import {
	FileOrFolderNotFoundError,
	ReadOnlyVolumeError,
} from "#lib/server/errors.js";
import { Http } from "#lib/server/http.js";
import { blankFile } from "#lib/server/office/blank.js";
import { createDocumentFile } from "#lib/server/openapi/v1/documents.js";
import { rethrowRefusal } from "#lib/server/services/drives.js";

const DEFAULT_NAMES = {
	document: "Untitled document",
	sheet: "Untitled spreadsheet",
} as const;

const EXTENSIONS = { document: "docx", sheet: "xlsx" } as const;

/** Built here, so a new file's bytes never make the round trip through a browser. */
export const POST = createDocumentFile.handler(
	async ({ query, body, service }) => {
		const bytes = blankFile(body.kind);
		const name = `${body.name ?? DEFAULT_NAMES[body.kind]}.${EXTENSIONS[body.kind]}`;
		try {
			const created = await service.createFile(
				{ name, size: bytes.byteLength },
				query.folder,
			);
			await service.uploadFileBody(created.id ?? "", bytes, {
				snapshot: false,
			});
			return Http.Ok(created);
		} catch (error) {
			if (error instanceof FileOrFolderNotFoundError) {
				return Http.BadRequest("Destination folder not found");
			}
			if (error instanceof ReadOnlyVolumeError) {
				throw error;
			}
			rethrowRefusal(error);
			return Http.ServerError("Failed to create the document", error);
		}
	},
);
