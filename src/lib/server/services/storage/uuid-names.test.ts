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
import { nameUuidPaths } from "./uuid-names";

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
		invalidateListingCaches: () => Promise.resolve(),
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

describe("renaming UUID-named paths", () => {
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

		expect(await nameUuidPaths(ctx, thumbnails)).toBe(2);

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

		expect(await nameUuidPaths(ctx, thumbnails)).toBe(0);

		expect(await paths()).toEqual([`${C}.wav`]);
		expect(await readdir(root)).toEqual([]);
	});

	test("a scanned name that merely contains a UUID is left alone", async () => {
		await writeFile(join(root, `mix-${B}.wav`), "x");
		await db.insert(files).values({
			id: B,
			name: "mix.wav",
			ownerId: "u",
			path: `mix-${B}.wav`,
		});

		expect(await nameUuidPaths(ctx, thumbnails)).toBe(0);
	});
});
