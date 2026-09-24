import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { files, fileVersions, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import {
	dropVersionBytes,
	latestSeqs,
	listVersions,
	pathPrefixes,
	snapshot,
	versioningAt,
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
