import { Http } from "$lib/server/http";
import { deleteNote, updateNote } from "$lib/server/openapi/v1/notes";
import { NoteService } from "$lib/server/services/notes";

const notes = new NoteService();

export const PATCH = updateNote.handler(async ({ params, body, user }) => {
	try {
		// Scoped to the author: somebody else's note reads as missing rather
		// than forbidden, so this cannot be used to probe for note ids.
		const note = await notes.update(params.noteId, user.id, body.body);
		if (!note) {
			return Http.NotFound("Note not found");
		}
		return Http.Ok(note);
	} catch (error) {
		return Http.ServerError("Failed to update note", error);
	}
});

export const DELETE = deleteNote.handler(async ({ params, user }) => {
	try {
		const deleted = await notes.remove(params.noteId, user.id);
		if (!deleted) {
			return Http.NotFound("Note not found");
		}
		return Http.Ok({ deleted });
	} catch (error) {
		return Http.ServerError("Failed to delete note", error);
	}
});
