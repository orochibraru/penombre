import { beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { files, folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { LocalStorageDriver } from "./drivers/local";
import { reconcileCopy, reconcileDelete } from "./reconcile";

let database: Database;
let root: string;

function ctx() {
	return {
		db: database,
		storagePath: root,
		driver: new LocalStorageDriver(root),
		user: { id: "u1" },
		volumeId: null,
	} as never;
}

async function onDisk(key: string) {
	await mkdir(join(root, key, ".."), { recursive: true });
	await writeFile(join(root, key), "bytes");
}

async function row(
	id: string,
	path: string,
	extra: Partial<typeof files.$inferInsert> = {},
) {
	await database
		.insert(files)
		.values({ id, name: id, path, ownerId: "u1", ...extra });
}

beforeEach(async () => {
	database = migratedSqlite();
	root = await mkdtemp(join(tmpdir(), "penombre-reconcile-"));
	for (const id of ["u1", "u2"]) {
		await database.insert(user).values({ id, name: id, email: `${id}@x` });
	}
});

describe("reconcileCopy", () => {
	test("removes landed bytes no row points at, and nothing else", async () => {
		await onDisk("d/orphan.txt");
		await onDisk("d/kept.txt");
		await row("k", "d/kept.txt");
		const outside = join(tmpdir(), "not-ours.txt");
		await writeFile(outside, "x");

		const removed = await reconcileCopy(ctx(), {
			copied: [join(root, "d/orphan.txt"), join(root, "d/kept.txt"), outside],
			failed: [{ dest: join(root, "d/never-landed.txt") }],
		});

		expect(removed).toBe(1);
		expect(existsSync(join(root, "d/orphan.txt"))).toBe(false);
		expect(existsSync(join(root, "d/kept.txt"))).toBe(true);
		expect(existsSync(outside)).toBe(true);
	});

	// An interrupted pair may still have been copied by a crashed attempt.
	test("also removes a destination the result lists as failed", async () => {
		await onDisk("late.txt");
		await reconcileCopy(ctx(), {
			copied: [],
			failed: [{ dest: join(root, "late.txt") }],
		});
		expect(existsSync(join(root, "late.txt"))).toBe(false);
	});
});

describe("reconcileDelete", () => {
	test("deletes the trash rows whose bytes are gone, only those", async () => {
		await row("gone", "a.txt", { isTrashed: true });
		await row("live", "b.txt");
		await row("theirs", "a.txt", { ownerId: "u2", isTrashed: true });
		await row("kept", "c.txt", { isTrashed: true });
		await database.insert(folders).values({
			id: "dir",
			name: "d",
			path: "d",
			ownerId: "u1",
			isTrashed: true,
		});
		const thumbs: string[] = [];

		const removed = await reconcileDelete(
			ctx(),
			{
				deleteThumbnails: async (key: string) => void thumbs.push(key),
			} as never,
			{
				deleted: [join(root, "a.txt"), join(root, "b.txt")],
				deletedDirs: [join(root, "d")],
			},
		);

		expect(removed).toBe(2);
		const left = await database.select({ id: files.id }).from(files);
		expect(left.map((f) => f.id).toSorted()).toEqual([
			"kept",
			"live",
			"theirs",
		]);
		expect(
			await database.select().from(folders).where(eq(folders.id, "dir")),
		).toEqual([]);
		expect(thumbs).toEqual(["a.txt"]);
	});

	// On a volume a new file can be trashed at the same path inside the
	// window; its bytes are there, so its row must stay.
	test("keeps a trash row whose path has bytes again", async () => {
		await row("new", "a.txt", { isTrashed: true });
		await onDisk("a.txt");
		const removed = await reconcileDelete(
			ctx(),
			{ deleteThumbnails: async () => {} } as never,
			{ deleted: [join(root, "a.txt")], deletedDirs: [] },
		);
		expect(removed).toBe(0);
		expect(await database.select().from(files)).toHaveLength(1);
	});

	test("keeps a trash row whose bytes it cannot read", async () => {
		await row("locked", "locked/a.txt", { isTrashed: true });
		await onDisk("locked/a.txt");
		await chmod(join(root, "locked"), 0o000);
		try {
			const removed = await reconcileDelete(
				ctx(),
				{ deleteThumbnails: async () => {} } as never,
				{ deleted: [join(root, "locked/a.txt")], deletedDirs: [] },
			);
			expect(removed).toBe(0);
		} finally {
			await chmod(join(root, "locked"), 0o755);
		}
	});
});
