import { and, desc, eq, gt } from "drizzle-orm";
import { type Database, db } from "#lib/server/db/index.js";
import { session } from "#lib/server/db/schema.js";

/**
 * An account's live sessions. Not `auth.api.listSessions`: better-auth only
 * answers that to a session under a day old, and people stay signed in for
 * weeks.
 */
export function activeSessions(userId: string, database: Database = db) {
	return database
		.select()
		.from(session)
		.where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
		.orderBy(desc(session.updatedAt));
}
