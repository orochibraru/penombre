import { beforeEach, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import {
	addShortcut,
	listShortcuts,
	removeShortcut,
	reorderShortcuts,
} from "./shortcuts";

let database: Database;

beforeEach(async () => {
	database = migratedSqlite();
	database.run(sql`PRAGMA foreign_keys = ON`);
	await database.insert(user).values([
		{ id: "owner", name: "Owner", email: "owner@x.test" },
		{ id: "other", name: "Other", email: "other@x.test" },
	]);
	await database.insert(folders).values([
		{ id: "a", name: "Mastering", ownerId: "owner", path: "Mastering" },
		{ id: "b", name: "Stems & mixes", ownerId: "owner", path: "Stems & mixes" },
		{ id: "c", name: "Theirs", ownerId: "other", path: "Theirs" },
	]);
});

const names = async (viewer = "owner") =>
	(await listShortcuts("owner", viewer, database)).map((s) => s.name);

describe("sidebar shortcuts", () => {
	test("pinned in order, linked into the owner's drive", async () => {
		expect(await addShortcut("owner", "owner", "b", database)).toBeTrue();
		expect(await addShortcut("owner", "owner", "a", database)).toBeTrue();
		const [first] = await listShortcuts("owner", "owner", database);
		expect(first?.href).toBe("/browse/Stems%20%26%20mixes");
		expect(await names()).toEqual(["Stems & mixes", "Mastering"]);
	});

	test("pinning twice keeps one", async () => {
		await addShortcut("owner", "owner", "a", database);
		await addShortcut("owner", "owner", "a", database);
		expect(await names()).toEqual(["Mastering"]);
	});

	test("a folder the caller cannot reach is refused", async () => {
		expect(await addShortcut("owner", "owner", "c", database)).toBeFalse();
		expect(await addShortcut("owner", "owner", "nope", database)).toBeFalse();
		expect(await names()).toEqual([]);
	});

	test("reorders and unpins", async () => {
		await addShortcut("owner", "owner", "a", database);
		await addShortcut("owner", "owner", "b", database);
		await reorderShortcuts("owner", ["b", "a"], database);
		expect(await names()).toEqual(["Stems & mixes", "Mastering"]);
		await removeShortcut("owner", "b", database);
		expect(await names()).toEqual(["Mastering"]);
	});

	test("a trashed folder drops out, a deleted one takes its row", async () => {
		await addShortcut("owner", "owner", "a", database);
		await addShortcut("owner", "owner", "b", database);
		await database
			.update(folders)
			.set({ isTrashed: true })
			.where(eq(folders.id, "a"));
		await database.delete(folders).where(eq(folders.id, "b"));
		expect(await names()).toEqual([]);
	});
});
