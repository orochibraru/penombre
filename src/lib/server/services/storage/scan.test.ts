import { describe, expect, test } from "bun:test";
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
		return {
			updates,
			select: (cols: Record<string, unknown>) => ({
				from: () => ({
					where: async () => ("size" in cols ? rows : []),
				}),
			}),
			insert: () => ({ values: async () => {} }),
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

	test("rewrites the row when the bytes on disk grew", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 7_000_000 }]);
		const deleted: string[] = [];
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				driver: {
					listObjectKeys: async () => ["track.mp3"],
					getObjectSize: async () => 80_000_000,
				},
				invalidateListingCaches: async () => {},
			} as never,
			{
				warm: async () => {},
				deleteThumbnails: async (key: string) => {
					deleted.push(key);
				},
				// Forces readMediaDuration down its failure path: no real file here.
				getLocalOrTempPath: async () => {
					throw new Error("no local copy");
				},
			} as never,
		);

		const result = await ops.scan();

		expect(result.updatedFiles).toBe(1);
		expect(db.updates[0]?.size).toBe(80_000_000);
		expect(deleted).toEqual(["track.mp3"]);
	});

	test("leaves an unchanged file alone", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 80_000_000 }]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				driver: {
					listObjectKeys: async () => ["track.mp3"],
					getObjectSize: async () => 80_000_000,
				},
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
		);

		expect((await ops.scan()).updatedFiles).toBe(0);
		expect(db.updates).toEqual([]);
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
				driver: {
					listObjectKeys: async () => ["track.mp3"],
					getObjectSize: async () => 80_000_000,
				},
				invalidateListingCaches: async () => {},
			} as never,
			{
				warm: async () => {},
				deleteThumbnails: async (key: string) => {
					deleted.push(key);
				},
				getLocalOrTempPath: async () => {
					throw new Error("no local copy");
				},
			} as never,
		);

		const result = await ops.scan(undefined, { full: true });

		expect(result.updatedFiles).toBe(1);
		expect(db.updates[0]?.category).toBe("MUSIC");
		expect(deleted).toEqual(["track.mp3"]);
	});

	test("reports each phase and counts every file on disk", async () => {
		const db = fakeDb([{ id: "f1", path: "a.mp3", size: 1 }]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
				driver: {
					listObjectKeys: async () => ["a.mp3", "b.mp3"],
					getObjectSize: async () => 1,
				},
				invalidateListingCaches: async () => {},
			} as never,
			{ deleteThumbnails: async () => {}, warm: async () => {} } as never,
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
