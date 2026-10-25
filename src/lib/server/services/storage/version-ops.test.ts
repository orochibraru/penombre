import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { eq, sql } from "drizzle-orm";

import type { Database } from "#lib/server/db/index.js";
import { files, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import {
	VersioningDisabledError,
	VersionMergeError,
} from "#lib/server/errors.js";
import * as appSettings from "#lib/server/services/app-settings.js";

import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import type { FileOperations } from "./files";
import * as media from "./media";
import type { ThumbnailService } from "./thumbnails";
import { afterWrite, VersionOperations } from "./version-ops";
import { listVersions, snapshot, versionKey } from "./versions";

const ON = { versioningEnabled: true, maxVersionsPerFile: 5 } as never;
const settings = spyOn(appSettings, "getAppSettings").mockResolvedValue(ON);
const durations = spyOn(media, "recordDurations").mockResolvedValue([]);

afterAll(() => {
	settings.mockRestore();
	durations.mockRestore();
});

let db: Database;
let root: string;
let ctx: StorageContext;
let thumbnails: {
	adopt: ReturnType<typeof mock>;
	deleteThumbnails: ReturnType<typeof mock>;
	warm: ReturnType<typeof mock>;
	generateThumbnail: ReturnType<typeof mock>;
};
let ops: VersionOperations;

beforeEach(async () => {
	settings.mockResolvedValue(ON);
	durations.mockClear();
	db = migratedSqlite();
	db.run(sql`PRAGMA foreign_keys = ON`);
	root = await mkdtemp(join(tmpdir(), "penombre-version-ops-"));
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
	thumbnails = {
		adopt: mock(() => Promise.resolve()),
		deleteThumbnails: mock(() => Promise.resolve()),
		warm: mock(() => Promise.resolve()),
		generateThumbnail: mock(() => Promise.resolve(null)),
	};
	ops = new VersionOperations(ctx, thumbnails as unknown as ThumbnailService);
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

async function put(
	id: string,
	path: string,
	body: string,
	extra: Partial<typeof files.$inferInsert> = {},
) {
	await ctx.driver.writeObject(path, new TextEncoder().encode(body));
	await db.insert(files).values({
		id,
		name: path.split("/").pop() ?? path,
		ownerId: "u",
		path,
		size: body.length,
		contentType: "text/plain",
		...extra,
	});
}

const read = async (key: string) =>
	new TextDecoder().decode(await ctx.driver.readObject(key));

const row = async (id: string) =>
	(await db.select().from(files).where(eq(files.id, id)))[0];

/** The real database, except `method`, which always throws. */
function failing(method: "insert" | "update"): StorageContext {
	return {
		...ctx,
		db: new Proxy(db, {
			get: (target, property) =>
				property === method
					? () => {
							throw new Error("database is locked");
						}
					: Reflect.get(target, property),
		}),
	} as StorageContext;
}

describe("afterWrite", () => {
	test("new bytes drop a track's duration and re-probe it", async () => {
		await put("f", "song.mp3", "abc", { musicDuration: 120 });
		const at = new Date(Date.UTC(2026, 3, 1));

		await afterWrite(
			ctx,
			thumbnails as unknown as ThumbnailService,
			(await row("f"))!,
			{ size: 9, updatedAt: at },
		);

		expect(await row("f")).toMatchObject({
			size: 9,
			musicDuration: null,
			updatedAt: at,
		});
		expect(thumbnails.deleteThumbnails).toHaveBeenCalledWith("song.mp3");
		expect(thumbnails.warm).toHaveBeenCalledWith("song.mp3", "text/plain");
		expect(durations.mock.calls[0]?.[1]).toEqual([
			{ id: "f", path: "song.mp3", category: "MUSIC", updatedAt: at },
		]);
	});

	test("a video loses its duration too, a text file has none to lose", async () => {
		await put("v", "clip.mp4", "abc", { videoDuration: 30 });
		await put("t", "notes.txt", "abc");

		await afterWrite(
			ctx,
			thumbnails as unknown as ThumbnailService,
			(await row("v"))!,
			{ size: 1 },
		);
		await afterWrite(
			ctx,
			thumbnails as unknown as ThumbnailService,
			(await row("t"))!,
			{ size: 2 },
		);

		expect((await row("v"))?.videoDuration).toBeNull();
		expect((await row("t"))?.size).toBe(2);
		expect(durations).toHaveBeenCalledTimes(1);
	});

	test("a failed warm-up never fails the write", async () => {
		await put("t", "notes.txt", "abc");
		thumbnails.warm.mockImplementationOnce(() =>
			Promise.reject(new Error("queue full")),
		);
		await afterWrite(
			ctx,
			thumbnails as unknown as ThumbnailService,
			(await row("t"))!,
			{ size: 3 },
		);
		expect((await row("t"))?.size).toBe(3);
	});
});

describe("snapshotFile", () => {
	test("keeps the current bytes and gives the version its renders", async () => {
		await put("f", "f.txt", "first");

		const version = await ops.snapshotFile("f");

		expect(version).toMatchObject({ seq: 1, size: 5 });
		expect(await read(versionKey("f", version!.id))).toBe("first");
		expect(thumbnails.adopt).toHaveBeenCalledWith(
			"f.txt",
			versionKey("f", version!.id),
		);
	});

	test("refuses while the admin has versioning off", async () => {
		await put("f", "f.txt", "first");
		settings.mockResolvedValue({ versioningEnabled: false } as never);
		await expect(ops.snapshotFile("f")).rejects.toBeInstanceOf(
			VersioningDisabledError,
		);
	});

	test("a file that is not here has no version", async () => {
		expect(await ops.snapshotFile("missing")).toBeNull();
	});
});

describe("keepVersion", () => {
	test("an empty placeholder is not a version", async () => {
		await put("f", "f.txt", "");
		await ops.keepVersion((await row("f"))!);
		expect(await listVersions(ctx, "f")).toEqual([]);
	});

	test("a folder with versioning off keeps nothing unless forced", async () => {
		await db.insert(folders).values({
			id: "d",
			name: "d",
			ownerId: "u",
			path: "d",
			settings: { versioning: false },
		});
		await put("f", "d/f.txt", "bytes", { folderId: "d" });

		await ops.keepVersion((await row("f"))!);
		expect(await listVersions(ctx, "f")).toEqual([]);
		await ops.keepVersion((await row("f"))!, true);
		expect(await listVersions(ctx, "f")).toHaveLength(1);
	});
});

describe("fileVersioning", () => {
	test("answers for the file's folder", async () => {
		await put("f", "f.txt", "x");
		expect(await ops.fileVersioning("f")).toEqual({ enabled: true, max: 5 });
		expect(await ops.fileVersioning("missing")).toBeNull();
	});
});

describe("restoreVersion", () => {
	test("the current bytes become a version, the version's become current", async () => {
		await put("f", "f.txt", "first");
		const kept = await snapshot(ctx, (await row("f"))!, 5);
		await ctx.driver.writeObject("f.txt", new TextEncoder().encode("second!"));

		expect(await ops.restoreVersion("f", kept.id)).toBe(true);

		expect(await read("f.txt")).toBe("first");
		expect((await row("f"))?.size).toBe(5);
		const versions = await listVersions(ctx, "f");
		expect(versions.map((v) => v.seq)).toEqual([2, 1]);
		expect(await read(versionKey("f", versions[0]!.id))).toBe("second!");
	});

	test("a version of another file, or of nothing, is refused", async () => {
		await put("f", "f.txt", "a");
		await put("g", "g.txt", "b");
		const kept = await snapshot(ctx, (await row("g"))!, 5);
		expect(await ops.restoreVersion("f", kept.id)).toBe(false);
		expect(await ops.restoreVersion("missing", kept.id)).toBe(false);
		expect(await read("f.txt")).toBe("a");
	});
});

describe("reading a version", () => {
	test("opens the version's bytes, ranges included", async () => {
		await put("f", "f.txt", "version bytes");
		const kept = await snapshot(ctx, (await row("f"))!, 5);
		await ctx.driver.writeObject("f.txt", new TextEncoder().encode("now"));

		const opened = await ops.openVersion("f", kept.id);

		expect(opened?.version.id).toBe(kept.id);
		expect(opened?.file.metadata.id).toBe("f");
		expect(await new Response(await opened!.stream()).text()).toBe(
			"version bytes",
		);
		expect(await new Response(await opened!.stream(8, 12)).text()).toBe(
			"bytes",
		);
		expect(await ops.openVersion("f", "missing")).toBeNull();
		expect(await ops.openVersion("missing", kept.id)).toBeNull();
	});

	test("a version's thumbnail is rendered from its own key", async () => {
		await put("f", "a.png", "png", { contentType: "image/png" });
		const kept = await snapshot(ctx, (await row("f"))!, 5);
		const tile = { buffer: null, contentType: "image/webp", etag: "e" };
		thumbnails.generateThumbnail.mockResolvedValueOnce(tile);

		expect(await ops.versionThumbnail("f", kept.id, 300, "e")).toBe(tile);
		expect(thumbnails.generateThumbnail).toHaveBeenCalledWith(
			versionKey("f", kept.id),
			"image/png",
			300,
			"e",
		);
		expect(await ops.versionThumbnail("missing", kept.id, 300)).toBeNull();
	});

	test("lists a file's versions, newest first", async () => {
		await put("f", "f.txt", "x");
		await snapshot(ctx, (await row("f"))!, 5);
		await snapshot(ctx, (await row("f"))!, 5);

		const listed = await ops.listFileVersions("f");

		expect(listed?.file.id).toBe("f");
		expect(listed?.versions.map((v) => [v.seq, v.authorName])).toEqual([
			[2, "u"],
			[1, "u"],
		]);
		expect(await ops.listFileVersions("missing")).toBeNull();
	});
});

describe("deleteFileVersion", () => {
	test("deletes the version's row, bytes and renders", async () => {
		await put("f", "f.txt", "x");
		const kept = await snapshot(ctx, (await row("f"))!, 5);

		expect(await ops.deleteFileVersion("f", kept.id)).toBe(true);

		expect(await listVersions(ctx, "f")).toEqual([]);
		expect(existsSync(join(root, versionKey("f", kept.id)))).toBe(false);
		expect(thumbnails.deleteThumbnails).toHaveBeenCalledWith(
			versionKey("f", kept.id),
		);
	});

	test("refuses an unknown file or version", async () => {
		await put("f", "f.txt", "x");
		const kept = await snapshot(ctx, (await row("f"))!, 5);
		expect(await ops.deleteFileVersion("missing", kept.id)).toBe(false);
		expect(await ops.deleteFileVersion("f", "missing")).toBe(false);
		expect(thumbnails.deleteThumbnails).not.toHaveBeenCalled();
		expect(await listVersions(ctx, "f")).toHaveLength(1);
	});
});

describe("reorder", () => {
	test("a file that is not here is refused", async () => {
		expect(await ops.reorder("missing", [])).toBe(false);
	});
});

describe("planMerge refusals", () => {
	test("needs two files", async () => {
		await put("a", "a.wav", "a");
		await expect(ops.planMerge(["a", "a"])).rejects.toBeInstanceOf(
			VersionMergeError,
		);
	});

	test("refuses while the admin has versioning off", async () => {
		await put("a", "a.wav", "a");
		await put("b", "b.wav", "b");
		settings.mockResolvedValue({ versioningEnabled: false } as never);
		await expect(ops.planMerge(["a", "b"])).rejects.toBeInstanceOf(
			VersioningDisabledError,
		);
	});

	test("a take whose bytes are gone is dated by its row", async () => {
		const at = new Date(Date.UTC(2026, 0, 5));
		await put("a", "a.wav", "a", { updatedAt: at });
		await put("b", "b.wav", "b");
		await rm(join(root, "a.wav"));

		const plan = await ops.planMerge(["a", "b"]);

		expect(plan?.sources[0]?.at).toEqual(at);
	});
});

describe("merge", () => {
	function withFiles(fileOperations: Partial<FileOperations>) {
		return new VersionOperations(
			ctx,
			thumbnails as unknown as ThumbnailService,
			fileOperations as FileOperations,
		);
	}

	test("without file operations nothing is merged", async () => {
		await put("a", "a.wav", "a");
		await put("b", "b.wav", "b");
		expect(await ops.merge(["a", "b"])).toBeNull();
		expect(await listVersions(ctx, "b")).toEqual([]);
	});

	test("the kept file takes the name asked for, made unique", async () => {
		await mkdir(join(root, "takes"));
		await put("a", "takes/a.wav", "a");
		await put("b", "takes/b.wav", "b");
		await put("c", "takes/Final.wav", "c");
		const deleteFile = mock(async (path: string) => {
			await db.delete(files).where(eq(files.path, path));
			return true;
		});
		const updateFile = mock(async () => undefined);

		expect(
			await withFiles({ deleteFile, updateFile } as never).merge(
				["a", "b"],
				" Final.wav ",
			),
		).toBe("b");

		expect(deleteFile).toHaveBeenCalledWith("takes/a.wav");
		expect(updateFile).toHaveBeenCalledWith("takes/b.wav", {
			key: "Final (1).wav",
		});
		expect((await listVersions(ctx, "b")).map((v) => v.name)).toEqual([
			"a.wav",
		]);
	});

	test("a name that only changes case is left alone", async () => {
		await put("a", "a.wav", "a");
		await put("b", "Take.wav", "b");
		const updateFile = mock(async () => undefined);

		await withFiles({
			deleteFile: async () => true,
			updateFile,
		} as never).merge(["a", "b"], "take.WAV");

		expect(updateFile).not.toHaveBeenCalled();
	});
});

describe("carrying a history", () => {
	test("a failed move puts the version's bytes back", async () => {
		await put("t", "t.txt", "target");
		await put("s", "s.txt", "source");
		const kept = await snapshot(ctx, (await row("s"))!, 5);

		await expect(
			new VersionOperations(
				failing("update"),
				thumbnails as unknown as ThumbnailService,
			).replace("t", "s"),
		).rejects.toThrow("database is locked");

		expect(await read(versionKey("s", kept.id))).toBe("source");
		expect(existsSync(join(root, versionKey("t", kept.id)))).toBe(false);
		expect((await listVersions(ctx, "s")).map((v) => v.id)).toEqual([kept.id]);
	});
});

describe("extract", () => {
	test("a version with no name is named after the file and its number", async () => {
		await mkdir(join(root, "docs"));
		await db
			.insert(folders)
			.values({ id: "d", name: "docs", ownerId: "u", path: "docs" });
		await put("f", "docs/Notes", "old", { folderId: "d" });
		await snapshot(ctx, (await row("f"))!, 5);

		const [id] = (await ops.extract("f")) ?? [];

		expect(await row(id!)).toMatchObject({
			name: "Notes v1",
			folderId: "d",
			size: 3,
		});
		expect(await read((await row(id!))!.path)).toBe("old");
		expect(await listVersions(ctx, "f")).toEqual([]);
	});

	test("a file that is not here extracts nothing", async () => {
		expect(await ops.extract("missing")).toBeNull();
	});

	test("a row that cannot be written puts the bytes back in the history", async () => {
		await put("f", "f.txt", "old");
		const kept = await snapshot(ctx, (await row("f"))!, 5);

		await expect(
			new VersionOperations(
				failing("insert"),
				thumbnails as unknown as ThumbnailService,
			).extract("f"),
		).rejects.toThrow("database is locked");

		expect(await read(versionKey("f", kept.id))).toBe("old");
		expect(await listVersions(ctx, "f")).toHaveLength(1);
		expect(
			(await readdir(root)).filter((name) => !name.startsWith(".")),
		).toEqual(["f.txt"]);
	});
});
