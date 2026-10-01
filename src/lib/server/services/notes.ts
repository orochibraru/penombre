/**
 * Notes attached to files, and the comments of office files, which are notes
 * with an anchor.
 *
 * A note belongs to the person who wrote it and hangs off a file id. Ownership
 * of the *file* is checked by the caller (the route has the storage service);
 * this module only enforces that you may not edit or delete somebody else's
 * note. Resolving is not authorship: anyone who can open the file may close
 * or reopen a thread.
 */

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { CommentAnchor } from "#lib/editor/comments.js";
import { getDb } from "#lib/server/db/index.js";
import { fileNotes, user } from "#lib/server/db/schema.js";

export interface NoteInput {
	fileId: string;
	userId: string;
	body: string;
	/** Seconds into the track, for a note about a moment. */
	timestampSeconds?: number | null;
	/** Where in an office file a comment points. */
	anchor?: CommentAnchor | null;
	/** The thread it answers; checked by `threadRoot` first. */
	parentId?: string | null;
}

export interface NoteRow {
	id: string;
	fileId: string;
	userId: string;
	authorName: string | null;
	body: string;
	timestampSeconds: number | null;
	anchor: CommentAnchor | null;
	parentId: string | null;
	resolvedAt: string | null;
	resolvedByName: string | null;
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

/** A stored anchor that no longer parses reads as none, not as an error. */
function parseAnchor(raw: string | null): CommentAnchor | null {
	if (!raw) {
		return null;
	}
	try {
		return JSON.parse(raw) as CommentAnchor;
	} catch {
		return null;
	}
}

function toRow(row: {
	id: string;
	fileId: string;
	userId: string;
	authorName: string | null;
	body: string;
	timestampSeconds: number | null;
	anchor: string | null;
	parentId: string | null;
	resolvedAt: Date | null;
	resolvedByName: string | null;
	createdAt: Date;
	updatedAt: Date;
}): NoteRow {
	return {
		...row,
		anchor: parseAnchor(row.anchor),
		resolvedAt: row.resolvedAt?.toISOString() ?? null,
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
	anchor: fileNotes.anchor,
	parentId: fileNotes.parentId,
	resolvedAt: fileNotes.resolvedAt,
	resolvedByName: sql<
		string | null
	>`(select "name" from "user" where "id" = ${fileNotes.resolvedBy})`,
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

	private async read(id: string): Promise<NoteRow | null> {
		const [row] = await this.db
			.select(selection)
			.from(fileNotes)
			.leftJoin(user, eq(fileNotes.userId, user.id))
			.where(eq(fileNotes.id, id))
			.limit(1);
		return row ? toRow(row) : null;
	}

	/** Whether `id` starts a thread on this file. Threads are one level deep. */
	async threadRoot(id: string, fileId: string): Promise<boolean> {
		const [row] = await this.db
			.select({ id: fileNotes.id })
			.from(fileNotes)
			.where(
				and(
					eq(fileNotes.id, id),
					eq(fileNotes.fileId, fileId),
					isNull(fileNotes.parentId),
				),
			)
			.limit(1);
		return !!row;
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
				// A reply belongs to its thread's anchor, not one of its own.
				anchor:
					input.anchor && !input.parentId ? JSON.stringify(input.anchor) : null,
				parentId: input.parentId ?? null,
			})
			.returning({ id: fileNotes.id });

		return inserted ? this.read(inserted.id) : null;
	}

	/**
	 * Edit your own note on `fileId`. Returns null when it is not yours or
	 * not there.
	 */
	async update(
		id: string,
		userId: string,
		body: string,
		fileId?: string,
	): Promise<NoteRow | null> {
		const clean = cleanBody(body);
		if (!clean) {
			return null;
		}
		const updated = await this.db
			.update(fileNotes)
			.set({ body: clean, updatedAt: new Date() })
			.where(
				and(
					eq(fileNotes.id, id),
					eq(fileNotes.userId, userId),
					...(fileId ? [eq(fileNotes.fileId, fileId)] : []),
				),
			)
			.returning({ id: fileNotes.id });

		return updated.length > 0 ? this.read(id) : null;
	}

	/** Close or reopen a thread. Null when `id` is not a thread on `fileId`. */
	async resolve(
		id: string,
		fileId: string,
		userId: string,
		resolved: boolean,
	): Promise<NoteRow | null> {
		const updated = await this.db
			.update(fileNotes)
			.set({
				resolvedAt: resolved ? new Date() : null,
				resolvedBy: resolved ? userId : null,
			})
			.where(
				and(
					eq(fileNotes.id, id),
					eq(fileNotes.fileId, fileId),
					isNull(fileNotes.parentId),
				),
			)
			.returning({ id: fileNotes.id });
		return updated.length > 0 ? this.read(id) : null;
	}

	/**
	 * Delete your own note, and its replies with it: a thread without its
	 * first comment has nothing left to answer. Returns whether anything
	 * was removed.
	 */
	async remove(id: string, userId: string, fileId?: string): Promise<boolean> {
		const deleted = await this.db
			.delete(fileNotes)
			.where(
				and(
					eq(fileNotes.id, id),
					eq(fileNotes.userId, userId),
					...(fileId ? [eq(fileNotes.fileId, fileId)] : []),
				),
			)
			.returning({ id: fileNotes.id });
		if (deleted.length === 0) {
			return false;
		}
		await this.db.delete(fileNotes).where(eq(fileNotes.parentId, id));
		return true;
	}
}
