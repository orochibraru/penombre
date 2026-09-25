/**
 * The trash's prefix ranges on Postgres, where `path` compares under
 * `collate "C"`. Runs only when DATABASE_URL names Postgres:
 *
 *   DATABASE_URL=postgres://… bun test src/lib/server/services/storage/listings.pg.test.ts
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { files, folders, user } from "#lib/server/db/schema.js";

const url = process.env.DATABASE_URL ?? "";
const onPostgres = /^postgres(ql)?:/i.test(url);

describe.skipIf(!onPostgres)("listTrashFiles on Postgres", () => {
	test("lists top-level entries, priced by trashed descendants", async () => {
		const { ListingOperations } = await import("./listings");
		const db = drizzle(new SQL(url));
		await migrate(db, {
			migrationsFolder: join(import.meta.dir, "../../../../../drizzle/pg"),
		});
		const id = crypto.randomUUID();
		await db.insert(user).values({ id, name: id, email: `${id}@x` });
		const folder = (fid: string, path: string, isTrashed: boolean) => ({
			id: `${id}-${fid}`,
			name: fid,
			path,
			ownerId: id,
			isTrashed,
		});
		await db
			.insert(folders)
			.values([
				folder("a", "a", true),
				folder("b", "a/b", true),
				folder("ab", "ab", false),
			]);
		const file = (
			fid: string,
			path: string,
			size: number,
			isTrashed = true,
		) => ({
			id: `${id}-${fid}`,
			name: fid,
			path,
			ownerId: id,
			size,
			isTrashed,
		});
		await db
			.insert(files)
			.values([
				file("f1", "a/x", 3),
				file("f2", "a/b/y", 4),
				file("f3", "a/live", 100, false),
				file("f4", "ab/z", 5),
			]);

		const ops = new ListingOperations({
			db,
			user: { id },
			volumeId: null,
		} as never);
		const page = await ops.listTrashFiles({
			sortColumn: "name",
			sortDirection: "asc",
			limit: 1,
		});
		expect(page.list.map((i) => [i.key, i.size])).toEqual([["a/", 7]]);
		expect(page.total).toBe(2);
		expect(page.totalSize).toBe(12);
		const next = await ops.listTrashFiles({
			sortColumn: "name",
			sortDirection: "asc",
			limit: 1,
			cursor: page.nextCursor,
		});
		expect(next.list.map((i) => i.key)).toEqual(["ab/z"]);
	});
});
