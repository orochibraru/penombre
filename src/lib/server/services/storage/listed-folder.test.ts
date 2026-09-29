import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "#lib/server/db/index.js";
import { folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import type { StorageContext } from "./context";
import { FolderOperations } from "./folders";
import type { ThumbnailService } from "./thumbnails";

let db: Database;
let ops: FolderOperations;

async function folder(id: string, path: string, parentId: string | null) {
	await db.insert(folders).values({
		id,
		name: path.split("/").pop() ?? path,
		ownerId: "u",
		path,
		parentId,
	});
}

beforeEach(async () => {
	db = migratedSqlite();
	await db.insert(user).values({
		id: "u",
		name: "u",
		email: "u@x",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	const ctx = {
		user: { id: "u" },
		actor: { id: "u" },
		volumeId: null,
		db,
	} as unknown as StorageContext;
	ops = new FolderOperations(ctx, {} as ThumbnailService);
	await folder("docs", "Docs", null);
	await folder("plans", "Docs/Plans", "docs");
	// A transfer before 1.8.59 parented rows under a path that is no folder:
	// listed at the root, addressed by nothing.
	await folder("banque", "0b7c/Banque", null);
});

describe("resolveListedFolder", () => {
	test("finds a folder where the listing showed it", async () => {
		expect(await ops.resolveListedFolder("Docs")).toBe("Docs/");
		expect(await ops.resolveListedFolder("Plans/", "Docs")).toBe("Docs/Plans/");
	});

	test("finds a row whose path does not match its place", async () => {
		expect(await ops.resolveListedFolder("Banque/")).toBe("0b7c/Banque/");
	});

	test("never guesses between two rows or outside the parent", async () => {
		expect(await ops.resolveListedFolder("Nope")).toBeNull();
		expect(await ops.resolveListedFolder("Plans")).toBeNull();
		await folder("banque2", "9e1f/Banque", null);
		expect(await ops.resolveListedFolder("Banque")).toBeNull();
	});
});
