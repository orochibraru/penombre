/**
 * The `updated_at` guard on Postgres, where `files.updated_at` is a
 * `timestamp` rather than SQLite's integer ms. Runs only when DATABASE_URL
 * names Postgres (the schema module picks its dialect from it at import):
 *
 *   DATABASE_URL=postgres://… bun test src/lib/server/services/storage/media.pg.test.ts
 */
import { describe, expect, mock, test } from "bun:test";
import { join } from "node:path";
import { SQL } from "bun";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { files, user } from "#lib/server/db/schema.js";

const url = process.env.DATABASE_URL ?? "";
const onPostgres = /^postgres(ql)?:/i.test(url);

const awaitJob = mock(async () => ({
	status: "succeeded",
	result: JSON.stringify({ durations: { "/data/t.mp3": 7 } }),
}));
mock.module("#lib/server/services/jobs.js", () => ({
	enqueueJob: mock(async () => "job-1"),
	awaitJob,
	finishJob: mock(async () => true),
	disownJob: mock(async () => {}),
}));

describe.skipIf(!onPostgres)("recordDurations on Postgres", () => {
	test("the updated_at guard matches exactly, and rejects older bytes", async () => {
		const { recordDurations } = await import("./media");
		const db = drizzle(new SQL(url));
		await migrate(db, {
			migrationsFolder: join(import.meta.dir, "../../../../../drizzle/pg"),
		});
		const id = crypto.randomUUID();
		await db.insert(user).values({ id, name: id, email: `${id}@x` });
		// A millisecond value a `timestamp` column must round-trip exactly.
		const stamp = new Date("2026-01-01T00:00:00.123Z");
		const ctx = {
			db,
			storagePath: "/data",
			user: { id },
			volumeId: null,
		} as never;
		const insert = (fileId: string, updatedAt: Date) =>
			db.insert(files).values({
				id: fileId,
				name: "t.mp3",
				path: "t.mp3",
				category: "MUSIC",
				ownerId: id,
				updatedAt,
			});
		const read = async (fileId: string) =>
			(await db.select().from(files).where(eq(files.id, fileId)))[0];
		try {
			await insert(`${id}-same`, stamp);
			await recordDurations(ctx, [
				{
					id: `${id}-same`,
					path: "t.mp3",
					category: "MUSIC",
					updatedAt: stamp,
				},
			]);
			expect(await read(`${id}-same`)).toMatchObject({
				musicDuration: 7,
				updatedAt: stamp,
			});

			await db.delete(files).where(eq(files.id, `${id}-same`));
			await insert(`${id}-newer`, new Date(stamp.getTime() + 1));
			await recordDurations(ctx, [
				{
					id: `${id}-newer`,
					path: "t.mp3",
					category: "MUSIC",
					updatedAt: stamp,
				},
			]);
			expect((await read(`${id}-newer`))?.musicDuration).toBeNull();
		} finally {
			await db.delete(user).where(eq(user.id, id));
		}
	});
});
