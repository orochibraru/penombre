import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "#lib/server/db/index.js";
import { filePresence, files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { PRESENCE_TTL_MS, PresenceService } from "./presence";

let db: Database;
let presence: PresenceService;

beforeEach(async () => {
	db = migratedSqlite();
	await db.insert(user).values([
		{ id: "ada", name: "Ada", email: "ada@x.test" },
		{ id: "bob", name: "Bob", email: "bob@x.test" },
		{ id: "cy", name: "Cy", email: "cy@x.test" },
	]);
	await db.insert(files).values([
		{ id: "f1", name: "Plan.docx", ownerId: "ada", path: "f1" },
		{ id: "f2", name: "Other.xlsx", ownerId: "ada", path: "f2" },
	]);
	presence = new PresenceService();
	Object.defineProperty(presence, "db", { value: db, configurable: true });
});

const at = (seconds: number) => new Date(1_800_000_000_000 + seconds * 1000);

describe("presence", () => {
	test("answers everyone else on the same file, never yourself", async () => {
		await presence.beat("f1", "bob", "editing", at(0));
		await presence.beat("f2", "cy", "viewing", at(0));
		expect(await presence.beat("f1", "ada", "viewing", at(1))).toEqual([
			{ userId: "bob", name: "Bob", mode: "editing" },
		]);
	});

	test("a heartbeat updates the one row, mode included", async () => {
		await presence.beat("f1", "bob", "viewing", at(0));
		await presence.beat("f1", "bob", "editing", at(5));
		const others = await presence.beat("f1", "ada", "viewing", at(6));
		expect(others).toEqual([{ userId: "bob", name: "Bob", mode: "editing" }]);
		expect(await db.select().from(filePresence)).toHaveLength(2);
	});

	test("someone silent for 40 seconds is gone, and their row pruned", async () => {
		await presence.beat("f2", "cy", "viewing", at(0));
		await presence.beat("f1", "bob", "editing", at(0));
		const later = at(PRESENCE_TTL_MS / 1000 + 1);
		expect(await presence.beat("f1", "ada", "viewing", later)).toEqual([]);
		// Every stale row, including a file nobody opened again.
		const rows = await db.select().from(filePresence);
		expect(rows.map((row) => row.userId)).toEqual(["ada"]);
	});

	test("leaving removes only your own row", async () => {
		await presence.beat("f1", "bob", "editing", at(0));
		await presence.beat("f1", "ada", "viewing", at(0));
		expect(await presence.leave("f1", "ada")).toBe(true);
		expect(await presence.leave("f1", "ada")).toBe(false);
		const rows = await db.select().from(filePresence);
		expect(rows.map((row) => row.userId)).toEqual(["bob"]);
	});

	test("someone who cannot open the file neither appears nor sees", async () => {
		await presence.beat("f1", "bob", "editing", at(0));
		const outsider = { findFileById: () => Promise.resolve(null) };
		expect(
			await presence.beatIfReachable(outsider, "f1", "cy", "viewing"),
		).toBeNull();
		const rows = await db.select().from(filePresence);
		expect(rows.map((row) => row.userId)).toEqual(["bob"]);
	});
});
