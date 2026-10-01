import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "#lib/server/db/index.js";
import {
	files,
	folders,
	sharedWith,
	sharings,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { fileHref } from "./file-href";

let db: Database;
let grant = "";

const doc = {
	id: "f1",
	name: "Plan.docx",
	ownerId: "owner",
	volumeId: null,
	path: "folder1/f1",
};

beforeEach(async () => {
	db = migratedSqlite();
	await db.insert(user).values([
		{ id: "owner", name: "Owner", email: "owner@x.test" },
		{ id: "reader", name: "Reader", email: "reader@x.test" },
		{ id: "stranger", name: "Stranger", email: "stranger@x.test" },
	]);
	await db
		.insert(folders)
		.values({ id: "folder1", name: "Docs", ownerId: "owner", path: "folder1" });
	await db.insert(files).values(doc);
	const [sharing] = await db
		.insert(sharings)
		.values({
			ownerId: "owner",
			resourceType: "folder",
			resourceId: "folder1",
			permission: "read",
		})
		.returning();
	const [row] = await db
		.insert(sharedWith)
		.values({ sharingId: sharing?.id ?? "", userId: "reader" })
		.returning();
	grant = row?.id ?? "";
});

describe("fileHref", () => {
	test("the owner opens an office file in its editor", async () => {
		expect(await fileHref(doc, "owner", "owner", db)).toBe("/edit/f1");
	});

	test("anything else opens in the viewer", async () => {
		const track = { ...doc, name: "take.wav" };
		expect(await fileHref(track, "owner", "owner", db)).toBe("/view/f1");
	});

	test("a sharee opens it through the grant on a folder above it", async () => {
		expect(await fileHref(doc, "reader", "reader", db)).toBe(
			`/edit/f1?share=${grant}`,
		);
	});

	test("someone it was never shared with has no way in", async () => {
		expect(await fileHref(doc, "stranger", "stranger", db)).toBeNull();
	});
});
