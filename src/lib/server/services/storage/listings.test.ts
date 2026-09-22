import { beforeEach, describe, expect, test } from "bun:test";
import { NullCacheBackend } from "#lib/server/cache/index.js";
import type { Database } from "#lib/server/db/index.js";
import { files, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { decodeCursor, encodeCursor } from "./mappers";

const { ListingOperations } = await import("./listings");

let database: Database;

function ctx(ownerId = "u1", extra: Record<string, unknown> = {}) {
	return {
		db: database,
		user: { id: ownerId },
		volumeId: null,
		cache: new NullCacheBackend(),
		...extra,
	} as never;
}

async function addFolder(
	id: string,
	name: string,
	extra: Partial<typeof folders.$inferInsert> = {},
) {
	await database.insert(folders).values({
		id,
		name,
		path: id,
		ownerId: "u1",
		updatedAt: new Date(),
		...extra,
	});
}

type Ops = InstanceType<typeof ListingOperations>;

/** Every id the listing yields, one `limit`-sized page at a time. */
async function drain(
	fetch: (cursor: string | null) => ReturnType<Ops["listFolderPage"]>,
): Promise<string[][]> {
	const pages: string[][] = [];
	let cursor: string | null = null;
	do {
		const page = await fetch(cursor);
		pages.push(page.list.map((i) => i.metadata.id));
		cursor = page.nextCursor;
	} while (cursor !== null);
	return pages;
}

async function addFile(
	id: string,
	name: string,
	extra: Partial<typeof files.$inferInsert> = {},
) {
	await database.insert(files).values({
		id,
		name,
		path: name,
		category: "MUSIC",
		ownerId: "u1",
		size: 0,
		updatedAt: new Date(),
		...extra,
	});
}

beforeEach(async () => {
	database = migratedSqlite();
	await database.insert(user).values({ id: "u1", name: "u1", email: "u1@x" });
});

describe("cursor round-trip", () => {
	test("decodes exactly what was encoded", () => {
		const cursor = { v: "track.mp3", id: "abc" };
		expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
	});

	test("a garbage cursor decodes to null rather than throwing", () => {
		expect(decodeCursor("not-base64-json")).toBeNull();
		expect(decodeCursor(Buffer.from("[]").toString("base64url"))).toBeNull();
	});
});

describe("listFilesPerCategory", () => {
	test("pages through name order ascending with a stable id tiebreaker", async () => {
		// Two rows share a name on purpose, to prove the id tiebreaker keeps
		// the keyset condition from skipping or repeating a row on a tie.
		await addFile("1", "a.mp3");
		await addFile("2", "b.mp3");
		await addFile("3", "b.mp3");
		await addFile("4", "c.mp3");

		const ops = new ListingOperations(ctx());
		const page1 = await ops.listFilesPerCategory("MUSIC", {
			limit: 2,
			sortColumn: "name",
			sortDirection: "asc",
		});
		expect(page1.list.map((i) => i.metadata.id)).toEqual(["1", "2"]);
		expect(page1.nextCursor).not.toBeNull();
		expect(page1.total).toBe(4);

		const page2 = await ops.listFilesPerCategory("MUSIC", {
			limit: 2,
			sortColumn: "name",
			sortDirection: "asc",
			cursor: page1.nextCursor,
		});
		expect(page2.list.map((i) => i.metadata.id)).toEqual(["3", "4"]);
		expect(page2.nextCursor).toBeNull();
	});

	test("descending order flips the keyset comparison the same way", async () => {
		await addFile("1", "a.mp3", { size: 10 });
		await addFile("2", "b.mp3", { size: 20 });
		await addFile("3", "c.mp3", { size: 30 });

		const ops = new ListingOperations(ctx());
		const page1 = await ops.listFilesPerCategory("MUSIC", {
			limit: 2,
			sortColumn: "size",
			sortDirection: "desc",
		});
		expect(page1.list.map((i) => i.metadata.id)).toEqual(["3", "2"]);

		const page2 = await ops.listFilesPerCategory("MUSIC", {
			limit: 2,
			sortColumn: "size",
			sortDirection: "desc",
			cursor: page1.nextCursor,
		});
		expect(page2.list.map((i) => i.metadata.id)).toEqual(["1"]);
		expect(page2.nextCursor).toBeNull();
	});

	test("nextCursor is null when everything fits in one page", async () => {
		await addFile("1", "a.mp3");
		const ops = new ListingOperations(ctx());
		const page = await ops.listFilesPerCategory("MUSIC", { limit: 50 });
		expect(page.list).toHaveLength(1);
		expect(page.nextCursor).toBeNull();
		expect(page.total).toBe(1);
	});

	test("a trashed file never appears in a page", async () => {
		await addFile("1", "a.mp3", { isTrashed: true });
		await addFile("2", "b.mp3");
		const ops = new ListingOperations(ctx());
		const page = await ops.listFilesPerCategory("MUSIC", { limit: 50 });
		expect(page.list.map((i) => i.metadata.id)).toEqual(["2"]);
		expect(page.total).toBe(1);
	});

	test("an unparsable cursor degrades to the first page instead of throwing", async () => {
		await addFile("1", "a.mp3");
		const ops = new ListingOperations(ctx());
		const page = await ops.listFilesPerCategory("MUSIC", {
			cursor: "garbage",
		});
		expect(page.list.map((i) => i.metadata.id)).toEqual(["1"]);
	});

	test("scopes to the owner, like every other listing", async () => {
		await database.insert(user).values({ id: "u2", name: "u2", email: "u2@x" });
		await addFile("1", "mine.mp3");
		await addFile("2", "theirs.mp3", { id: "2", ownerId: "u2" });
		const page = await new ListingOperations(ctx("u1")).listFilesPerCategory(
			"MUSIC",
		);
		expect(page.list.map((i) => i.metadata.id)).toEqual(["1"]);
	});
});

describe("listFolderPage", () => {
	test("pages folders first, then files, across the boundary", async () => {
		await addFolder("d1", "b");
		await addFolder("d2", "A");
		await addFolder("d3", "c");
		await addFile("f1", "z.mp3");
		await addFile("f2", "Y.mp3");
		await addFile("f3", "x.mp3");

		const ops = new ListingOperations(ctx());
		const pages = await drain((cursor) =>
			ops.listFolderPage(undefined, {
				cursor,
				limit: 2,
				sortColumn: "name",
				sortDirection: "asc",
			}),
		);
		expect(pages).toEqual([
			["d2", "d1"],
			["d3", "f3"],
			["f2", "f1"],
		]);
	});

	test("a page that ends on the last folder resumes on the first file", async () => {
		await addFolder("d1", "a");
		await addFolder("d2", "b");
		await addFile("f1", "c.mp3");

		const ops = new ListingOperations(ctx());
		const options = {
			limit: 2,
			sortColumn: "name",
			sortDirection: "asc",
		} as const;
		const first = await ops.listFolderPage(undefined, options);
		expect(first.list.map((i) => i.metadata.id)).toEqual(["d1", "d2"]);
		expect(first.nextCursor).not.toBeNull();
		expect(first.total).toBe(3);

		const second = await ops.listFolderPage(undefined, {
			...options,
			cursor: first.nextCursor,
		});
		expect(second.list.map((i) => i.metadata.id)).toEqual(["f1"]);
		expect(second.nextCursor).toBeNull();
	});

	test("descending dates with a tie break on id, never skipping a row", async () => {
		const at = new Date("2026-01-01T00:00:00Z");
		await addFolder("d1", "old", { updatedAt: new Date(0) });
		await addFolder("d2", "new", { updatedAt: at });
		await addFile("f1", "a.mp3", { updatedAt: at });
		await addFile("f2", "b.mp3", { updatedAt: at });
		await addFile("f3", "c.mp3", { updatedAt: new Date(0) });

		const ops = new ListingOperations(ctx());
		const pages = await drain((cursor) =>
			ops.listFolderPage(undefined, {
				cursor,
				limit: 1,
				sortColumn: "updatedAt",
				sortDirection: "desc",
			}),
		);
		expect(pages.flat()).toEqual(["d2", "d1", "f2", "f1", "f3"]);
	});

	test("a size sort lists folders by name, files by size", async () => {
		await addFolder("d1", "b");
		await addFolder("d2", "a");
		await addFile("f1", "small.mp3", { size: 1 });
		await addFile("f2", "big.mp3", { size: 9 });

		const page = await new ListingOperations(ctx()).listFolderPage(undefined, {
			sortColumn: "size",
			sortDirection: "desc",
		});
		expect(page.list.map((i) => i.metadata.id)).toEqual([
			"d2",
			"d1",
			"f2",
			"f1",
		]);
	});

	test("lists one folder's children, never trashed ones", async () => {
		await addFolder("d1", "parent");
		await addFolder("d2", "child", { path: "d1/d2", parentId: "d1" });
		await addFolder("d3", "gone", {
			path: "d1/d3",
			parentId: "d1",
			isTrashed: true,
		});
		await addFile("f1", "in.mp3", { path: "d1/in.mp3", folderId: "d1" });
		await addFile("f2", "trashed.mp3", {
			path: "d1/trashed.mp3",
			folderId: "d1",
			isTrashed: true,
		});
		await addFile("f3", "root.mp3");

		const page = await new ListingOperations(ctx()).listFolderPage("d1");
		expect(page.list.map((i) => i.metadata.id)).toEqual(["d2", "f1"]);
		expect(page.total).toBe(2);
	});

	test("an unknown folder is an empty page", async () => {
		const page = await new ListingOperations(ctx()).listFolderPage("nope");
		expect(page).toEqual({ list: [], count: 0, total: 0, nextCursor: null });
	});

	test("stays on its volume", async () => {
		await addFile("f1", "main.mp3");
		await addFile("f2", "mounted.mp3", { volumeId: "media" });
		const main = await new ListingOperations(ctx()).listFolderPage(undefined);
		const mounted = await new ListingOperations(
			ctx("u1", { volumeId: "media" }),
		).listFolderPage(undefined);
		expect(main.list.map((i) => i.metadata.id)).toEqual(["f1"]);
		expect(mounted.list.map((i) => i.metadata.id)).toEqual(["f2"]);
	});

	test("a share scope narrows every page and the total", async () => {
		await addFolder("d1", "shared");
		await addFolder("d2", "inside", { path: "d1/d2", parentId: "d1" });
		await addFile("f1", "in.mp3", { path: "d1/in.mp3", folderId: "d1" });
		await addFile("f2", "other.mp3", { path: "d1/other.mp3", folderId: "d1" });

		const fileScope = ctx("u1", {
			scope: { kind: "file", fileId: "f1", folderId: "d1" },
		});
		const page = await new ListingOperations(fileScope).listFolderPage("d1");
		expect(page.list.map((i) => i.metadata.id)).toEqual(["f1"]);
		expect(page.total).toBe(1);
	});
});

describe("listStarredFiles", () => {
	test("pages starred folders then starred files, skipping trashed ones", async () => {
		await addFolder("d1", "fav", { isStarred: true });
		await addFolder("d2", "plain");
		await addFolder("d3", "binned", { isStarred: true, isTrashed: true });
		await addFile("f1", "a.mp3", { isStarred: true });
		await addFile("f2", "b.mp3");
		await addFile("f3", "c.mp3", { isStarred: true, isTrashed: true });
		await addFile("f4", "d.mp3", {
			path: "d2/d.mp3",
			folderId: "d2",
			isStarred: true,
		});

		const ops = new ListingOperations(ctx());
		const pages = await drain((cursor) =>
			ops.listStarredFiles({
				cursor,
				limit: 2,
				sortColumn: "name",
				sortDirection: "asc",
			}),
		);
		expect(pages).toEqual([["d1", "f1"], ["f4"]]);
		expect((await ops.listStarredFiles()).total).toBe(3);
	});
});

describe("listTrashFiles", () => {
	const byName = { sortColumn: "name", sortDirection: "asc" } as const;

	test("a trashed subtree lists only its top folder, keyed by full path", async () => {
		await addFolder("A", "top", { isTrashed: true });
		await addFolder("B", "mid", {
			path: "A/B",
			parentId: "A",
			isTrashed: true,
		});
		await addFile("f1", "deep.mp3", {
			path: "A/B/deep.mp3",
			folderId: "B",
			isTrashed: true,
		});

		const page = await new ListingOperations(ctx()).listTrashFiles(byName);
		expect(page.list.map((i) => [i.metadata.id, i.key])).toEqual([["A", "A/"]]);
		expect(page.total).toBe(1);
	});

	test("a trashed file inside a live folder is listed, a sibling prefix is not an ancestor", async () => {
		await addFolder("ab", "ab", { isTrashed: true });
		await addFolder("abc", "abc");
		await addFile("f1", "x.mp3", {
			path: "abc/x.mp3",
			folderId: "abc",
			isTrashed: true,
		});

		const page = await new ListingOperations(ctx()).listTrashFiles(byName);
		expect(page.list.map((i) => [i.metadata.id, i.key])).toEqual([
			["ab", "ab/"],
			["f1", "abc/x.mp3"],
		]);
	});

	test("a folder is priced by its trashed descendants only", async () => {
		await addFolder("A", "top", { isTrashed: true });
		await addFolder("B", "mid", {
			path: "A/B",
			parentId: "A",
			isTrashed: true,
		});
		await addFile("f1", "a.mp3", {
			path: "A/a.mp3",
			size: 10,
			isTrashed: true,
		});
		await addFile("f2", "b.mp3", {
			path: "A/B/b.mp3",
			size: 5,
			isTrashed: true,
		});
		await addFile("f3", "live.mp3", { path: "A/live.mp3", size: 1000 });
		await addFolder("A2", "sibling", { isTrashed: true });
		await addFile("f4", "s.mp3", {
			path: "A2/s.mp3",
			size: 7,
			isTrashed: true,
		});

		const page = await new ListingOperations(ctx()).listTrashFiles(byName);
		expect(page.list.map((i) => [i.metadata.id, i.size])).toEqual([
			["A2", 7],
			["A", 15],
		]);
		expect(page.totalSize).toBe(22);
	});

	test("pages folders then files across the boundary", async () => {
		await addFolder("d1", "b", { isTrashed: true });
		await addFolder("d2", "a", { isTrashed: true });
		await addFolder("d3", "c", { isTrashed: true });
		await addFile("f1", "z.mp3", { isTrashed: true });
		await addFile("f2", "y.mp3", { isTrashed: true });
		await addFile("f3", "nested.mp3", {
			path: "d1/nested.mp3",
			isTrashed: true,
		});

		const ops = new ListingOperations(ctx());
		const pages = await drain((cursor) =>
			ops.listTrashFiles({ ...byName, cursor, limit: 2 }),
		);
		expect(pages).toEqual([["d2", "d1"], ["d3", "f2"], ["f1"]]);
	});

	test("stays on its volume", async () => {
		await addFolder("A", "main", { isTrashed: true });
		await addFile("f1", "m.mp3", { path: "A/m.mp3", size: 3, isTrashed: true });
		await addFile("f2", "v.mp3", {
			path: "A/v.mp3",
			size: 4,
			isTrashed: true,
			volumeId: "drive:1",
		});

		const main = await new ListingOperations(ctx()).listTrashFiles(byName);
		const drive = await new ListingOperations(
			ctx("u1", { volumeId: "drive:1" }),
		).listTrashFiles(byName);
		expect(main.list.map((i) => [i.metadata.id, i.size])).toEqual([["A", 3]]);
		expect(main.totalSize).toBe(3);
		expect(drive.list.map((i) => i.metadata.id)).toEqual(["f2"]);
		expect(drive.totalSize).toBe(4);
	});

	test("the badge and the empty-trash totals cover every page", async () => {
		await addFolder("A", "top", { isTrashed: true });
		await addFile("f1", "in.mp3", {
			path: "A/in.mp3",
			size: 100,
			isTrashed: true,
		});
		for (const n of [1, 2, 3]) {
			await addFile(`r${n}`, `${n}.mp3`, { size: n, isTrashed: true });
		}
		await addFile("live", "live.mp3", { size: 5000 });

		const ops = new ListingOperations(ctx());
		const page = await ops.listTrashFiles({ ...byName, limit: 1 });
		expect(page.list).toHaveLength(1);
		expect(page.total).toBe(4);
		expect(page.totalSize).toBe(106);
		expect(await ops.countTrashedItems()).toBe(4);
	});
});
