import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { eq } from "drizzle-orm";

import type { Database } from "#lib/server/db/index.js";
import { files, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import {
	FileOrFolderNotFoundError,
	StorageUnavailableError,
} from "#lib/server/errors.js";

import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import { FolderOperations } from "./folders";
import type { ThumbnailService } from "./thumbnails";

let db: Database;
let root: string;
let dropped: string[];
let activity: string[];

const thumbnails = {
	deleteThumbnails: (key: string) => {
		dropped.push(key);
		return Promise.resolve();
	},
} as unknown as ThumbnailService;

function context(extra: Partial<StorageContext> = {}): StorageContext {
	return {
		user: { id: "u" },
		actor: { id: "u" },
		volumeId: null,
		namedPaths: true,
		storagePath: root,
		db,
		driver: new LocalStorageDriver(root),
		activityService: {
			register: (entry: { message: string }) => {
				activity.push(entry.message);
				return Promise.resolve();
			},
		},
		...extra,
	} as unknown as StorageContext;
}

const operations = (extra: Partial<StorageContext> = {}) =>
	new FolderOperations(context(extra), thumbnails);

beforeEach(async () => {
	db = migratedSqlite();
	root = await mkdtemp(join(tmpdir(), "penombre-folder-ops-"));
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

async function addFolder(
	path: string,
	extra: Partial<typeof folders.$inferInsert> = {},
) {
	const cut = path.lastIndexOf("/");
	await mkdir(join(root, path), { recursive: true });
	await db.insert(folders).values({
		id: `id-${path}`,
		name: path.slice(cut + 1),
		ownerId: "u",
		path,
		parentId: cut > 0 ? `id-${path.slice(0, cut)}` : null,
		...extra,
	});
}

async function addFile(path: string, body = "bytes") {
	await writeFile(join(root, path), body);
	await db.insert(files).values({
		id: `id-${path}`,
		name: path.split("/").pop() ?? path,
		ownerId: "u",
		path,
		size: body.length,
	});
}

async function folderRow(id: string) {
	const [row] = await db.select().from(folders).where(eq(folders.id, id));
	return row;
}

async function fileRow(id: string) {
	const [row] = await db.select().from(files).where(eq(files.id, id));
	return row;
}

describe("getFolder", () => {
	test("answers the path with a trailing slash", async () => {
		await addFolder("band");

		expect(await operations().getFolder("band/")).toBe("band/");
	});

	test("a missing folder is not found", async () => {
		await expect(operations().getFolder("ghost")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});
});

describe("createFolder", () => {
	test("files the folder under its parent and makes its directory", async () => {
		await addFolder("band");

		const created = await operations().createFolder("demos", "band/");

		expect(created.path).toBe("band/demos");
		expect((await folderRow(created.id))?.parentId).toBe("id-band");
		expect(existsSync(join(root, "band/demos"))).toBe(true);
		expect(activity).toEqual(["Created a folder"]);
	});

	test("a failed insert is reported without its details", async () => {
		const failing = Object.create(db) as Database;
		failing.insert = (() => ({
			values: () => Promise.reject(new Error("constraint")),
		})) as never;

		await expect(
			operations({ db: failing }).createFolder("demos"),
		).rejects.toThrow("Failed to create folder");
	});

	test("a root the app cannot write under is unavailable, not a crash", async () => {
		const blocked = join(root, "blocked");
		await writeFile(blocked, "a file where a directory should be");

		await expect(
			operations({ storagePath: blocked, namedPaths: false }).createFolder(
				"demos",
			),
		).rejects.toThrow(StorageUnavailableError);
	});
});

describe("moveFolder", () => {
	test("moves the subtree's rows and bytes under the destination", async () => {
		await addFolder("band");
		await addFolder("band/demos");
		await addFolder("band/demos/old");
		await addFile("band/demos/take.txt", "take");
		await addFile("band/demos/old/early.txt", "early");
		await addFolder("archive");

		await operations().moveFolder("band/demos/", "archive/");

		const moved = await folderRow("id-band/demos");
		expect(moved?.path).toBe("archive/demos");
		expect(moved?.parentId).toBe("id-archive");
		expect((await folderRow("id-band/demos/old"))?.path).toBe(
			"archive/demos/old",
		);
		expect((await fileRow("id-band/demos/take.txt"))?.path).toBe(
			"archive/demos/take.txt",
		);
		expect((await fileRow("id-band/demos/old/early.txt"))?.path).toBe(
			"archive/demos/old/early.txt",
		);
		expect(
			await readFile(join(root, "archive/demos/old/early.txt"), "utf8"),
		).toBe("early");
		expect(existsSync(join(root, "band/demos/take.txt"))).toBe(false);
		expect(dropped.toSorted()).toEqual([
			"band/demos/old/early.txt",
			"band/demos/take.txt",
		]);
	});

	test("an empty folder moves to the root under a unique name", async () => {
		await addFolder("demos");
		await addFolder("band");
		await addFolder("band/demos");

		await operations().moveFolder("band/demos", "");

		const moved = await folderRow("id-band/demos");
		expect(moved?.name).toBe("demos (1)");
		expect(moved?.parentId).toBeNull();
		expect(existsSync(join(root, moved?.path ?? "missing"))).toBe(true);
	});

	test("a folder cannot move into itself", async () => {
		await addFolder("band");
		await addFolder("band/demos");

		await expect(operations().moveFolder("band", "band/demos")).rejects.toThrow(
			"Cannot move a folder into itself",
		);
	});

	test("a missing folder is not found", async () => {
		await expect(operations().moveFolder("ghost", "")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});
});

describe("deleteFolder", () => {
	test("removes the subtree's rows and bytes, and nothing beside it", async () => {
		await addFolder("band");
		await addFolder("band/demos");
		await addFile("band/demos/take.txt");
		await addFolder("bandmates");
		await addFile("bandmates/keep.txt");

		await operations().deleteFolder("band/");

		const remainingFolders = await db.select().from(folders);
		expect(remainingFolders.map((row) => row.path)).toEqual(["bandmates"]);
		const remainingFiles = await db.select().from(files);
		expect(remainingFiles.map((row) => row.path)).toEqual([
			"bandmates/keep.txt",
		]);
		expect(existsSync(join(root, "band/demos/take.txt"))).toBe(false);
		expect(existsSync(join(root, "bandmates/keep.txt"))).toBe(true);
	});

	test("a folder that does not exist is refused", async () => {
		await expect(operations().deleteFolder("ghost")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});

	test("a byte failure keeps the rows and reports the key", async () => {
		await addFolder("band");
		await addFile("band/take.txt");
		const driver = new LocalStorageDriver(root);
		driver.deleteObjectsByPrefix = () => Promise.reject(new Error("busy"));

		await expect(operations({ driver }).deleteFolder("band")).rejects.toThrow(
			"Error deleting folder with key: band",
		);
		expect(await db.select().from(files)).toHaveLength(1);
	});
});

describe("trash state follows the subtree", () => {
	test("trash and restore reach every descendant", async () => {
		await addFolder("band");
		await addFolder("band/demos");
		await addFile("band/demos/take.txt");
		const ops = operations();

		await ops.trashFolder("band/");

		expect((await folderRow("id-band/demos"))?.isTrashed).toBe(true);
		expect((await fileRow("id-band/demos/take.txt"))?.isTrashed).toBe(true);

		await ops.restoreFolder("band");

		expect((await folderRow("id-band"))?.isTrashed).toBe(false);
		expect((await fileRow("id-band/demos/take.txt"))?.isTrashed).toBe(false);
		expect(activity).toEqual([
			"Moved a folder to trash",
			"Restored a folder from trash",
		]);
	});

	test("a missing folder is refused either way", async () => {
		await expect(operations().trashFolder("ghost")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
		await expect(operations().restoreFolder("ghost")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});
});

describe("updateFolderMeta", () => {
	test("stars and tags the folder alone", async () => {
		await addFolder("band");
		await addFolder("band/demos");

		await operations().updateFolderMeta("band/", {
			isStarred: true,
			tags: ["live"],
		});

		const row = await folderRow("id-band");
		expect(row?.isStarred).toBe(true);
		expect(row?.tags).toEqual(["live"]);
		expect((await folderRow("id-band/demos"))?.isStarred).toBe(false);
	});

	test("a rename and a trash in one call trash the renamed subtree", async () => {
		await addFolder("band");
		await addFile("band/take.txt");

		await operations().updateFolderMeta("band", {
			name: "Band",
			isTrashed: true,
		});

		const row = await folderRow("id-band");
		expect(row?.name).toBe("Band");
		expect(row?.isTrashed).toBe(true);
		const file = await fileRow("id-band/take.txt");
		expect(file?.isTrashed).toBe(true);
		expect(existsSync(join(root, row?.path ?? "missing", "take.txt"))).toBe(
			true,
		);
	});

	test("on the personal drive a rename leaves the disk alone", async () => {
		await addFolder("uuid-folder");

		await operations({ namedPaths: false }).updateFolderMeta("uuid-folder", {
			name: "Band",
		});

		const row = await folderRow("id-uuid-folder");
		expect(row?.name).toBe("Band");
		expect(row?.path).toBe("uuid-folder");
	});

	test("a missing folder is not found", async () => {
		await expect(
			operations().updateFolderMeta("ghost", { isStarred: true }),
		).rejects.toThrow(FileOrFolderNotFoundError);
	});
});

describe("folder lookups", () => {
	test("metadata of a known folder, null for an unknown one", async () => {
		await addFolder("band", { isStarred: true });

		const meta = await operations().getFolderMeta("band/");

		expect(meta?.id).toBe("id-band");
		expect(meta?.isStarred).toBe(true);
		expect(await operations().getFolderMeta("ghost")).toBeNull();
	});

	test("folderExists ignores a trailing slash", async () => {
		await addFolder("band");

		expect(await operations().folderExists("band/")).toBe(true);
		expect(await operations().folderExists("ghost")).toBe(false);
	});

	test("a full path joins parent and folder once each", () => {
		const ops = operations();

		expect(ops.getFullFolderPath("demos")).toBe("demos/");
		expect(ops.getFullFolderPath("demos/", "band")).toBe("band/demos/");
		expect(ops.getFullFolderPath("demos", "band/")).toBe("band/demos/");
	});
});

describe("resolveListedFolder", () => {
	test("a folder at its own path resolves to it", async () => {
		await addFolder("band");
		await addFolder("band/demos");

		expect(await operations().resolveListedFolder("demos/", "band")).toBe(
			"band/demos/",
		);
	});

	test("a row whose path does not match its place is found by segment", async () => {
		await addFolder("band");
		await addFolder("elsewhere/demos", { parentId: "id-band" });

		expect(await operations().resolveListedFolder("demos", "band")).toBe(
			"elsewhere/demos/",
		);
	});

	test("an unknown parent or two candidates resolve to nothing", async () => {
		await addFolder("one/demos", { parentId: null });
		await addFolder("two/demos", { parentId: null });

		expect(await operations().resolveListedFolder("demos", "ghost")).toBeNull();
		expect(await operations().resolveListedFolder("demos")).toBeNull();
	});
});

describe("folder listings", () => {
	beforeEach(async () => {
		await addFolder("band");
		await addFolder("band/demos");
		await addFolder("band/old", { isTrashed: true });
		await addFolder("gone", { isTrashed: true });
	});

	test("lists the live children of the root or of a folder", async () => {
		const ops = operations();

		expect(await ops.listFolders("/")).toEqual(["id-band"]);
		expect(await ops.listFolders("band")).toEqual(["id-band/demos"]);
		expect(
			(await ops.listFolders("band", { includeTrashed: true })).toSorted(),
		).toEqual(["id-band/demos", "id-band/old"]);
		expect(
			(await ops.listFolders("", { onlyTrashed: true })).toSorted(),
		).toEqual(["id-band/old", "id-gone"]);
	});

	test("lists every folder with its name and path", async () => {
		const ops = operations();

		const live = await ops.listFoldersWithMetadata("");
		expect(live.map((folder) => folder.path).toSorted()).toEqual([
			"band",
			"band/demos",
		]);
		const trashed = await ops.listFoldersWithMetadata("", {
			onlyTrashed: true,
		});
		expect(trashed.map((folder) => folder.name).toSorted()).toEqual([
			"gone",
			"old",
		]);
		expect(
			await ops.listFoldersWithMetadata("", { includeTrashed: true }),
		).toHaveLength(4);
	});
});

describe("folder sizes", () => {
	test("sums every file under a folder, nested ones included", async () => {
		await addFolder("band");
		await addFolder("band/demos");
		await addFile("band/a.txt", "123");
		await addFile("band/demos/b.txt", "4567");
		await addFile("bandmates.txt", "not inside");

		expect(await operations().calculateFolderSize("band/")).toBe(7);
		expect(await operations().calculateFolderSize("ghost")).toBe(0);
	});

	test("on the personal drive, sizes each child folder by its id", async () => {
		await db.insert(folders).values([
			{ id: "outer", name: "Band", ownerId: "u", path: "outer" },
			{
				id: "inner",
				name: "Demos",
				ownerId: "u",
				path: "outer/inner",
				parentId: "outer",
			},
		]);
		await mkdir(join(root, "outer/inner"), { recursive: true });
		await addFile("outer/a.txt", "123");
		await addFile("outer/inner/b.txt", "4567");
		const ops = operations({ namedPaths: false });

		expect(await ops.calculateFolderSizes("")).toEqual(new Map([["outer", 7]]));
		expect(await ops.calculateFolderSizes("outer")).toEqual(
			new Map([["inner", 4]]),
		);
	});
});
