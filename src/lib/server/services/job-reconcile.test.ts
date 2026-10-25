import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";

import type { Database } from "#lib/server/db/index.js";
import * as dbModule from "#lib/server/db/index.js";
import { appInstances, jobs } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as storageFor from "#lib/server/services/storage-for.js";

import {
	reconcileOrphanedJobs,
	type Reconciler,
	startJobReconciler,
} from "./job-reconcile";
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

describe("reconcileOrphanedJobs without a resolver", () => {
	test("opens the job's root through its storage service", async () => {
		await job("orphan", {});
		const applied: unknown[] = [];
		const serviceForRoot = spyOn(
			storageFor,
			"serviceForRoot",
		).mockResolvedValue({
			getStoragePath: () => "/r",
			reconcileOrphanedJob: async (_type: string, outcome: unknown) => {
				applied.push(outcome);
				return 1;
			},
		} as never);
		try {
			await reconcileOrphanedJobs(database);
			expect(serviceForRoot).toHaveBeenCalledWith(context);
		} finally {
			serviceForRoot.mockRestore();
		}
		expect(applied).toEqual([{ copied: ["/r/x"], failed: [] }]);
		expect(await remaining()).toEqual([]);
	});

	test("a database it cannot read leaves every job alone", async () => {
		await job("orphan", {});
		const broken = {
			select: () => {
				throw new Error("database is gone");
			},
		} as unknown as Database;
		await expect(reconcileOrphanedJobs(broken)).resolves.toBeUndefined();
		expect(await remaining()).toEqual(["orphan"]);
	});
});

describe("startJobReconciler", () => {
	const timers = globalThis as unknown as {
		__reconcile_timer?: unknown;
		__reconcile_running?: boolean;
	};
	let ticks: (() => void)[];
	let applied: string[];
	const spies: { mockRestore(): void }[] = [];

	async function settled() {
		while (timers.__reconcile_running) {
			await Bun.sleep(1);
		}
	}

	beforeEach(() => {
		ticks = [];
		applied = [];
		spies.push(
			spyOn(globalThis, "setInterval").mockImplementation(((
				callback: () => void,
			) => {
				ticks.push(callback);
				return { unref: () => undefined };
			}) as never),
			spyOn(dbModule, "getDb").mockReturnValue(database),
			spyOn(storageFor, "serviceForRoot").mockResolvedValue({
				getStoragePath: () => "/r",
				reconcileOrphanedJob: async (type: string) => {
					applied.push(type);
					return 0;
				},
			} as never),
		);
	});

	afterEach(async () => {
		await settled();
		for (const spy of spies.splice(0)) {
			spy.mockRestore();
		}
		delete timers.__reconcile_timer;
		delete timers.__reconcile_running;
	});

	test("reconciles at once, then every minute, from one timer", async () => {
		await job("at-boot", {});
		startJobReconciler();
		startJobReconciler();
		await settled();
		expect(applied).toEqual(["copy"]);
		expect(ticks).toHaveLength(1);

		await job("later", { type: "delete" });
		ticks[0]?.();
		await settled();
		expect(applied).toEqual(["copy", "delete"]);
		expect(await remaining()).toEqual([]);
	});

	test("a tick while a pass is running waits for the next one", async () => {
		startJobReconciler();
		await settled();
		await job("orphan", {});
		timers.__reconcile_running = true;
		ticks[0]?.();
		timers.__reconcile_running = false;
		expect(applied).toEqual([]);
		expect(await remaining()).toEqual(["orphan"]);
	});
});
