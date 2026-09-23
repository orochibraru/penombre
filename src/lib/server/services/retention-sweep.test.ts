import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "#lib/server/db/index.js";
import { activity, jobs, notifications, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { pruneRetainedData } from "./retention-sweep";

const DAY_MS = 24 * 60 * 60 * 1000;

let database: Database;

beforeEach(async () => {
	database = migratedSqlite();
	await database
		.insert(user)
		.values({ id: "u1", name: "Alice", email: "alice@x.test" });
});

async function seed(now: Date) {
	const old = new Date(now.getTime() - 40 * DAY_MS);
	const recent = new Date(now.getTime() - 1 * DAY_MS);

	await database.insert(activity).values([
		{
			userId: "u1",
			action: "create",
			message: "old",
			level: "info",
			createdAt: old,
		},
		{
			userId: "u1",
			action: "create",
			message: "recent",
			level: "info",
			createdAt: recent,
		},
	]);
	await database.insert(notifications).values([
		{ id: "n-old", userId: "u1", type: "note", createdAt: old },
		{ id: "n-recent", userId: "u1", type: "note", createdAt: recent },
	]);
	await database.insert(jobs).values([
		{
			id: "job-old-thumbnail",
			type: "thumbnail",
			status: "succeeded",
			spec: "{}",
			finishedAt: old.getTime(),
		},
		{
			id: "job-recent-thumbnail",
			type: "thumbnail",
			status: "succeeded",
			spec: "{}",
			finishedAt: recent.getTime(),
		},
		{
			id: "job-old-copy",
			type: "copy",
			status: "succeeded",
			spec: "{}",
			finishedAt: old.getTime(),
		},
	]);
}

describe("pruneRetainedData", () => {
	test("does nothing when no retention window is set", async () => {
		await seed(new Date());
		await pruneRetainedData(database, async () => null);

		expect((await database.select().from(activity)).length).toBe(2);
		expect((await database.select().from(notifications)).length).toBe(2);
		expect((await database.select().from(jobs)).length).toBe(3);
	});

	test("removes only rows older than the window", async () => {
		await seed(new Date());
		await pruneRetainedData(database, async () => 30);

		const remainingActivity = await database.select().from(activity);
		expect(remainingActivity).toHaveLength(1);
		expect(remainingActivity[0]?.message).toBe("recent");

		const remainingNotifications = await database.select().from(notifications);
		expect(remainingNotifications.map((n) => n.id)).toEqual(["n-recent"]);
	});

	test("deletes in batches until nothing old is left", async () => {
		const old = new Date(Date.now() - 40 * DAY_MS);
		await database.insert(activity).values(
			Array.from({ length: 5 }, (_, i) => ({
				userId: "u1",
				action: "create",
				message: `old ${i}`,
				level: "info" as const,
				createdAt: old,
			})),
		);
		await pruneRetainedData(database, async () => 30, 2);
		expect(await database.select().from(activity)).toHaveLength(0);
	});

	test("never touches copy/delete job rows, however old", async () => {
		await seed(new Date());
		await pruneRetainedData(database, async () => 30);

		const remainingJobs = await database.select().from(jobs);
		const ids = remainingJobs.map((j) => j.id);
		expect(ids).toContain("job-old-copy");
		expect(ids).not.toContain("job-old-thumbnail");
		expect(ids).toContain("job-recent-thumbnail");
	});

	test("never rejects, even if the database call throws", async () => {
		await expect(
			pruneRetainedData(database, () => {
				throw new Error("boom");
			}),
		).resolves.toBeUndefined();
	});
});
