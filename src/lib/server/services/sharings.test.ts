import { describe, expect, test } from "bun:test";

const { SharingService } = await import("./sharings");

/**
 * The db is stubbed per-call rather than by mocking `$lib/server/db` — a
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
	return Object.assign(promise, { returning: () => Promise.resolve(rows) });
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
				where: () => Promise.resolve(queue.shift() ?? []),
				innerJoin: () => ({
					innerJoin: () => ({
						where: () => Promise.resolve(queue.shift() ?? []),
					}),
					where: () => Promise.resolve(queue.shift() ?? []),
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
