import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "#lib/server/db/index.js";
import { appInstances, jobs } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { type Reconciler, reconcileOrphanedJobs } from "./job-reconcile";
import { INSTANCE_ID } from "./jobs";

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

	// It could be awaiting the job or writing its rows right now; deleting
	// "orphan" bytes then would lose the copy a move is about to rely on.
	test("never touches this process's own jobs, however old", async () => {
		await job("mine", { requestedBy: INSTANCE_ID, finishedAt: 0 });
		const { applied, resolve } = recorder();
		await reconcileOrphanedJobs(database, resolve);
		expect(applied).toEqual([]);
		expect(await remaining()).toEqual(["mine"]);
	});

	test("a disowned job and a legacy one with no requester are applied", async () => {
		await job("disowned", { requestedBy: "disowned" });
		await job("legacy", { requestedBy: null });
		const { applied, resolve } = recorder();
		await reconcileOrphanedJobs(database, resolve);
		expect(applied).toEqual(["copy", "copy"]);
		expect(await remaining()).toEqual([]);
	});

	// Enqueued before results carried a context: nothing maps it to rows.
	test("a result with no context is dropped, not applied", async () => {
		await job("old", {
			requestedBy: null,
			result: JSON.stringify({ copied: [] }),
		});
		const { applied, resolve } = recorder();
		await reconcileOrphanedJobs(database, resolve);
		expect(applied).toEqual([]);
		expect(await remaining()).toEqual([]);
	});

	test("a root that moved is not applied, and the record is dropped", async () => {
		await job("moved", {});
		const { applied, resolve } = recorder("/elsewhere");
		await reconcileOrphanedJobs(database, resolve);
		expect(applied).toEqual([]);
		expect(await remaining()).toEqual([]);
	});

	test("a job that fails to apply is disowned for the next pass", async () => {
		await job("flaky", {});
		await reconcileOrphanedJobs(database, async () => ({
			getStoragePath: () => "/r",
			reconcileOrphanedJob: async () => {
				throw new Error("db down");
			},
		}));
		expect(await remaining()).toEqual(["flaky"]);
		const [row] = await database.select().from(jobs);
		expect(row?.requestedBy).toBe("disowned");
	});

	// Failed before it could report (no worker, a crash loop): its spec is
	// the record, read as "anything may have happened", checked on disk.
	test("a spec-shaped record is read as every path possibly touched", async () => {
		await job("copy-spec", {
			result: JSON.stringify({
				pairs: [{ source: "/s", dest: "/r/a" }],
				context,
			}),
		});
		await job("delete-spec", {
			type: "delete",
			result: JSON.stringify({ files: ["/r/b"], dirs: ["/r/d"], context }),
		});
		const seen: unknown[] = [];
		await reconcileOrphanedJobs(database, async () => ({
			getStoragePath: () => "/r",
			reconcileOrphanedJob: async (_type, outcome) => {
				seen.push(outcome);
				return 0;
			},
		}));
		expect(seen).toContainEqual({ copied: [], failed: [{ dest: "/r/a" }] });
		expect(seen).toContainEqual({ deleted: ["/r/b"], deletedDirs: ["/r/d"] });
	});
});
