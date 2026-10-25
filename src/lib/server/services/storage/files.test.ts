import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { eq } from "drizzle-orm";

import type { Database } from "#lib/server/db/index.js";
import { files, fileVersions, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { FileOrFolderNotFoundError } from "#lib/server/errors.js";
import * as appSettings from "#lib/server/services/app-settings.js";

import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import { FileOperations } from "./files";
import type { ThumbnailService } from "./thumbnails";

let db: Database;
let root: string;
let dropped: string[];
let activity: { userId: string; message: string; level: string }[];

const thumbnails = {
	adopt: () => Promise.resolve(),
	deleteThumbnails: (key: string) => {
		dropped.push(key);
		return Promise.resolve();
	},
	warm: () => Promise.resolve(),
} as unknown as ThumbnailService;

function context(extra: Partial<StorageContext> = {}): StorageContext {
	return {
		user: { id: "u" },
		actor: { id: "member" },
		volumeId: null,
		namedPaths: true,
		storagePath: root,
		db,
		driver: new LocalStorageDriver(root),
		activityService: {
			register: (entry: { userId: string; message: string; level: string }) => {
				activity.push(entry);
				return Promise.resolve();
			},
		},
		...extra,
	} as unknown as StorageContext;
}

const operations = (extra: Partial<StorageContext> = {}) =>
	new FileOperations(context(extra), thumbnails);

beforeEach(async () => {
	db = migratedSqlite();
	root = await mkdtemp(join(tmpdir(), "penombre-files-"));
	dropped = [];
	activity = [];
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

async function addFolder(path: string, name = path.split("/").pop() ?? path) {
	await mkdir(join(root, path), { recursive: true });
	await db
		.insert(folders)
		.values({ id: `id-${path}`, name, ownerId: "u", path });
	return `id-${path}`;
}

async function addFile(
	path: string,
	body = "bytes",
	extra: Partial<typeof files.$inferInsert> = {},
) {
	await writeFile(join(root, path), body);
	await db.insert(files).values({
		id: `id-${path}`,
		name: path.split("/").pop() ?? path,
		ownerId: "u",
		path,
		size: body.length,
		contentType: "text/plain",
		category: "DOCUMENTS",
		updatedAt: new Date("2024-01-01"),
		...extra,
	});
	return `id-${path}`;
}

async function rowOf(id: string) {
	const [row] = await db.select().from(files).where(eq(files.id, id));
	return row;
}

const text = (path: string) => readFile(join(root, path), "utf8");

describe("reading a file", () => {
	test("returns the row under its own key", async () => {
		await addFolder("takes");
		await addFile("takes/song.txt");

		const item = await operations().getFile("takes/song.txt");

		expect(item.key).toBe("song.txt");
		expect(item.metadata.id).toBe("id-takes/song.txt");
	});

	test("a missing path is not found", async () => {
		await expect(operations().getFile("nope.txt")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});

	test("a volume never sees the personal drive's rows", async () => {
		await addFile("song.txt");

		await expect(
			operations({ volumeId: "media" }).getFile("song.txt"),
		).rejects.toThrow(FileOrFolderNotFoundError);
		expect(await operations({ volumeId: "media" }).fileExists("song.txt")).toBe(
			false,
		);
	});

	test("lookups by id and path agree", async () => {
		const id = await addFile("song.txt");
		const ops = operations();

		expect(await ops.findFileById(id)).toBe("song.txt");
		expect(await ops.findFileById("missing")).toBeNull();
		expect(await ops.findFileOwner(id)).toEqual({
			ownerId: "u",
			name: "song.txt",
			volumeId: null,
		});
		expect(await ops.findFileOwner("missing")).toBeNull();
		expect(await ops.fileExistsById(id)).toBe(true);
		expect(await ops.fileExistsById("missing")).toBe(false);
		expect(await ops.fileExists("song.txt")).toBe(true);
	});

	test("raw data carries the bytes and the row's date", async () => {
		await addFile("song.txt", "hello");

		const data = await operations().getRawFileData("song.txt");

		expect(new TextDecoder().decode(data?.buffer)).toBe("hello");
		expect(data?.size).toBe(5);
		expect(data?.mtime).toBe(new Date("2024-01-01").getTime());
		expect(await operations().getRawFileData("missing.txt")).toBeNull();
	});

	test("an open file is framed by its bytes and streams a range", async () => {
		await addFile("song.txt", "0123456789", { size: 999 });

		const opened = await operations().openRawFile("song.txt");
		const body = await new Response(await opened?.stream(2, 4)).text();

		expect(opened?.size).toBe(10);
		expect(body).toBe("234");
		expect(await operations().openRawFile("missing.txt")).toBeNull();
	});

	test("an open file whose bytes cannot be sized falls back to the row", async () => {
		await addFile("song.txt", "0123456789", { size: 42 });
		const driver = new LocalStorageDriver(root);
		driver.getObjectSize = () => Promise.reject(new Error("gone"));

		const opened = await operations({ driver }).openRawFile("song.txt");

		expect(opened?.size).toBe(42);
	});
});

describe("writeFile", () => {
	test("writes the given bytes and the given metadata", async () => {
		await addFile("song.txt", "old");

		await operations().writeFile("song.txt", new TextEncoder().encode("new"), {
			name: "Song.txt",
			contentType: "text/plain",
			category: "DOCUMENTS",
			tags: ["demo"],
			isStarred: true,
			isTrashed: false,
		} as never);

		expect(await text("song.txt")).toBe("new");
		const row = await rowOf("id-song.txt");
		expect(row?.name).toBe("Song.txt");
		expect(row?.tags).toEqual(["demo"]);
		expect(row?.isStarred).toBe(true);
	});

	test("without bytes, a path with no row gets an empty placeholder", async () => {
		await operations().writeFile("placeholder.bin", undefined, undefined, 4);

		expect((await stat(join(root, "placeholder.bin"))).size).toBe(4);
	});

	test("without bytes, a known file keeps what it has", async () => {
		await addFile("song.txt", "keep me");

		await operations().writeFile("song.txt");

		expect(await text("song.txt")).toBe("keep me");
	});
});

describe("updateFile", () => {
	test("sets flags, tags and category without renaming", async () => {
		await addFile("song.txt");

		await operations().updateFile("song.txt", {
			tags: ["a"],
			isStarred: true,
			isTrashed: true,
			category: "OTHERS",
		} as never);

		const row = await rowOf("id-song.txt");
		expect(row?.tags).toEqual(["a"]);
		expect(row?.isStarred).toBe(true);
		expect(row?.isTrashed).toBe(true);
		expect(row?.category).toBe("OTHERS");
		expect(row?.path).toBe("song.txt");
		expect(activity).toEqual([
			{
				userId: "member",
				action: "update",
				message: "Updated file metadata",
				level: "info",
			} as never,
		]);
	});

	test("a rename re-derives the type from the new name", async () => {
		await addFile("song.txt");

		await operations({ namedPaths: false }).updateFile("song.txt", {
			key: " track.mp3 ",
		});

		const row = await rowOf("id-song.txt");
		expect(row?.name).toBe("track.mp3");
		expect(row?.category).toBe("MUSIC");
		expect(row?.contentType).toBe("audio/mpeg");
		expect(row?.path).toBe("song.txt");
	});

	test("a missing file is not found", async () => {
		await expect(
			operations().updateFile("nope.txt", { isStarred: true }),
		).rejects.toThrow(FileOrFolderNotFoundError);
	});
});

describe("moveFile", () => {
	test("moves the bytes and the row into the folder", async () => {
		const folderId = await addFolder("takes");
		await addFile("song.txt", "take one");

		await operations().moveFile("song.txt", "takes/");

		const row = await rowOf("id-song.txt");
		expect(row?.path).toBe("takes/song.txt");
		expect(row?.folderId).toBe(folderId);
		expect(await text("takes/song.txt")).toBe("take one");
		expect(existsSync(join(root, "song.txt"))).toBe(false);
		expect(dropped).toEqual(["song.txt"]);
	});

	test("a name already taken there gets a unique one", async () => {
		await addFolder("takes");
		await addFile("takes/song.txt", "", { folderId: "id-takes" });
		await addFile("song.txt", "second");

		await operations().moveFile("song.txt", "takes");

		const row = await rowOf("id-song.txt");
		expect(row?.name).toBe("song (1).txt");
		expect(row?.path).toBe("takes/song (1).txt");
	});

	test("back to the root clears the folder", async () => {
		await addFolder("takes");
		await addFile("takes/song.txt", "x", { folderId: "id-takes" });

		await operations().moveFile("takes/song.txt", "");

		const row = await rowOf("id-takes/song.txt");
		expect(row?.path).toBe("song.txt");
		expect(row?.folderId).toBeNull();
	});

	test("a missing file is not found", async () => {
		await expect(operations().moveFile("nope.txt", "")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});
});

describe("duplicateFile", () => {
	test("copies bytes into a fresh row beside the original", async () => {
		await addFolder("takes");
		await addFile("takes/song.txt", "take", {
			folderId: "id-takes",
			isStarred: true,
			tags: ["x"],
		});

		const copy = await operations().duplicateFile("takes/song.txt");

		const row = await rowOf(copy.metadata.id);
		expect(row?.name).toBe("song (1).txt");
		expect(row?.path).toBe("takes/song (1).txt");
		expect(row?.folderId).toBe("id-takes");
		expect(row?.isStarred).toBe(false);
		expect(row?.tags).toEqual([]);
		expect(await text("takes/song (1).txt")).toBe("take");
		expect(await text("takes/song.txt")).toBe("take");
	});

	test("a missing file is not found", async () => {
		await expect(operations().duplicateFile("nope.txt")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});
});

describe("importFile", () => {
	test("plans a unique destination and writes nothing", async () => {
		await addFolder("takes");
		await addFile("takes/song.txt", "", { folderId: "id-takes" });
		const source = await rowOf("id-takes/song.txt");

		const plan = await operations({ volumeId: null }).importFile(
			{ ...source, musicDuration: 12 } as never,
			"takes/",
		);

		expect(plan.filePath).toBe("takes/song (1).txt");
		expect(plan.values.folderId).toBe("id-takes");
		expect(plan.values.musicDuration).toBe(12);
		expect(plan.values.id).not.toBe(source?.id);
		expect(await db.select().from(files)).toHaveLength(1);
	});

	test("a folder that resolves to nothing is refused", async () => {
		const source = { name: "a.txt", tags: null } as never;

		await expect(operations().importFile(source, "ghost")).rejects.toThrow(
			"Folder not found: ghost",
		);
	});
});

describe("createFile", () => {
	test("keeps only the base name and writes an empty placeholder", async () => {
		await addFolder("takes");

		const result = await operations().createFile(
			{ name: "deep/path/note.txt", size: 7 },
			"takes",
		);

		expect(result.finalName).toBe("takes/note.txt");
		expect(result.metadata.name).toBe("note.txt");
		expect(await text("takes/note.txt")).toBe("");
		const row = await rowOf(result.id);
		expect(row?.size).toBe(7);
		expect(row?.folderId).toBe("id-takes");
	});

	test("a folder that resolves to nothing is refused", async () => {
		await expect(
			operations().createFile({ name: "a.txt", size: 0 }, "ghost/"),
		).rejects.toThrow(FileOrFolderNotFoundError);
	});
});

describe("createBatchFiles", () => {
	test("creates every file with its own unique name", async () => {
		await addFile("note.txt");

		const results = await operations().createBatchFiles([
			{ name: "note.txt", size: 1 },
			{ name: "sub/other.txt", size: 2 },
		]);

		expect(results.map((result) => result.metadata.name)).toEqual([
			"note (1).txt",
			"other.txt",
		]);
		expect(existsSync(join(root, "note (1).txt"))).toBe(true);
		expect(activity.at(-1)?.message).toBe("Created 2 files");
	});

	test("one file is counted in the singular", async () => {
		await operations().createBatchFiles([{ name: "one.txt", size: 1 }]);

		expect(activity.at(-1)?.message).toBe("Created 1 file");
	});

	test("an upload into a versioning folder hands back the live file", async () => {
		const settings = spyOn(appSettings, "getAppSettings").mockResolvedValue({
			versioningEnabled: true,
			maxVersionsPerFile: 3,
		} as never);
		try {
			const id = await addFile("note.txt");

			const [result] = await operations().createBatchFiles(
				[{ name: "note.txt", size: 9 }],
				undefined,
				"upload",
			);

			expect(result?.id).toBe(id);
			expect(result?.finalName).toBe("note.txt");
			expect(await db.select().from(files)).toHaveLength(1);
		} finally {
			settings.mockRestore();
		}
	});

	test("an upload with versioning off makes a new name instead", async () => {
		await addFile("note.txt");

		const [result] = await operations().createBatchFiles(
			[{ name: "note.txt", size: 9 }],
			undefined,
			"upload",
		);

		expect(result?.metadata.name).toBe("note (1).txt");
	});
});

describe("uploadFileBody", () => {
	test("writes a buffer and records the new size", async () => {
		const id = await addFile("note.txt", "");

		await operations().uploadFileBody(id, Buffer.from("written"));

		expect(await text("note.txt")).toBe("written");
		expect((await rowOf(id))?.size).toBe(7);
		expect(dropped).toEqual(["note.txt"]);
	});

	test("a blob is written whole and dated as asked", async () => {
		const id = await addFile("note.txt", "");
		const modifiedAt = new Date("2023-05-06T07:08:09Z");

		await operations().uploadFileBody(id, new Blob(["from a blob"]), {
			modifiedAt,
		});

		expect(await text("note.txt")).toBe("from a blob");
		expect((await stat(join(root, "note.txt"))).mtime.getTime()).toBe(
			modifiedAt.getTime(),
		);
		expect((await rowOf(id))?.updatedAt.getTime()).toBe(modifiedAt.getTime());
	});

	test("the old bytes become a version where the folder versions", async () => {
		const settings = spyOn(appSettings, "getAppSettings").mockResolvedValue({
			versioningEnabled: true,
			maxVersionsPerFile: 3,
		} as never);
		try {
			const id = await addFile("note.txt", "first");

			await operations().uploadFileBody(id, new TextEncoder().encode("second"));

			const kept = await db
				.select()
				.from(fileVersions)
				.where(eq(fileVersions.fileId, id));
			expect(kept).toHaveLength(1);
			expect(await text("note.txt")).toBe("second");
		} finally {
			settings.mockRestore();
		}
	});

	test("an unknown id is refused before anything is written", async () => {
		await expect(
			operations().uploadFileBody("missing", Buffer.from("x")),
		).rejects.toThrow("Failed to find file with id: missing");
	});

	test("a failed write is logged as an error and reported", async () => {
		const id = await addFile("note.txt", "");
		const driver = new LocalStorageDriver(root);
		driver.writeObject = () => Promise.reject(new Error("disk full"));

		await expect(
			operations({ driver }).uploadFileBody(id, Buffer.from("x"), {
				snapshot: false,
			}),
		).rejects.toThrow(`Error uploading file body for id: ${id}`);
		expect(activity.at(-1)?.level).toBe("error");
	});
});

describe("deleteFile", () => {
	test("removes the row, the bytes and the renders", async () => {
		await addFile("note.txt");

		await operations().deleteFile("note.txt");

		expect(await db.select().from(files)).toHaveLength(0);
		expect(existsSync(join(root, "note.txt"))).toBe(false);
		expect(dropped).toEqual(["note.txt"]);
		expect(activity.at(-1)?.message).toBe("Deleted a file");
	});

	test("a failure is reported with the key", async () => {
		await addFile("note.txt");
		const driver = new LocalStorageDriver(root);
		driver.deleteObject = () => Promise.reject(new Error("busy"));

		await expect(operations({ driver }).deleteFile("note.txt")).rejects.toThrow(
			"Error deleting file with key: note.txt",
		);
	});
});
