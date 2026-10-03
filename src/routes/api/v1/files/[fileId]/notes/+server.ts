import { getConfig } from "#lib/server/config.js";
import { Http } from "#lib/server/http.js";
import { createNote, listNotes } from "#lib/server/openapi/v1/notes.js";
import { NotesApi } from "#lib/server/services/notes-api.js";

const notes = new NotesApi();

export const GET = listNotes.handler(async ({ params, user, service }) => {
	try {
		return await notes.list({
			fileId: params.fileId,
			user,
			reach: () => Promise.resolve(service),
		});
	} catch (error) {
		return Http.ServerError("Failed to list notes", error);
	}
});

export const POST = createNote.handler(
	async ({ params, body, user, service }) => {
		try {
			return await notes.create(
				{
					fileId: params.fileId,
					user,
					reach: () => Promise.resolve(service),
					origin: getConfig().origin,
				},
				body,
			);
		} catch (error) {
			return Http.ServerError("Failed to create note", error);
		}
	},
);
