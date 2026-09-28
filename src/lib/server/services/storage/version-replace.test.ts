import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	spyOn,
	test,
} from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { fileNotes, files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as appSettings from "#lib/server/services/app-settings.js";
import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import type { ThumbnailService } from "./thumbnails";
import { VersionOperations } from "./version-ops";
import { listVersions, snapshot, versionKey } from "./versions";

const ON = { versioningEnabled: true, maxVersionsPerFile: 3 } as never;
const settings = spyOn(appSettings, "getAppSettings").mockResolvedValue(ON);

afterAll(() => settings.mockRestore());

let db: Database;
let root: string;
let ctx: StorageContext;
let ops: VersionOperations;

beforeEach(async () => {
	settings.mockResolvedValue(ON);
	db = migratedSqlite();
	db.run(sql`PRAGMA foreign_keys = ON`);
	root = await mkdtemp(join(tmpdir(), "penombre-replace-"));
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
	ops = new VersionOperations(ctx, {
		adopt: () => Promise.resolve(),
		deleteThumbnails: () => Promise.resolve(),
		warm: () => Promise.resolve(),
	} as unknown as ThumbnailService);
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

async function put(
	id: string,
	name: string,
	body: string,
	extra: Partial<typeof files.$inferInsert> = {},
) {
	await ctx.driver.writeObject(name, new TextEncoder().encode(body));
	await db.insert(files).values({
		id,
		name,
		ownerId: "u",
		path: name,
		size: body.length,
		...extra,
	});
}

const read = async (key: string) =>
	new TextDecoder().decode(await ctx.driver.readObject(key));

describe("replacing a file with another's bytes", () => {
	test("the target keeps its id and its old bytes become a version", async () => {
		const saved = new Date(Date.UTC(2026, 0, 5));
		await put("t", "Song.txt", "old");
		await put("s", "Song.txt.tmp", "newer", { updatedAt: saved });
		await db
			.insert(fileNotes)
			.values({ id: "n", fileId: "s", userId: "u", body: "on the temp" });

		expect(await ops.replace("t", "s")).toBe(true);

		expect(await read("Song.txt")).toBe("newer");
		const [row] = await db.select().from(files).where(eq(files.id, "t"));
		expect(row?.size).toBe(5);
		expect(row?.updatedAt).toEqual(saved);
		expect(await db.select().from(files).where(eq(files.id, "s"))).toEqual([]);
		const versions = await listVersions(ctx, "t");
		expect(versions).toHaveLength(1);
		expect(await read(versionKey("t", versions[0]?.id ?? ""))).toBe("old");
		const [note] = await db
			.select()
			.from(fileNotes)
			.where(eq(fileNotes.id, "n"));
		expect(note?.fileId).toBe("t");
	});

	test("the source's own history comes along", async () => {
		await put("t", "a.txt", "target");
		await put("s", "b.txt", "source");
		await snapshot(
			ctx,
			{ id: "s", path: "b.txt", contentType: "text/plain" },
			3,
		);

		await ops.replace("t", "s");

		expect(await listVersions(ctx, "t")).toHaveLength(2);
	});

	test("with versioning off the old bytes are replaced, the row still kept", async () => {
		settings.mockResolvedValue({
			versioningEnabled: false,
			maxVersionsPerFile: 3,
		} as never);
		await put("t", "a.txt", "old");
		await put("s", "b.txt", "new");

		expect(await ops.replace("t", "s")).toBe(true);

		expect(await read("a.txt")).toBe("new");
		expect(await listVersions(ctx, "t")).toEqual([]);
	});

	test("refuses a trashed or missing source, and itself", async () => {
		await put("t", "a.txt", "x");
		await put("s", "b.txt", "y", { isTrashed: true });

		expect(await ops.replace("t", "s")).toBe(false);
		expect(await ops.replace("t", "nope")).toBe(false);
		expect(await ops.replace("t", "t")).toBe(false);
		expect(await read("a.txt")).toBe("x");
		expect(await read("b.txt")).toBe("y");
	});
});
