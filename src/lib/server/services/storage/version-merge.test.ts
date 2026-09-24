import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	spyOn,
	test,
} from "bun:test";
import { mkdtemp, rm, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { fileNotes, files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { VersionMergeError } from "#lib/server/errors.js";
import * as appSettings from "#lib/server/services/app-settings.js";
import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import type { ThumbnailService } from "./thumbnails";
import { VersionOperations } from "./version-ops";
import {
	listVersions,
	reorderVersions,
	snapshot,
	versionKey,
} from "./versions";

const settings = spyOn(appSettings, "getAppSettings").mockResolvedValue({
	versioningEnabled: true,
	maxVersionsPerFile: 3,
} as never);

afterAll(() => settings.mockRestore());

let db: Database;
let root: string;
let ctx: StorageContext;
let ops: VersionOperations;

beforeEach(async () => {
	db = migratedSqlite();
	db.run(sql`PRAGMA foreign_keys = ON`);
	root = await mkdtemp(join(tmpdir(), "penombre-merge-"));
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
		invalidateListingCaches: () => Promise.resolve(),
	} as unknown as StorageContext;
	ops = new VersionOperations(ctx, {
		adopt: () => Promise.resolve(),
		deleteThumbnails: () => Promise.resolve(),
	} as unknown as ThumbnailService);
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

/** A take on disk, modified `day` days into 2026. */
async function take(id: string, name: string, day: number) {
	await ctx.driver.writeObject(name, new TextEncoder().encode(id));
	const at = new Date(Date.UTC(2026, 0, day));
	await utimes(join(root, name), at, at);
	await db.insert(files).values({ id, name, ownerId: "u", path: name });
}

describe("merging files as versions", () => {
	test("the last id stays and the rest follow in the order given", async () => {
		await take("b", "Song-002.wav", 2);
		await take("c", "Song-2026-09-07.wav", 3);
		await take("a", "Song-001.wav", 1);
		await db
			.insert(fileNotes)
			.values({ id: "n", fileId: "a", userId: "u", body: "kick too loud" });

		const plan = await ops.planMerge(["a", "b", "c"]);
		expect(plan?.target.id).toBe("c");
		for (const source of plan?.sources ?? []) {
			await ops.absorb(plan!.target, source, plan!.max);
		}

		const versions = (await listVersions(ctx, "c")).reverse();
		expect(versions.map((v) => [v.seq, v.name])).toEqual([
			[1, "Song-001.wav"],
			[2, "Song-002.wav"],
		]);
		expect(versions[0]?.createdAt).toEqual(new Date(Date.UTC(2026, 0, 1)));
		const bytes = await ctx.driver.readObject(
			versionKey("c", versions[0]?.id ?? ""),
		);
		expect(new TextDecoder().decode(bytes)).toBe("a");
		const [note] = await db
			.select()
			.from(fileNotes)
			.where(eq(fileNotes.id, "n"));
		expect(note?.fileId).toBe("c");
	});

	test("the order given wins over the files' dates", async () => {
		await take("a", "Song-001.wav", 3);
		await take("b", "Song-002.wav", 1);
		const plan = await ops.planMerge(["a", "b"]);
		expect(plan?.target.id).toBe("b");
		expect(plan?.sources.map((s) => s.file.id)).toEqual(["a"]);
	});

	test("refuses more versions than the folder keeps", async () => {
		for (const [i, id] of ["a", "b", "c", "d", "e"].entries()) {
			await take(id, `Song-00${i}.wav`, i + 1);
		}
		await expect(ops.planMerge(["a", "b", "c", "d", "e"])).rejects.toThrow(
			VersionMergeError,
		);
	});

	test("refuses a merged-away file that has versions of its own", async () => {
		await take("a", "Song-001.wav", 1);
		await take("b", "Song-002.wav", 2);
		await snapshot(ctx, { id: "a", path: "Song-001.wav", contentType: "" }, 3);
		await expect(ops.planMerge(["a", "b"])).rejects.toThrow(VersionMergeError);
	});

	test("a missing file is a miss, not a partial merge", async () => {
		await take("a", "Song-001.wav", 1);
		expect(await ops.planMerge(["a", "nope"])).toBeNull();
	});

	test("an older take merged into a history lands where it is placed", async () => {
		await take("cur", "Song.wav", 5);
		const kept = await snapshot(
			ctx,
			{ id: "cur", path: "Song.wav", contentType: "" },
			3,
			{ name: "Song-002.wav" },
		);
		await take("old", "Song-001.wav", 1);

		const plan = await ops.planMerge(["old", `v:${kept.id}`, "cur"]);
		expect(plan?.order).toEqual([{ file: "old" }, { version: kept.id }]);
		const [source] = plan?.sources ?? [];
		const made = await ops.absorb(plan!.target, source!, plan!.max);
		await ops.reorder("cur", [made.id, kept.id]);

		const history = (await listVersions(ctx, "cur")).reverse();
		expect(history.map((v) => [v.seq, v.name])).toEqual([
			[1, "Song-001.wav"],
			[2, "Song-002.wav"],
		]);
	});

	test("a preview that missed a version is refused", async () => {
		await take("cur", "Song.wav", 5);
		await snapshot(ctx, { id: "cur", path: "Song.wav", contentType: "" }, 3);
		await take("old", "Song-001.wav", 1);
		await expect(
			ops.planMerge(["old", "v:someone-else", "cur"]),
		).rejects.toThrow(VersionMergeError);
	});
});

describe("reordering versions", () => {
	test("renumbers v1..vN in the order given", async () => {
		await take("f", "Song.wav", 1);
		const f = { id: "f", path: "Song.wav", contentType: "" };
		const a = await snapshot(ctx, f, 5);
		const b = await snapshot(ctx, f, 5);
		const c = await snapshot(ctx, f, 5);

		expect(await reorderVersions(ctx, "f", [c.id, a.id, b.id])).toBeTrue();

		const seqs = Object.fromEntries(
			(await listVersions(ctx, "f")).map((v) => [v.id, v.seq]),
		);
		expect(seqs).toEqual({ [c.id]: 1, [a.id]: 2, [b.id]: 3 });
	});

	test("refuses a list that is not exactly the file's versions", async () => {
		await take("f", "Song.wav", 1);
		const f = { id: "f", path: "Song.wav", contentType: "" };
		const a = await snapshot(ctx, f, 5);
		await snapshot(ctx, f, 5);
		expect(await reorderVersions(ctx, "f", [a.id])).toBeFalse();
		expect(await reorderVersions(ctx, "f", [a.id, a.id])).toBeFalse();
	});
});
