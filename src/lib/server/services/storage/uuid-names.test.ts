import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Database } from "#lib/server/db/index.js";
import { files, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

import type { StorageContext } from "./context";
import type { ThumbnailService } from "./thumbnails";
import { matchDiskNames, renameOnDisk } from "./uuid-names";

const A = "810aa574-41f8-43c8-8767-a3f071b34020";
const B = "68f60a88-23e8-418e-a944-6990d7cf8038";
const C = "7220d0c4-8001-41f4-b5fa-01aa425cd802";

let db: Database;
let root: string;
let ctx: StorageContext;
const thumbnails = {
	adopt: () => Promise.resolve(),
	deleteThumbnails: () => Promise.resolve(),
} as unknown as ThumbnailService;

beforeEach(async () => {
	db = migratedSqlite();
	root = await mkdtemp(join(tmpdir(), "penombre-uuid-"));
	await db.insert(user).values({
		id: "u",
		name: "u",
		email: "u@x",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	ctx = {
		user: { id: "u" },
		volumeId: null,
		namedPaths: true,
		storagePath: root,
		db,
	} as unknown as StorageContext;
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

const paths = async () =>
	[
		...(await db.select({ path: folders.path }).from(folders)),
		...(await db.select({ path: files.path }).from(files)),
	]
		.map((row) => row.path)
		.toSorted();

describe("matching disk names to row names", () => {
	test("folders, then files under them, take their display names", async () => {
		await mkdir(join(root, A));
		await writeFile(join(root, A, `${B}.wav`), "take");
		await db
			.insert(folders)
			.values({ id: A, name: "riff kivavit", ownerId: "u", path: A });
		await db.insert(files).values({
			id: B,
			name: "multi 2-Audio.wav",
			ownerId: "u",
			path: `${A}/${B}.wav`,
			folderId: A,
		});

		expect(await matchDiskNames(ctx, thumbnails)).toBe(2);

		expect(await paths()).toEqual([
			"riff kivavit",
			"riff kivavit/multi 2-Audio.wav",
		]);
		expect(await readdir(join(root, "riff kivavit"))).toEqual([
			"multi 2-Audio.wav",
		]);
		expect(existsSync(join(root, A))).toBeFalse();
	});

	test("a file whose bytes are gone keeps its row and leaves no claim", async () => {
		await db
			.insert(files)
			.values({ id: C, name: "lost.wav", ownerId: "u", path: `${C}.wav` });

		expect(await matchDiskNames(ctx, thumbnails)).toBe(0);

		expect(await paths()).toEqual([`${C}.wav`]);
		expect(await readdir(root)).toEqual([]);
	});

	test("a row renamed without its bytes moves them to its name", async () => {
		await writeFile(join(root, "Song-2026-09-20.wav"), "x");
		await db.insert(files).values({
			id: B,
			name: "Song.wav",
			ownerId: "u",
			path: "Song-2026-09-20.wav",
		});

		expect(await matchDiskNames(ctx, thumbnails)).toBe(1);

		expect(await paths()).toEqual(["Song.wav"]);
		expect(await readdir(root)).toEqual(["Song.wav"]);
	});

	test("a name another row holds is left as it is, every pass", async () => {
		await writeFile(join(root, "Song.wav"), "new");
		await writeFile(join(root, "Song-take3.wav"), "old");
		await db.insert(files).values([
			{ id: A, name: "Song.wav", ownerId: "u", path: "Song.wav" },
			{ id: B, name: "Song.wav", ownerId: "u", path: "Song-take3.wav" },
		]);

		expect(await matchDiskNames(ctx, thumbnails)).toBe(0);
		expect(await matchDiskNames(ctx, thumbnails)).toBe(0);

		expect((await readdir(root)).toSorted()).toEqual([
			"Song-take3.wav",
			"Song.wav",
		]);
	});
});

describe("renaming on disk", () => {
	test("a name that is already the disk name moves nothing", async () => {
		await writeFile(join(root, "Song.wav"), "x");
		await db
			.insert(files)
			.values({ id: A, name: "Song.wav", ownerId: "u", path: "Song.wav" });

		expect(
			await renameOnDisk(ctx, thumbnails, {
				path: "Song.wav",
				name: "Song.wav",
				kind: "file",
			}),
		).toBe("Song.wav");

		expect(await readdir(root)).toEqual(["Song.wav"]);
		expect(await paths()).toEqual(["Song.wav"]);
	});

	test("a folder whose directory is gone throws and drops its claim", async () => {
		await db
			.insert(folders)
			.values({ id: A, name: "Old", ownerId: "u", path: "Old" });

		await expect(
			renameOnDisk(ctx, thumbnails, {
				path: "Old",
				name: "New",
				kind: "folder",
			}),
		).rejects.toThrow();

		expect(await readdir(root)).toEqual([]);
		expect(await paths()).toEqual(["Old"]);
	});

	test("a row update that fails puts the bytes back", async () => {
		await writeFile(join(root, "take.wav"), "bytes");
		await db
			.insert(files)
			.values({ id: A, name: "take.wav", ownerId: "u", path: "take.wav" });
		const failing = {
			...ctx,
			db: new Proxy(db, {
				get: (target, property) =>
					property === "update"
						? () => {
								throw new Error("database is locked");
							}
						: Reflect.get(target, property),
			}),
		} as StorageContext;

		await expect(
			renameOnDisk(failing, thumbnails, {
				path: "take.wav",
				name: "Final.wav",
				kind: "file",
			}),
		).rejects.toThrow("database is locked");

		expect(await readdir(root)).toEqual(["take.wav"]);
		expect(await paths()).toEqual(["take.wav"]);
	});

	test("a database it cannot read renames nothing", async () => {
		const broken = {
			...ctx,
			db: {
				select: () => {
					throw new Error("no database");
				},
			},
		} as unknown as StorageContext;

		expect(await matchDiskNames(broken, thumbnails)).toBe(0);
	});
});
