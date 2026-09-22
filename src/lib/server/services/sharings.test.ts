import { describe, expect, test } from "bun:test";
import {
	files,
	folders,
	sharedWith,
	sharings,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

const { SharingService } = await import("./sharings");

/**
 * The db is stubbed per-call rather than by mocking `#lib/server/db/index.js` — a
 * module mock would leak into every suite that runs after this one. Each
 * entry in `answers` satisfies one query, in order.
 */
/**
 * Drizzle's insert/delete builders are awaitable *and* expose `.returning()`.
 * A real promise with the method hung off it gives both without hand-rolling
 * a `then`.
 */
function awaitable(rows: unknown[]) {
	const promise = Promise.resolve(rows);
	return Object.assign(promise, {
		returning: () => Promise.resolve(rows),
		limit: () => awaitable(rows),
	});
}

function serviceWith(answers: unknown[][]) {
	const queue = [...answers];
	const inserted: unknown[] = [];
	const deleted: unknown[] = [];
	const svc = new SharingService();
	// Reaching past `private db` is the point of the stub.
	(svc as any).db = {
		select: () => ({
			from: () => ({
				where: () => awaitable(queue.shift() ?? []),
				innerJoin: () => ({
					innerJoin: () => ({
						where: () => awaitable(queue.shift() ?? []),
					}),
					where: () => awaitable(queue.shift() ?? []),
				}),
			}),
		}),
		insert: () => ({
			values: (v: unknown) => {
				inserted.push(v);
				return awaitable([{ id: "new-sharing" }]);
			},
		}),
		delete: () => ({
			where: (w: unknown) => {
				deleted.push(w);
				return awaitable([]);
			},
		}),
	};
	return { svc, inserted, deleted };
}

describe("share", () => {
	test("does nothing when no recipients are given", async () => {
		const { svc, inserted } = serviceWith([]);
		expect(
			await svc.share({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f1",
				userIds: [],
				permission: "read",
			}),
		).toBe(true);
		expect(inserted).toHaveLength(0);
	});

	test("refuses a resource the caller does not own", async () => {
		// first query = ownedName lookup, empty means not theirs
		const { svc, inserted } = serviceWith([[]]);
		expect(
			await svc.share({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f1",
				userIds: ["u2"],
				permission: "read",
			}),
		).toBe(false);
		expect(inserted).toHaveLength(0);
	});

	test("refuses when none of the ids resolve to a real other user", async () => {
		const { svc, inserted } = serviceWith([
			[{ name: "notes.txt" }], // owns it
			[], // no matching recipients (self-share, or unknown id)
		]);
		expect(
			await svc.share({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f1",
				userIds: ["owner"],
				permission: "read",
			}),
		).toBe(false);
		expect(inserted).toHaveLength(0);
	});

	test("adds a recipient to a brand new sharing", async () => {
		const { svc, inserted } = serviceWith([
			[{ name: "notes.txt" }], // owns it
			[{ id: "u2" }], // valid recipient
			[], // no existing sharing row for this permission
			[], // nobody on it yet
			[], // no sibling sharings to clean up
		]);
		expect(
			await svc.share({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f1",
				userIds: ["u2"],
				permission: "read",
			}),
		).toBe(true);
		// the sharing row carrying the permission, then the recipient on it
		expect(inserted).toEqual([
			{
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f1",
				permission: "read",
			},
			[{ sharingId: "new-sharing", userId: "u2" }],
		]);
	});

	test("does not add someone who is already on the sharing", async () => {
		const { svc, inserted } = serviceWith([
			[{ name: "notes.txt" }],
			[{ id: "u2" }],
			[{ id: "existing-sharing" }], // reuses the sharing row
			[{ userId: "u2" }], // already present
			[],
		]);
		expect(
			await svc.share({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f1",
				userIds: ["u2"],
				permission: "read",
			}),
		).toBe(true);
		expect(inserted).toHaveLength(0);
	});

	test("clears the same user off other permissions of the same resource", async () => {
		const { svc, deleted } = serviceWith([
			[{ name: "notes.txt" }],
			[{ id: "u2" }],
			[{ id: "write-sharing" }],
			[],
			[{ id: "read-sharing" }], // a sibling grant to strip
		]);
		await svc.share({
			ownerId: "owner",
			resourceType: "file",
			resourceId: "f1",
			userIds: ["u2"],
			permission: "write",
		});
		// one delete against the sibling sharing
		expect(deleted).toHaveLength(1);
	});
});

describe("revoke", () => {
	test("refuses a sharedWith row that is not the caller's", async () => {
		const { svc, deleted } = serviceWith([[]]);
		expect(await svc.revoke("owner", "sw1")).toBe(false);
		expect(deleted).toHaveLength(0);
	});

	test("removes the person and drops a sharing left with nobody on it", async () => {
		const { svc, deleted } = serviceWith([
			[{ sharingId: "s1" }], // the row is theirs
			[], // nobody left after the delete
		]);
		expect(await svc.revoke("owner", "sw1")).toBe(true);
		// one delete for the person, one for the now-empty sharing
		expect(deleted).toHaveLength(2);
	});

	test("keeps the sharing when other people remain on it", async () => {
		const { svc, deleted } = serviceWith([
			[{ sharingId: "s1" }],
			[{ id: "sw2" }], // someone else still has access
		]);
		expect(await svc.revoke("owner", "sw1")).toBe(true);
		expect(deleted).toHaveLength(1);
	});
});

describe("canReachFile", () => {
	test("empty candidate list needs no query", async () => {
		const { svc } = serviceWith([]);
		expect(await svc.canReachFile("owner", "f1", [])).toEqual([]);
	});

	test("the file not being the owner's own resolves to nobody reachable", async () => {
		const { svc } = serviceWith([[]]);
		expect(await svc.canReachFile("owner", "f1", ["u2"])).toEqual([]);
	});

	test("a direct file share is reachable", async () => {
		const { svc } = serviceWith([
			[{ path: "a/b.txt" }],
			[{ userId: "u2", resourceType: "file", resourceId: "f1" }],
		]);
		expect(await svc.canReachFile("owner", "f1", ["u2"])).toEqual(["u2"]);
	});

	test("a share on an ancestor folder is reachable", async () => {
		// A folder's path is its own id, so the ancestor id the query filters
		// on is "docs" here, the same value the join row's resourceId carries.
		const { svc } = serviceWith([[{ path: "docs/b.txt" }], [{ userId: "u2" }]]);
		expect(await svc.canReachFile("owner", "f1", ["u2"])).toEqual(["u2"]);
	});

	test("a share on an unrelated folder is not reachable", async () => {
		// The SQL filter itself excludes it now; an empty join result is what
		// the real query returns when nothing matches the resource ids.
		const { svc } = serviceWith([[{ path: "other/b.txt" }], []]);
		expect(await svc.canReachFile("owner", "f1", ["u2"])).toEqual([]);
	});

	test("no remaining sharedWith row means revoked", async () => {
		const { svc } = serviceWith([[{ path: "a/b.txt" }], []]);
		expect(await svc.canReachFile("owner", "f1", ["u2"])).toEqual([]);
	});

	// Real SQLite, real migrations: a decoy grant on an unrelated file, from
	// the same owner to the same recipient, must not affect the answer for a
	// different file, the case the JS-side filtering used to load in full.
	test("a grant on an unrelated resource is filtered in SQL, not just ignored", async () => {
		const database = migratedSqlite();
		await database.insert(user).values([
			{ id: "owner", name: "Owner", email: "owner@x.test" },
			{ id: "u2", name: "Recipient", email: "u2@x.test" },
		]);
		await database.insert(folders).values({
			id: "folder1",
			name: "Docs",
			ownerId: "owner",
			path: "folder1",
		});
		await database.insert(files).values([
			{ id: "f1", name: "a.txt", ownerId: "owner", path: "folder1/f1" },
			{ id: "f2", name: "b.txt", ownerId: "owner", path: "f2" },
		]);
		const [folderSharing] = await database
			.insert(sharings)
			.values({
				ownerId: "owner",
				resourceType: "folder",
				resourceId: "folder1",
				permission: "read",
			})
			.returning();
		const [decoySharing] = await database
			.insert(sharings)
			.values({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f2",
				permission: "read",
			})
			.returning();
		await database.insert(sharedWith).values([
			{ sharingId: folderSharing?.id ?? "", userId: "u2" },
			{ sharingId: decoySharing?.id ?? "", userId: "u2" },
		]);

		const svc = new SharingService();
		(svc as any).db = database;

		expect(await svc.canReachFile("owner", "f1", ["u2"])).toEqual(["u2"]);
	});
});

describe("searchUsers", () => {
	test("refuses a query under 3 characters without touching the db", async () => {
		const { svc } = serviceWith([]);
		expect(await svc.searchUsers("ab", "me")).toEqual([]);
	});

	test("a long enough query runs", async () => {
		const { svc } = serviceWith([[{ id: "u2", name: "Bob", email: "bob@x" }]]);
		expect(await svc.searchUsers("bob", "me")).toEqual([
			{ id: "u2", name: "Bob", email: "bob@x" },
		]);
	});
});
