/**
 * Notes attached to files.
 *
 * A note belongs to the person who wrote it and hangs off a file id. Ownership
 * of the *file* is checked by the caller (the route has the storage service);
 * this module only enforces that you may not edit or delete somebody else's
 * note.
 */

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { fileNotes, user } from "$lib/server/db/schema";

export interface NoteInput {
	fileId: string;
	userId: string;
	body: string;
	/** Seconds into the track, for a note about a moment. */
	timestampSeconds?: number | null;
}

export interface NoteRow {
	id: string;
	fileId: string;
	userId: string;
	authorName: string | null;
	body: string;
	timestampSeconds: number | null;
	createdAt: string;
	updatedAt: string;
}

const MAX_BODY = 4000;

/** Trimmed and bounded, or null when there is nothing worth storing. */
function cleanBody(body: string): string | null {
	const trimmed = body.trim();
	if (!trimmed) {
		return null;
	}
	return trimmed.slice(0, MAX_BODY);
}

/**
 * A timestamp is only meaningful as a non-negative finite number of seconds.
 * Anything else is stored as "about the file as a whole" rather than rejected,
 * so a client that cannot read a duration still gets its note saved.
 */
function cleanTimestamp(value: number | null | undefined): number | null {
	if (value === null || value === undefined) {
		return null;
	}
	if (!Number.isFinite(value) || value < 0) {
		return null;
	}
	return value;
}

function toRow(row: {
	id: string;
	fileId: string;
	userId: string;
	authorName: string | null;
	body: string;
	timestampSeconds: number | null;
	createdAt: Date;
	updatedAt: Date;
}): NoteRow {
	return {
		...row,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

const selection = {
	id: fileNotes.id,
	fileId: fileNotes.fileId,
	userId: fileNotes.userId,
	authorName: user.name,
	body: fileNotes.body,
	timestampSeconds: fileNotes.timestampSeconds,
	createdAt: fileNotes.createdAt,
	updatedAt: fileNotes.updatedAt,
};

export class NoteService {
	private get db() {
		return getDb();
	}

	/**
	 * Every note on a file, oldest first.
	 *
	 * Ordered by timestamp then creation so a media file reads as a timeline
	 * and a document reads as a conversation.
	 */
	async list(fileId: string): Promise<NoteRow[]> {
		const rows = await this.db
			.select(selection)
			.from(fileNotes)
			.leftJoin(user, eq(fileNotes.userId, user.id))
			.where(eq(fileNotes.fileId, fileId))
			.orderBy(asc(fileNotes.timestampSeconds), asc(fileNotes.createdAt));
		return rows.map(toRow);
	}

	async create(input: NoteInput): Promise<NoteRow | null> {
		const body = cleanBody(input.body);
		if (!body) {
			return null;
		}

		const [inserted] = await this.db
			.insert(fileNotes)
			.values({
				id: crypto.randomUUID(),
				fileId: input.fileId,
				userId: input.userId,
				body,
				timestampSeconds: cleanTimestamp(input.timestampSeconds),
			})
			.returning({ id: fileNotes.id });

		if (!inserted) {
			return null;
		}
		const [row] = await this.db
			.select(selection)
			.from(fileNotes)
			.leftJoin(user, eq(fileNotes.userId, user.id))
			.where(eq(fileNotes.id, inserted.id))
			.limit(1);
		return row ? toRow(row) : null;
	}

	/** Edit your own note. Returns null when it is not yours or not there. */
	async update(
		id: string,
		userId: string,
		body: string,
	): Promise<NoteRow | null> {
		const clean = cleanBody(body);
		if (!clean) {
			return null;
		}
		const updated = await this.db
			.update(fileNotes)
			.set({ body: clean, updatedAt: new Date() })
			.where(and(eq(fileNotes.id, id), eq(fileNotes.userId, userId)))
			.returning({ id: fileNotes.id });

		if (updated.length === 0) {
			return null;
		}
		const [row] = await this.db
			.select(selection)
			.from(fileNotes)
			.leftJoin(user, eq(fileNotes.userId, user.id))
			.where(eq(fileNotes.id, id))
			.limit(1);
		return row ? toRow(row) : null;
	}

	/** Delete your own note. Returns whether anything was removed. */
	async remove(id: string, userId: string): Promise<boolean> {
		const deleted = await this.db
			.delete(fileNotes)
			.where(and(eq(fileNotes.id, id), eq(fileNotes.userId, userId)))
			.returning({ id: fileNotes.id });
		return deleted.length > 0;
	}
}
