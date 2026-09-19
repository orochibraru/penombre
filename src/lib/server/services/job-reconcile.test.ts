import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "#lib/server/db/index.js";
import { appInstances, jobs } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { type Reconciler, reconcileOrphanedJobs } from "./job-reconcile";

let database: Database;
const now = Date.now();
const context = { root: "/r", ownerId: "u1", volumeId: null };

async function job(
	id: string,
	values: Partial<typeof jobs.$inferInsert> & { result?: unknown },
) {
	await database.insert(jobs).values({
		id,
		type: "copy",
		status: "succeeded",
		spec: "{}",
		requestedBy: "dead-app",
		finishedAt: now,
		...values,
		result:
			values.result === undefined
				? JSON.stringify({ copied: ["/r/x"], failed: [], context })
				: (values.result as string | null),
	});
}

async function remaining() {
	const rows = await database.select({ id: jobs.id }).from(jobs);
	return rows.map((r) => r.id).toSorted();
}

function recorder(root = "/r") {
	const applied: string[] = [];
	const resolve = async (): Promise<Reconciler> => ({
		getStoragePath: () => root,
		reconcileOrphanedJob: async (type) => {
			applied.push(type);
			return 1;
		},
	});
	return { applied, resolve };
}

beforeEach(async () => {
	database = migratedSqlite();
	await database.insert(appInstances).values([
		{ id: "live-app", seenAt: now },
		{ id: "dead-app", seenAt: now - 120_000 },
	]);
});

describe("reconcileOrphanedJobs", () => {
	test("applies and drops finished copy/delete jobs whose requester is gone", async () => {
		await job("orphan-copy", {});
		await job("orphan-delete", {
			type: "delete",
			result: JSON.stringify({ deleted: [], deletedDirs: [], context }),
		});
		await job("live", { requestedBy: "live-app" });
		await job("running", { status: "running", result: null });
		await job("thumb", { type: "thumbnail" });
		const { applied, resolve } = recorder();

		await reconcileOrphanedJobs(database, resolve);

		expect(applied.toSorted()).toEqual(["copy", "delete"]);
		expect(await remaining()).toEqual(["live", "running", "thumb"]);
	});

	// It deletes the row only once its rows are written: one still here long
	// after finishing means it died mid-apply, even if the process lives on.
	test("a live requester's job left for ten minutes is applied too", async () => {
		await job("stuck", {
			requestedBy: "live-app",
			finishedAt: now - 11 * 60_000,
		});
		const { applied, resolve } = recorder();
		await reconcileOrphanedJobs(database, resolve);
		expect(applied).toEqual(["copy"]);
	});

	test("a root that moved is not applied, and the record is dropped", async () => {
		await job("moved", {});
		const { applied, resolve } = recorder("/elsewhere");
		await reconcileOrphanedJobs(database, resolve);
		expect(applied).toEqual([]);
		expect(await remaining()).toEqual([]);
	});

	test("a job that fails to apply is kept for the next pass", async () => {
		await job("flaky", {});
		await reconcileOrphanedJobs(database, async () => ({
			getStoragePath: () => "/r",
			reconcileOrphanedJob: async () => {
				throw new Error("db down");
			},
		}));
		expect(await remaining()).toEqual(["flaky"]);
	});
});
