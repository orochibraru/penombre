import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Database } from "#lib/server/db/index.js";
import { files, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import { FileOperations } from "./files";
import { FolderOperations } from "./folders";
import type { ThumbnailService } from "./thumbnails";

let db: Database;
let root: string;

const thumbnails = {
	adopt: () => Promise.resolve(),
	deleteThumbnails: () => Promise.resolve(),
} as unknown as ThumbnailService;

function context(namedPaths: boolean) {
	return {
		user: { id: "u" },
		actor: { id: "u" },
		volumeId: null,
		namedPaths,
		storagePath: root,
		db,
		driver: new LocalStorageDriver(root),
		activityService: { register: () => Promise.resolve() },
		invalidateListingCaches: () => Promise.resolve(),
	} as unknown as StorageContext;
}

beforeEach(async () => {
	db = migratedSqlite();
	root = await mkdtemp(join(tmpdir(), "penombre-rename-"));
	await db.insert(user).values({
		id: "u",
		name: "u",
		email: "u@x",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

async function addFile(path: string, folderId: string | null = null) {
	await writeFile(join(root, path), "bytes");
	await db.insert(files).values({
		id: path,
		name: path.split("/").pop() ?? path,
		ownerId: "u",
		path,
		folderId,
	});
}

const paths = async () =>
	(await db.select({ path: files.path }).from(files)).map((r) => r.path);

describe("renaming where the disk is the name", () => {
	test("a file is renamed on disk too", async () => {
		await addFile("take.wav");

		await new FileOperations(context(true), thumbnails).updateFile("take.wav", {
			key: "Final mix.wav",
		});

		expect(await readdir(root)).toEqual(["Final mix.wav"]);
		expect(await paths()).toEqual(["Final mix.wav"]);
	});

	test("a case-only rename keeps the name asked for", async () => {
		await addFile("take.wav");

		await new FileOperations(context(true), thumbnails).updateFile("take.wav", {
			key: "Take.wav",
		});

		expect(await paths()).toEqual(["Take.wav"]);
		expect(await readdir(root)).toEqual(["Take.wav"]);
	});

	test("a folder is renamed on disk with everything under it", async () => {
		await mkdir(join(root, "Song"));
		await db
			.insert(folders)
			.values({ id: "d", name: "Song", ownerId: "u", path: "Song" });
		await addFile("Song/take.wav", "d");

		await new FolderOperations(context(true), thumbnails).updateFolderMeta(
			"Song",
			{ name: "Track" },
		);

		expect(existsSync(join(root, "Track", "take.wav"))).toBeTrue();
		expect(existsSync(join(root, "Song"))).toBeFalse();
		expect(await paths()).toEqual(["Track/take.wav"]);
		const [folder] = await db.select().from(folders);
		expect([folder?.path, folder?.name]).toEqual(["Track", "Track"]);
	});

	test("a personal drive only renames the row", async () => {
		await addFile("take.wav");

		await new FileOperations(context(false), thumbnails).updateFile(
			"take.wav",
			{ key: "Final mix.wav" },
		);

		expect(await readdir(root)).toEqual(["take.wav"]);
		const [row] = await db.select().from(files);
		expect([row?.path, row?.name]).toEqual(["take.wav", "Final mix.wav"]);
	});
});
