import { beforeEach, describe, expect, test } from "bun:test";

import type { Database } from "#lib/server/db/index.js";
import { folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import type { ObjectItem } from "#lib/server/schema.js";

import type { StorageContext } from "./context";
import { folderNames, nameParents, withParentKey } from "./parents";

let db: Database;

function context(volumeId: string | null = null) {
	return { db, user: { id: "u" }, volumeId } as unknown as StorageContext;
}

const item = () => ({ key: "take.wav" }) as ObjectItem;

beforeEach(async () => {
	db = migratedSqlite();
	await db.insert(user).values({ id: "u", name: "u", email: "u@x" });
	await db.insert(folders).values([
		{ id: "1", name: "Band", ownerId: "u", path: "band" },
		{ id: "2", name: "Demos", ownerId: "u", path: "band/demos", parentId: "1" },
		{ id: "3", name: "Mounted", ownerId: "u", path: "band", volumeId: "media" },
	]);
});

describe("withParentKey", () => {
	test("a nested hit opens by its folder's path", () => {
		expect(withParentKey(item(), "band/demos/take.wav").parentKey).toBe(
			"band/demos",
		);
	});

	test("a hit at the root has no folder", () => {
		expect(withParentKey(item(), "take.wav").parentKey).toBeUndefined();
	});
});

describe("nameParents", () => {
	test("names each item's folder on this volume only", async () => {
		const nested = withParentKey(item(), "band/demos/take.wav");
		const top = withParentKey(item(), "band/take.wav");
		const unknown = withParentKey(item(), "ghost/take.wav");
		const atRoot = withParentKey(item(), "take.wav");

		await nameParents(context(), [nested, top, unknown, atRoot]);

		expect(nested.parent).toBe("Demos");
		expect(top.parent).toBe("Band");
		expect(unknown.parent).toBeUndefined();
		expect(atRoot.parent).toBeUndefined();
	});

	test("a volume reads its own folder names", async () => {
		const top = withParentKey(item(), "band/take.wav");

		await nameParents(context("media"), [top]);

		expect(top.parent).toBe("Mounted");
	});

	test("items with no folder never query", async () => {
		const failing = {
			db: {
				select: () => {
					throw new Error("queried");
				},
			},
		} as unknown as StorageContext;
		const atRoot = withParentKey(item(), "take.wav");

		await nameParents(failing, [atRoot]);

		expect(atRoot.parent).toBeUndefined();
	});
});

describe("folderNames", () => {
	test("names a path and every ancestor of it", async () => {
		const names = await folderNames(context(), ["band/demos"]);

		expect(names).toEqual(
			new Map([
				["band", "Band"],
				["band/demos", "Demos"],
			]),
		);
	});

	test("no paths is an empty map", async () => {
		expect(await folderNames(context(), [])).toEqual(new Map());
	});
});
