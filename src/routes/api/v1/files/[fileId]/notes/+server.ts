import type { RequestEvent } from "@sveltejs/kit";
import { Logger } from "#lib/logger.js";
import { Http } from "#lib/server/http.js";
import { createNote, listNotes } from "#lib/server/openapi/v1/notes.js";
import { drivesService } from "#lib/server/services/drives.js";
import { NoteService } from "#lib/server/services/notes.js";
import { NotificationService } from "#lib/server/services/notifications.js";
import { SharingService } from "#lib/server/services/sharings.js";
import type { StorageService } from "#lib/server/services/storage/index.js";

const notes = new NoteService();
const notifications = new NotificationService();
const sharings = new SharingService();
const logger = new Logger("Notes API");

/**
 * Notes hang off a file id that arrives in the URL, so every handler proves
 * the caller can actually reach that file first. The service is scoped to the
 * drive the request names — the caller's own by default — which is what stops
 * a guessed id from exposing somebody else's conversation.
 */
async function canReach(
	service: StorageService,
	fileId: string,
): Promise<boolean> {
	return !!(await service.findFileById(fileId));
}

/**
 * Of `userIds`, who can still reach this file: a member of the drive it
 * lives on, or (a personal-drive file) someone it is still shared with.
 *
 * A note thread outlives the access that started it; a revoked sharee, or
 * someone removed from the drive, must stop hearing about it even though
 * `noteParticipants` still lists them.
 */
async function reachable(
	ownerId: string,
	fileId: string,
	volumeId: string | null,
	userIds: string[],
): Promise<string[]> {
	if (userIds.length === 0) {
		return [];
	}
	const driveId = volumeId?.startsWith("drive:") ? volumeId.slice(6) : null;
	if (driveId) {
		const members = await Promise.all(
			userIds.map(async (id) =>
				(await drivesService.access(driveId, id)) ? id : null,
			),
		);
		return members.filter((id): id is string => id !== null);
	}
	return sharings.canReachFile(ownerId, fileId, userIds);
}

/**
 * Tell the people who care that a note landed: the file's owner, and anyone
 * else already in the thread who can still reach it. The author is never
 * told about their own note; `notifyMany` dedupes, so an owner who is also
 * a participant hears once.
 *
 * Deliberately after the note is saved and never awaited into the response's
 * success: `notify` swallows its own failures, so a broken mail server cannot
 * turn a saved note into a 500.
 */
async function announce(
	event: RequestEvent,
	service: StorageService,
	fileId: string,
	author: { id: string; name: string },
): Promise<void> {
	try {
		const file = await service.findFileOwner(fileId);
		if (!file) {
			return;
		}
		const participants = await notifications.noteParticipants(
			fileId,
			author.id,
		);
		const stillReachable = await reachable(
			file.ownerId,
			fileId,
			file.volumeId,
			participants,
		);
		const recipients = [file.ownerId, ...stillReachable].filter(
			(id) => id !== author.id,
		);
		await notifications.notifyMany(
			recipients,
			{
				type: "note",
				actorName: author.name,
				resourceName: file.name,
				link: `/view/${fileId}`,
			},
			event.url.origin,
		);
	} catch (error) {
		logger.warn("Could not announce a new note", error);
	}
}

export const GET = listNotes.handler(async ({ params, service }) => {
	try {
		if (!(await canReach(service, params.fileId))) {
			return Http.NotFound("File not found");
		}
		return Http.Ok(await notes.list(params.fileId));
	} catch (error) {
		return Http.ServerError("Failed to list notes", error);
	}
});

export const POST = createNote.handler(
	async ({ params, body, user, event, service }) => {
		try {
			if (!(await canReach(service, params.fileId))) {
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

			await announce(event, service, params.fileId, user);
			return Http.Ok(note);
		} catch (error) {
			return Http.ServerError("Failed to create note", error);
		}
	},
);
