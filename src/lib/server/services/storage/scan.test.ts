import { describe, expect, test } from "bun:test";
import { sealedSize } from "#lib/server/crypto/envelope.js";
import {
	ancestorFolders,
	estimateRemaining,
	isScannable,
	ScanOperations,
} from "./scan";

describe("isScannable", () => {
	test("accepts ordinary files at any depth", () => {
		expect(isScannable("notes.md")).toBe(true);
		expect(isScannable("Music/Album/track1.mp3")).toBe(true);
	});

	test("skips hidden entries at any depth", () => {
		expect(isScannable(".DS_Store")).toBe(false);
		expect(isScannable(".thumbnails/abc.webp")).toBe(false);
		expect(isScannable("Music/.hidden/track.mp3")).toBe(false);
	});

	test("skips legacy metadata sidecars", () => {
		expect(isScannable("file.txt.meta.json")).toBe(false);
	});
});

describe("ancestorFolders", () => {
	test("returns every parent, shallowest first", () => {
		expect(ancestorFolders("a/b/c.mp3")).toEqual(["a", "a/b"]);
	});

	test("returns nothing for a root-level file", () => {
		expect(ancestorFolders("notes.md")).toEqual([]);
	});
});

describe("refreshChangedFiles", () => {
	/** Chainable stub: select/update read like drizzle, records what was set. */
	function fakeDb(rows: Array<{ id: string; path: string; size: number }>) {
		const updates: Array<Record<string, unknown>> = [];
		const inserts: Array<Record<string, unknown>> = [];
		return {
			updates,
			inserts,
			select: (cols: Record<string, unknown>) => ({
				from: () => ({
					where: async () => ("size" in cols ? rows : []),
				}),
			}),
			insert: () => ({
				values: (row: Record<string, unknown>) => ({
					onConflictDoNothing: () => ({
						returning: async () => {
							inserts.push(row);
							return [{ id: row.id }];
						},
					}),
				}),
			}),
			delete: () => ({ where: async () => {} }),
			update: () => ({
				set: (values: Record<string, unknown>) => ({
					where: async () => {
						updates.push(values);
					},
				}),
			}),
		};
	}

	function fakeDeps(entries: Array<{ key: string; size: number }>) {
		return { listStorageRoot: async () => entries };
	}

	test("rewrites the row when the bytes on disk grew", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 7_000_000 }]);
		const deleted: string[] = [];
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{
				warm: async () => {},
				deleteThumbnails: async (key: string) => {
					deleted.push(key);
				},
			} as never,
			fakeDeps([{ key: "track.mp3", size: 80_000_000 }]),
		);

		const result = await ops.scan();

		expect(result.updatedFiles).toBe(1);
		expect(db.updates[0]?.size).toBe(80_000_000);
		expect(deleted).toEqual(["track.mp3"]);
	});

	test("dates rows by the file's own mtime, not the scan's", async () => {
		const mtime = Date.UTC(2026, 1, 24, 19, 35);
		const db = fakeDb([
			{
				id: "f1",
				path: "old.mp3",
				size: 10,
				updatedAt: new Date(),
			} as never,
		]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
			{
				listStorageRoot: async () => [
					{ key: "old.mp3", size: 10, mtime },
					{ key: "new.mp3", size: 10, mtime },
				],
			},
		);

		await ops.scan();

		expect(db.updates).toEqual([{ updatedAt: new Date(mtime) }]);
		expect(db.inserts[0]?.updatedAt).toEqual(new Date(mtime));
	});

	test("leaves an unchanged file alone", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 80_000_000 }]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
			fakeDeps([{ key: "track.mp3", size: 80_000_000 }]),
		);

		expect((await ops.scan()).updatedFiles).toBe(0);
		expect(db.updates).toEqual([]);
	});

	// A sealed file is the plaintext size plus header and tags: without the
	// tolerance every sealed file looked changed on every pass.
	test("a sealed file of the recorded size is unchanged", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 80_000_000 }]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
			fakeDeps([{ key: "track.mp3", size: sealedSize(80_000_000) }]),
		);

		expect((await ops.scan()).updatedFiles).toBe(0);
	});

	test("an encrypted root records the plaintext size of a new file", async () => {
		const db = fakeDb([]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				encrypted: true,
				driver: { getObjectSize: async () => 5 },
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
			fakeDeps([{ key: "new.txt", size: sealedSize(5) }]),
		);

		expect((await ops.scan()).addedFiles).toBe(1);
		expect(db.inserts.at(-1)).toMatchObject({ size: 5 });
	});

	// A full rescan exists to rebuild what a quick one trusts, so an
	// unchanged size must not let a file skip it.
	test("a full rescan re-reads a file whose size did not change", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 80_000_000 }]);
		const deleted: string[] = [];
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{
				warm: async () => {},
				deleteThumbnails: async (key: string) => {
					deleted.push(key);
				},
			} as never,
			fakeDeps([{ key: "track.mp3", size: 80_000_000 }]),
		);

		const result = await ops.scan(undefined, { full: true });

		expect(result.updatedFiles).toBe(1);
		expect(db.updates[0]?.category).toBe("MUSIC");
		expect(deleted).toEqual(["track.mp3"]);
	});

	test("a changed media file drops its stale duration", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 1 }]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/library",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
			fakeDeps([{ key: "track.mp3", size: 2 }]),
		);

		await ops.scan();

		expect(db.updates[0]).toHaveProperty("musicDuration", null);
	});

	test("reports each phase and counts every file on disk", async () => {
		const db = fakeDb([{ id: "f1", path: "a.mp3", size: 1 }]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
			fakeDeps([
				{ key: "a.mp3", size: 1 },
				{ key: "b.mp3", size: 1 },
			]),
		);

		const steps: Array<{ phase: string; done: number; total: number }> = [];
		await ops.scan((step) => steps.push(step));

		expect([...new Set(steps.map((s) => s.phase))]).toEqual([
			"listing",
			"folders",
			"files",
			"cleanup",
		]);
		expect(steps.at(-1)).toMatchObject({ done: 2, total: 2 });
	});

	test("filters non-scannable entries out of the listing", async () => {
		const db = fakeDb([]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
			fakeDeps([
				{ key: "kept.txt", size: 1 },
				{ key: ".DS_Store", size: 1 },
				{ key: "kept.txt.meta.json", size: 1 },
			]),
		);

		const steps: Array<{ phase: string; done: number; total: number }> = [];
		await ops.scan((step) => steps.push(step));

		expect(steps.at(-1)).toMatchObject({ done: 1, total: 1 });
	});
});

describe("estimateRemaining", () => {
	test("projects the average rate over what is left", () => {
		// 10 files in 5s → 0.5s each → 90 left is 45s.
		expect(estimateRemaining(10, 100, 5000)).toBe(45);
	});

	// The first file of a pass is often a slow thumbnail; guessing from it
	// alone would show hours for a library that takes a minute.
	test("says nothing until there is some history", () => {
		expect(estimateRemaining(2, 100, 5000)).toBeUndefined();
		expect(estimateRemaining(10, 100, 500)).toBeUndefined();
	});

	test("says nothing once every file is done", () => {
		expect(estimateRemaining(100, 100, 5000)).toBeUndefined();
	});
});
