import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { sql } from "drizzle-orm";

import type { Database } from "#lib/server/db/index.js";
import { files, fileVersions, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as appSettings from "#lib/server/services/app-settings.js";

import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import {
	adminVersioning,
	DEFAULT_MAX_VERSIONS,
	deleteVersion,
	dropVersionBytes,
	folderVersioning,
	getVersion,
	latestSeqs,
	listVersions,
	pathPrefixes,
	reorderVersions,
	setFolderSettings,
	snapshot,
	versioningAt,
	versioningForFile,
	versionKey,
} from "./versions";

let db: Database;
let root: string;
let ctx: StorageContext;
const on = { enabled: true, max: 10 };

beforeEach(async () => {
	db = migratedSqlite();
	// On in production (`db/index.ts`); the cascade depends on it.
	db.run(sql`PRAGMA foreign_keys = ON`);
	root = await mkdtemp(join(tmpdir(), "penombre-versions-"));
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

async function folder(path: string, settings?: object) {
	await db.insert(folders).values({
		id: path.replaceAll("/", "-"),
		name: path,
		ownerId: "u",
		path,
		settings: settings ?? null,
	});
}

async function file(id: string, path: string, body: string) {
	await ctx.driver.writeObject(path, new TextEncoder().encode(body));
	await db.insert(files).values({ id, name: path, ownerId: "u", path });
	return { id, path, contentType: "text/plain" };
}

const read = async (key: string) =>
	new TextDecoder().decode(await ctx.driver.readObject(key));

describe("pathPrefixes", () => {
	test("lists every ancestor, top down", () => {
		expect(pathPrefixes("a/b/c")).toEqual(["a", "a/b", "a/b/c"]);
	});
});

describe("versioningAt", () => {
	test("nothing is on while the admin has it off", async () => {
		await folder("a", { versioning: true });
		expect(
			await versioningAt(ctx, "a", { enabled: false, max: 10 }),
		).toMatchObject({ enabled: false });
	});

	test("the root and unset folders follow the admin", async () => {
		await folder("a");
		expect(await versioningAt(ctx, null, on)).toEqual(on);
		expect(await versioningAt(ctx, "a", on)).toEqual(on);
	});

	test("the nearest folder that sets a key wins", async () => {
		await folder("a", { versioning: false });
		await folder("a/b");
		await folder("a/b/c", { versioning: true });
		expect((await versioningAt(ctx, "a/b", on)).enabled).toBe(false);
		expect((await versioningAt(ctx, "a/b/c", on)).enabled).toBe(true);
		expect((await versioningAt(ctx, "a/b/c", on, true)).enabled).toBe(false);
	});

	test("a folder may lower the cap, never raise it", async () => {
		await folder("a", { maxVersions: 3 });
		await folder("b", { maxVersions: 50 });
		expect((await versioningAt(ctx, "a", on)).max).toBe(3);
		expect((await versioningAt(ctx, "b", on)).max).toBe(10);
	});
});

describe("snapshot", () => {
	test("keeps the old bytes through an overwrite", async () => {
		const f = await file("f", "f.txt", "first");
		const version = await snapshot(ctx, f, 10);
		await ctx.driver.writeObject("f.txt", new TextEncoder().encode("second"));
		expect(await read(versionKey("f", version.id))).toBe("first");
		expect(version).toMatchObject({ seq: 1, size: 5, createdBy: "u" });
	});

	test("prunes the oldest past the cap, and seq never moves", async () => {
		const f = await file("f", "f.txt", "x");
		const first = await snapshot(ctx, f, 2);
		await snapshot(ctx, f, 2);
		await snapshot(ctx, f, 2);
		const kept = await listVersions(ctx, "f");
		expect(kept.map((v) => v.seq)).toEqual([3, 2]);
		expect(existsSync(join(root, versionKey("f", first.id)))).toBe(false);
		expect((await latestSeqs(ctx, ["f", "other"])).get("f")).toBe(3);
	});

	test("versions go with their file", async () => {
		const f = await file("f", "f.txt", "x");
		await snapshot(ctx, f, 10);
		await db.delete(files);
		await dropVersionBytes(ctx, ["f"]);
		expect(await db.select().from(fileVersions)).toHaveLength(0);
		expect(existsSync(join(root, ".versions/f"))).toBe(false);
	});

	test("its renders go too, and only its own", async () => {
		const thumbs = join(root, ".thumbnails");
		await mkdir(thumbs, { recursive: true });
		for (const name of [".versions_f_v1_300.webp", ".versions_g_v1_300.webp"]) {
			await writeFile(join(thumbs, name), "x");
		}
		await dropVersionBytes(ctx, ["f"]);
		expect(await readdir(thumbs)).toEqual([".versions_g_v1_300.webp"]);
	});
});

describe("adminVersioning", () => {
	test("is off with the default cap until the admin says otherwise", async () => {
		const settings = spyOn(appSettings, "getAppSettings").mockResolvedValue(
			{} as never,
		);
		try {
			expect(await adminVersioning()).toEqual({
				enabled: false,
				max: DEFAULT_MAX_VERSIONS,
			});
			settings.mockResolvedValue({
				versioningEnabled: true,
				maxVersionsPerFile: 4,
			} as never);
			expect(await adminVersioning()).toEqual({ enabled: true, max: 4 });
		} finally {
			settings.mockRestore();
		}
	});
});

describe("versioningForFile", () => {
	test("a file follows its folder's setting", async () => {
		await folder("a", { versioning: false });
		expect((await versioningForFile(ctx, { folderId: "a" }, on)).enabled).toBe(
			false,
		);
	});

	test("a root file, or one whose folder is gone, follows the admin", async () => {
		expect(await versioningForFile(ctx, { folderId: null }, on)).toEqual(on);
		expect(await versioningForFile(ctx, { folderId: "gone" }, on)).toEqual(on);
	});
});

describe("snapshot failures", () => {
	test("a version that cannot be recorded leaves no bytes behind", async () => {
		const f = await file("f", "f.txt", "x");
		const failing = {
			...ctx,
			db: new Proxy(db, {
				get: (target, property) =>
					property === "insert"
						? () => {
								throw new Error("UNIQUE constraint failed");
							}
						: Reflect.get(target, property),
			}),
		} as StorageContext;

		await expect(snapshot(failing, f, 10)).rejects.toThrow("UNIQUE");

		expect(await readdir(join(root, ".versions/f"))).toEqual([]);
		expect(await listVersions(ctx, "f")).toEqual([]);
	});
});

describe("reading and deleting a version", () => {
	test("a version is found under its own file only", async () => {
		const f = await file("f", "f.txt", "x");
		await file("g", "g.txt", "y");
		const version = await snapshot(ctx, f, 10);
		expect((await getVersion(ctx, "f", version.id))?.id).toBe(version.id);
		expect(await getVersion(ctx, "g", version.id)).toBeNull();
	});

	test("deleting removes the row and its bytes", async () => {
		const f = await file("f", "f.txt", "x");
		const version = await snapshot(ctx, f, 10);
		expect(await deleteVersion(ctx, "f", version.id)).toBe(true);
		expect(await listVersions(ctx, "f")).toEqual([]);
		expect(existsSync(join(root, versionKey("f", version.id)))).toBe(false);
		expect(await deleteVersion(ctx, "f", version.id)).toBe(false);
	});

	test("no file ids, no query", async () => {
		expect(await latestSeqs(ctx, [])).toEqual(new Map());
	});
});

describe("reorderVersions", () => {
	test("renumbers in the order given, oldest first", async () => {
		const f = await file("f", "f.txt", "x");
		const first = await snapshot(ctx, f, 10);
		const second = await snapshot(ctx, f, 10);
		const third = await snapshot(ctx, f, 10);

		expect(
			await reorderVersions(ctx, "f", [third.id, first.id, second.id]),
		).toBe(true);

		const seqs = new Map(
			(await listVersions(ctx, "f")).map((v) => [v.id, v.seq]),
		);
		expect([
			seqs.get(third.id),
			seqs.get(first.id),
			seqs.get(second.id),
		]).toEqual([1, 2, 3]);
	});

	test("refuses anything but exactly the file's versions", async () => {
		const f = await file("f", "f.txt", "x");
		const first = await snapshot(ctx, f, 10);
		const second = await snapshot(ctx, f, 10);

		expect(await reorderVersions(ctx, "f", [first.id])).toBe(false);
		expect(await reorderVersions(ctx, "f", [first.id, first.id])).toBe(false);
		expect(await reorderVersions(ctx, "f", [first.id, "other"])).toBe(false);
		expect((await listVersions(ctx, "f")).map((v) => [v.id, v.seq])).toEqual([
			[second.id, 2],
			[first.id, 1],
		]);
	});

	test("a file with no versions has nothing to reorder", async () => {
		await file("f", "f.txt", "x");
		expect(await reorderVersions(ctx, "f", [])).toBe(true);
	});
});

describe("dropVersionBytes failures", () => {
	test("nothing to drop touches nothing", async () => {
		await mkdir(join(root, ".versions/f"), { recursive: true });
		await dropVersionBytes(ctx, []);
		expect(existsSync(join(root, ".versions/f"))).toBe(true);
	});

	test("bytes it cannot remove are logged, never thrown", async () => {
		const stuck = {
			...ctx,
			driver: {
				deleteObjectsByPrefix: () => Promise.reject(new Error("EBUSY")),
			},
		} as unknown as StorageContext;
		await expect(dropVersionBytes(stuck, ["f"])).resolves.toBeUndefined();
	});
});

describe("folder settings", () => {
	test("reads what a folder sets and what it would inherit", async () => {
		await folder("a", { maxVersions: 4 });
		await folder("a/b", { versioning: false });

		const byId = await folderVersioning(ctx, "a-b", on);
		expect(byId).toEqual({
			path: "a/b",
			settings: { versioning: false },
			effective: { enabled: false, max: 4 },
			inherited: { enabled: true, max: 4 },
			adminEnabled: true,
			adminMax: 10,
		});
		expect((await folderVersioning(ctx, "a/b", on))?.path).toBe("a/b");
	});

	test("a folder that sets nothing has empty settings", async () => {
		await folder("a");
		expect((await folderVersioning(ctx, "a", on))?.settings).toEqual({});
		expect(await folderVersioning(ctx, "missing", on)).toBeNull();
	});

	test("saves settings on the folder, by id or by path", async () => {
		await folder("a/b");
		expect(await setFolderSettings(ctx, "a/b", { maxVersions: 2 })).toBe(true);
		expect((await versioningAt(ctx, "a/b", on)).max).toBe(2);
		expect(await setFolderSettings(ctx, "a-b", { versioning: false })).toBe(
			true,
		);
		expect((await versioningAt(ctx, "a/b", on)).enabled).toBe(false);
		expect(await setFolderSettings(ctx, "missing", {})).toBe(false);
	});
});
