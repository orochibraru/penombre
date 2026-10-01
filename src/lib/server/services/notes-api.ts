/**
 * The notes routes' logic, apart from the routes so it can be tested with a
 * stand-in storage service.
 *
 * Every read and every new note proves the caller can reach the file first:
 * notes hang off an id that arrives in the URL. Anyone who can open a file
 * may comment on it, a read-only share included; being able to write is
 * about the file's bytes, and a "view only" share is usually sent to be
 * reviewed.
 */

import type { CommentAnchor } from "#lib/editor/comments.js";
import { Logger } from "#lib/logger.js";
import { Http } from "#lib/server/http.js";
import { drivesService } from "./drives";
import { NoteService } from "./notes";
import { NotificationService } from "./notifications";
import { SharingService } from "./sharings";

const logger = new Logger("Notes API");

/** What the notes routes need of a storage service. */
export interface NoteReach {
	findFileById(id: string): Promise<string | null>;
	findFileOwner(id: string): Promise<{
		ownerId: string;
		name: string;
		volumeId: string | null;
	} | null>;
}

export interface NoteRequest {
	fileId: string;
	user: { id: string; name: string };
	/** Built on demand: editing your own note never needed the file. */
	reach: () => Promise<NoteReach>;
	origin?: string;
}

export interface NewNote {
	body: string;
	timestampSeconds?: number | null;
	anchor?: CommentAnchor | null;
	parentId?: string | null;
}

export interface NotePatch {
	body?: string;
	resolved?: boolean;
}

export type Announce = (
	request: NoteRequest,
	service: NoteReach,
) => Promise<void>;

const notifications = new NotificationService();
const sharings = new SharingService();

/**
 * Of `userIds`, who can still reach this file: a member of the drive it
 * lives on, or (a personal-drive file) someone it is still shared with.
 *
 * A note thread outlives the access that started it; a revoked sharee, or
 * someone removed from the drive, must stop hearing about it even though
 * `noteParticipants` still lists them.
 */
async function reachable(
	file: { ownerId: string; volumeId: string | null },
	fileId: string,
	userIds: string[],
): Promise<string[]> {
	if (userIds.length === 0) {
		return [];
	}
	const driveId = file.volumeId?.startsWith("drive:")
		? file.volumeId.slice(6)
		: null;
	if (driveId) {
		const members = await Promise.all(
			userIds.map(async (id) =>
				(await drivesService.access(driveId, id)) ? id : null,
			),
		);
		return members.filter((id): id is string => id !== null);
	}
	return sharings.canReachFile(file.ownerId, fileId, userIds);
}

/**
 * Tell the people who care that a note landed: the file's owner, and anyone
 * else already in the thread who can still reach it. The author is never
 * told about their own note; `notifyMany` dedupes.
 *
 * Never fails the note it reports on: `notify` swallows its own failures.
 */
export async function announceNote(
	request: NoteRequest,
	service: NoteReach,
): Promise<void> {
	try {
		const file = await service.findFileOwner(request.fileId);
		if (!file) {
			return;
		}
		const participants = await notifications.noteParticipants(
			request.fileId,
			request.user.id,
		);
		const stillReachable = await reachable(file, request.fileId, participants);
		const recipients = [file.ownerId, ...stillReachable].filter(
			(id) => id !== request.user.id,
		);
		await notifications.notifyMany(
			recipients,
			{
				type: "note",
				actorName: request.user.name,
				resourceName: file.name,
				// Resolved per recipient: a sharee opens it through their grant.
				link: `/go/file/${request.fileId}`,
			},
			request.origin,
		);
	} catch (error) {
		logger.warn("Could not announce a new note", error);
	}
}

export class NotesApi {
	constructor(
		private readonly notes = new NoteService(),
		private readonly announce: Announce = announceNote,
	) {}

	/** The service, when the caller can reach the file. */
	private async reached(request: NoteRequest): Promise<NoteReach | null> {
		const service = await request.reach();
		return (await service.findFileById(request.fileId)) ? service : null;
	}

	async list(request: NoteRequest): Promise<Response> {
		if (!(await this.reached(request))) {
			return Http.NotFound("File not found");
		}
		return Http.Ok(await this.notes.list(request.fileId));
	}

	async create(request: NoteRequest, input: NewNote): Promise<Response> {
		const service = await this.reached(request);
		if (!service) {
			return Http.NotFound("File not found");
		}
		if (
			input.parentId &&
			!(await this.notes.threadRoot(input.parentId, request.fileId))
		) {
			return Http.BadRequest("That thread does not exist.");
		}
		const note = await this.notes.create({
			fileId: request.fileId,
			userId: request.user.id,
			body: input.body,
			timestampSeconds: input.timestampSeconds ?? null,
			anchor: input.anchor ?? null,
			parentId: input.parentId ?? null,
		});
		if (!note) {
			return Http.BadRequest("A note needs some text.");
		}
		await this.announce(request, service);
		return Http.Ok(note);
	}

	/**
	 * Resolving is open to anyone who can reach the file; the text stays
	 * its author's. Somebody else's note reads as missing rather than
	 * forbidden, so this cannot be used to probe for note ids.
	 */
	async update(
		request: NoteRequest,
		noteId: string,
		patch: NotePatch,
	): Promise<Response> {
		let note = null;
		if (patch.resolved !== undefined) {
			if (!(await this.reached(request))) {
				return Http.NotFound("File not found");
			}
			note = await this.notes.resolve(
				noteId,
				request.fileId,
				request.user.id,
				patch.resolved,
			);
			if (!note) {
				return Http.NotFound("Note not found");
			}
		}
		if (patch.body !== undefined) {
			note = await this.notes.update(
				noteId,
				request.user.id,
				patch.body,
				request.fileId,
			);
			if (!note) {
				return Http.NotFound("Note not found");
			}
		}
		return note ? Http.Ok(note) : Http.BadRequest("Nothing to change.");
	}

	async remove(
		request: Pick<NoteRequest, "fileId" | "user">,
		noteId: string,
	): Promise<Response> {
		const deleted = await this.notes.remove(
			noteId,
			request.user.id,
			request.fileId,
		);
		return deleted ? Http.Ok({ deleted }) : Http.NotFound("Note not found");
	}
}
