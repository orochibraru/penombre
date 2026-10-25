import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { eq } from "drizzle-orm";

import { sealedSize } from "#lib/server/crypto/envelope.js";
import type { Database } from "#lib/server/db/index.js";
import { files, folders, shares, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as jobs from "#lib/server/services/jobs.js";

import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import {
	ancestorFolders,
	estimateRemaining,
	isScannable,
	listStorageRoot,
	type ScanEntry,
	ScanOperations,
} from "./scan";
import type { ThumbnailService } from "./thumbnails";

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
				// Stamped by an older scan: later than the file, whatever the clock.
				updatedAt: new Date(mtime + 86_400_000),
			} as never,
		]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
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

	test("a same-size rewrite newer than its row is re-read", async () => {
		const mtime = Date.UTC(2026, 8, 24, 20);
		const db = fakeDb([
			{
				id: "f1",
				path: "take.wav",
				size: 10,
				updatedAt: new Date(mtime - 60_000),
			} as never,
		]);
		const deleted: string[] = [];
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
			} as never,
			{
				warm: async () => {},
				deleteThumbnails: async (key: string) => {
					deleted.push(key);
				},
			} as never,
			{ listStorageRoot: async () => [{ key: "take.wav", size: 10, mtime }] },
		);

		expect((await ops.scan()).updatedFiles).toBe(1);
		expect(db.updates[0]?.updatedAt).toEqual(new Date(mtime));
		expect(deleted).toEqual(["take.wav"]);
	});

	test("leaves an unchanged file alone", async () => {
		const db = fakeDb([{ id: "f1", path: "track.mp3", size: 80_000_000 }]);
		const ops = new ScanOperations(
			{
				user: { id: "u1" },
				storagePath: "/tmp/does-not-exist",
				db,
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

describe("listStorageRoot", () => {
	const spies: Array<{ mockRestore: () => void }> = [];

	afterEach(() => {
		for (const spy of spies.splice(0)) {
			spy.mockRestore();
		}
	});

	function job(result: unknown) {
		const enqueue = spyOn(jobs, "enqueueJob").mockResolvedValue("job-1");
		spies.push(
			enqueue,
			spyOn(jobs, "awaitJob").mockResolvedValue(result as never),
		);
		return enqueue;
	}

	test("asks the worker to walk the root and returns what it found", async () => {
		const entries = [{ key: "a.txt", size: 1, mtime: 5, ino: "9" }];
		const enqueue = job({
			status: "succeeded",
			result: JSON.stringify({ entries }),
		});

		expect(await listStorageRoot("/library")).toEqual(entries);
		expect(enqueue).toHaveBeenCalledWith({
			type: "scan-list",
			spec: { root: "/library" },
			priority: "mutation",
		});
	});

	test("a failed walk fails the scan instead of emptying the drive", async () => {
		job({ status: "failed", error: "permission denied" });
		await expect(listStorageRoot("/library")).rejects.toThrow(
			"permission denied",
		);
	});

	test("a walk that never finished fails too", async () => {
		job(undefined);
		await expect(listStorageRoot("/library")).rejects.toThrow("timed out");
	});
});

describe("scanning against the real schema", () => {
	let db: Database;
	let root: string;
	let ctx: StorageContext;
	const warmed: string[] = [];
	const thumbnails = {
		warm: (key: string) => {
			warmed.push(key);
			return Promise.resolve();
		},
		deleteThumbnails: () => Promise.resolve(),
		adopt: () => Promise.resolve(),
	} as unknown as ThumbnailService;

	beforeEach(async () => {
		warmed.length = 0;
		db = migratedSqlite();
		root = await mkdtemp(join(tmpdir(), "penombre-scan-"));
		await db.insert(user).values({
			id: "u",
			name: "u",
			email: "u@x",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		ctx = {
			user: { id: "u" },
			actor: { id: "u" },
			volumeId: null,
			storagePath: root,
			db,
			driver: new LocalStorageDriver(root),
		} as unknown as StorageContext;
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	function scanner(entries: ScanEntry[], context = ctx) {
		return new ScanOperations(context, thumbnails, {
			listStorageRoot: async () => entries,
		});
	}

	test("creates every folder above a file, parents first", async () => {
		const result = await scanner([
			{ key: "Music/Album/one.mp3", size: 3 },
			{ key: "Music/two.mp3", size: 4 },
		]).scan();

		expect(result).toMatchObject({ addedFolders: 2, addedFiles: 2 });
		const byPath = new Map(
			(await db.select().from(folders)).map((row) => [row.path, row]),
		);
		expect(byPath.get("Music")?.parentId).toBeNull();
		expect(byPath.get("Music/Album")?.parentId).toBe(byPath.get("Music")?.id);
		expect(byPath.get("Music/Album")?.name).toBe("Album");
		const [one] = await db
			.select()
			.from(files)
			.where(eq(files.path, "Music/Album/one.mp3"));
		expect(one).toMatchObject({
			name: "one.mp3",
			folderId: byPath.get("Music/Album")?.id,
			category: "MUSIC",
			size: 3,
		});
		expect(warmed.toSorted()).toEqual(["Music/Album/one.mp3", "Music/two.mp3"]);
	});

	test("a folder another pass inserted first becomes the parent", async () => {
		let raced = false;
		const racing = {
			...ctx,
			db: new Proxy(db, {
				get: (target, property) =>
					property === "insert"
						? (table: unknown) => {
								if (table === folders && !raced) {
									raced = true;
									target
										.insert(folders)
										.values({
											id: "theirs",
											name: "a",
											ownerId: "u",
											path: "a",
										})
										.run();
								}
								return target.insert(table as typeof folders);
							}
						: Reflect.get(target, property),
			}),
		} as StorageContext;

		const result = await scanner([{ key: "a/b.txt", size: 1 }], racing).scan();

		expect(result.addedFolders).toBe(0);
		expect(await db.select({ id: folders.id }).from(folders)).toEqual([
			{ id: "theirs" },
		]);
		const [file] = await db.select().from(files);
		expect(file?.folderId).toBe("theirs");
	});

	test("a changed video drops its duration, a changed text file has none", async () => {
		await db.insert(files).values([
			{
				id: "v",
				name: "clip.mp4",
				ownerId: "u",
				path: "clip.mp4",
				size: 1,
				videoDuration: 30,
			},
			{ id: "t", name: "notes.txt", ownerId: "u", path: "notes.txt", size: 1 },
		]);
		await writeFile(join(root, "clip.mp4"), "xx");
		await writeFile(join(root, "notes.txt"), "xx");

		const result = await scanner([
			{ key: "clip.mp4", size: 2 },
			{ key: "notes.txt", size: 2 },
		]).scan();

		expect(result.updatedFiles).toBe(2);
		const rows = new Map(
			(await db.select().from(files)).map((row) => [row.id, row]),
		);
		expect(rows.get("v")).toMatchObject({ size: 2, videoDuration: null });
		expect(rows.get("t")?.size).toBe(2);
	});

	test("rows whose bytes are gone go, with their grants and versions", async () => {
		await mkdir(join(root, "kept"));
		await mkdir(join(root, ".versions", "gone"), { recursive: true });
		await writeFile(join(root, ".versions", "gone", "v1"), "old");
		await db.insert(folders).values([
			{ id: "kept", name: "kept", ownerId: "u", path: "kept" },
			{ id: "lost", name: "lost", ownerId: "u", path: "lost" },
		]);
		await db.insert(files).values([
			{ id: "gone", name: "gone.txt", ownerId: "u", path: "gone.txt" },
			{ id: "here", name: "here.txt", ownerId: "u", path: "here.txt" },
		]);
		await writeFile(join(root, "here.txt"), "");
		await db.insert(shares).values([
			{
				id: "s1",
				token: "t1",
				ownerId: "u",
				resourceType: "file",
				resourceId: "gone",
				resourceName: "gone.txt",
			},
			{
				id: "s2",
				token: "t2",
				ownerId: "u",
				resourceType: "folder",
				resourceId: "lost",
				resourceName: "lost",
			},
		] as never);

		const result = await scanner([{ key: "here.txt", size: 0 }]).scan();

		expect(result).toMatchObject({ removedFiles: 1, removedFolders: 1 });
		expect(
			(await db.select({ id: files.id }).from(files)).map((row) => row.id),
		).toEqual(["here"]);
		expect(
			(await db.select({ id: folders.id }).from(folders)).map((row) => row.id),
		).toEqual(["kept"]);
		expect(await db.select().from(shares)).toEqual([]);
		expect(existsSync(join(root, ".versions", "gone"))).toBe(false);
	});

	test("a row renamed since the listing keeps its row", async () => {
		await db
			.insert(files)
			.values({ id: "moved", name: "new.txt", ownerId: "u", path: "new.txt" });
		await writeFile(join(root, "new.txt"), "x");

		const result = await scanner([]).scan();

		expect(result.removedFiles).toBe(0);
		expect(await db.select({ id: files.id }).from(files)).toEqual([
			{ id: "moved" },
		]);
	});
});
