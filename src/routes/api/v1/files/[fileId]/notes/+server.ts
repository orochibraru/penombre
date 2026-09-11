import { Http } from "$lib/server/http";
import { createNote, listNotes } from "$lib/server/openapi/v1/notes";
import { NoteService } from "$lib/server/services/notes";

const notes = new NoteService();

/**
 * Notes hang off a file id that arrives in the URL, so every handler proves
 * the caller can actually reach that file first. `findFileById` is scoped to
 * the requesting user's own volume, which is what stops a guessed id from
 * exposing somebody else's conversation.
 */
async function canReach(locals: App.Locals, fileId: string): Promise<boolean> {
	return !!(await locals.storageService.findFileById(fileId));
}

export const GET = listNotes.handler(async ({ params, event }) => {
	try {
		if (!(await canReach(event.locals, params.fileId))) {
			return Http.NotFound("File not found");
		}
		return Http.Ok(await notes.list(params.fileId));
	} catch (error) {
		return Http.ServerError("Failed to list notes", error);
	}
});

export const POST = createNote.handler(
	async ({ params, body, user, event }) => {
		try {
			if (!(await canReach(event.locals, params.fileId))) {
				return Http.NotFound("File not found");
			}
			const note = await notes.create({
				fileId: params.fileId,
				userId: user.id,
				body: body.body,
				timestampSeconds: body.timestampSeconds ?? null,
			});
			if (!note) {
				return Http.BadRequest("A note needs some text.");
			}
			return Http.Ok(note);
		} catch (error) {
			return Http.ServerError("Failed to create note", error);
		}
	},
);
