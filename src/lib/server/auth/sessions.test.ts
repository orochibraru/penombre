import { describe, expect, test } from "bun:test";
import { session, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { activeSessions } from "./sessions";

const DAY = 24 * 60 * 60 * 1000;

async function seeded() {
	const database = migratedSqlite();
	const now = Date.now();
	await database.insert(user).values([
		{ id: "u1", name: "A", email: "a@x.test", emailVerified: true },
		{ id: "u2", name: "B", email: "b@x.test", emailVerified: true },
	]);
	const row = (
		id: string,
		userId: string,
		createdAt: number,
		expiresAt: number,
	) => ({
		id,
		token: `tok-${id}`,
		userId,
		createdAt: new Date(createdAt),
		updatedAt: new Date(createdAt),
		expiresAt: new Date(expiresAt),
	});
	await database.insert(session).values([
		// Five days old: better-auth's own listing refuses to answer from it.
		row("old", "u1", now - 5 * DAY, now + 2 * DAY),
		row("new", "u1", now - 1000, now + 7 * DAY),
		row("expired", "u1", now - 9 * DAY, now - DAY),
		row("other", "u2", now - 1000, now + 7 * DAY),
	]);
	return database;
}

describe("activeSessions", () => {
	test("lists the account's live sessions, newest first, whatever their age", async () => {
		const sessions = await activeSessions("u1", await seeded());
		expect(sessions.map((s) => s.id)).toEqual(["new", "old"]);
	});

	test("never another account's", async () => {
		const sessions = await activeSessions("u2", await seeded());
		expect(sessions.map((s) => s.id)).toEqual(["other"]);
	});
});
