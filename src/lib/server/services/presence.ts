/**
 * Who has a file open.
 *
 * A row per person and file, refreshed by a heartbeat and forgotten 40
 * seconds after the last one. A table and not the in-memory cache: with
 * several app processes, two people on the same document are usually served
 * by different ones, and each process would only see its own visitors.
 */

import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import { getDb } from "#lib/server/db/index.js";
import { filePresence, user } from "#lib/server/db/schema.js";

/** Two missed heartbeats, plus some slack for a slow request. */
export const PRESENCE_TTL_MS = 40_000;

export type PresenceMode = "viewing" | "editing";

export interface Present {
	userId: string;
	name: string;
	mode: PresenceMode;
}

export class PresenceService {
	private get db() {
		return getDb();
	}

	/** Marks `userId` on `fileId` and answers everyone else seen there. */
	async beat(
		fileId: string,
		userId: string,
		mode: PresenceMode,
		now = new Date(),
	): Promise<Present[]> {
		const cutoff = new Date(now.getTime() - PRESENCE_TTL_MS);
		// Everyone's stale rows, not just this file's: a file nobody opens
		// again would otherwise keep its last visitors forever.
		await this.db.delete(filePresence).where(lt(filePresence.seenAt, cutoff));
		await this.db
			.insert(filePresence)
			.values({ id: `${fileId}:${userId}`, fileId, userId, mode, seenAt: now })
			.onConflictDoUpdate({
				target: filePresence.id,
				set: { mode, seenAt: now },
			});
		return this.db
			.select({
				userId: filePresence.userId,
				name: user.name,
				mode: filePresence.mode,
			})
			.from(filePresence)
			.innerJoin(user, eq(user.id, filePresence.userId))
			.where(
				and(
					eq(filePresence.fileId, fileId),
					ne(filePresence.userId, userId),
					gte(filePresence.seenAt, cutoff),
				),
			)
			.orderBy(asc(user.name));
	}

	/**
	 * The heartbeat of someone who has to prove they can open the file
	 * first; null when they cannot, and then they neither appear nor see.
	 */
	async beatIfReachable(
		service: { findFileById(id: string): Promise<string | null> },
		fileId: string,
		userId: string,
		mode: PresenceMode,
	): Promise<Present[] | null> {
		if (!(await service.findFileById(fileId))) {
			return null;
		}
		return this.beat(fileId, userId, mode);
	}

	async leave(fileId: string, userId: string): Promise<boolean> {
		const gone = await this.db
			.delete(filePresence)
			.where(eq(filePresence.id, `${fileId}:${userId}`))
			.returning({ id: filePresence.id });
		return gone.length > 0;
	}
}
