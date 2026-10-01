import { Http } from "#lib/server/http.js";
import { deleteNote, updateNote } from "#lib/server/openapi/v1/notes.js";
import { rethrowRefusal } from "#lib/server/services/drives.js";
import { NotesApi } from "#lib/server/services/notes-api.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

const notes = new NotesApi();

export const PATCH = updateNote.handler(
	async ({ params, body, user, event }) => {
		try {
			return await notes.update(
				{
					fileId: params.fileId,
					user,
					// Only resolving needs the file: editing your own note never did.
					reach: () =>
						storageServiceFor(event.locals.storageOwner ?? user, event),
				},
				params.noteId,
				body,
			);
		} catch (error) {
			rethrowRefusal(error);
			return Http.ServerError("Failed to update note", error);
		}
	},
);

export const DELETE = deleteNote.handler(async ({ params, user }) => {
	try {
		return await notes.remove({ fileId: params.fileId, user }, params.noteId);
	} catch (error) {
		return Http.ServerError("Failed to delete note", error);
	}
});
