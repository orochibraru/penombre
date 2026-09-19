import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { appInstances, jobs, workers } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import {
	adoptJob,
	awaitJob,
	beatInstance,
	disownJob,
	enqueueJob,
	failOrphanedJobs,
	finishJob,
	INSTANCE_ID,
	orphanedOutcomes,
} from "./jobs";

let database: Database;
const LONG_AGO = 0;

beforeEach(() => {
	database = migratedSqlite();
});

async function row(id: string) {
	const [job] = await database.select().from(jobs).where(eq(jobs.id, id));
	return job;
}

async function workerSeen(at: number) {
	await database.insert(workers).values({ id: "w", seenAt: at });
}

async function finish(id: string, result: unknown) {
	await database
		.update(jobs)
		.set({ status: "succeeded", result: JSON.stringify(result) })
		.where(eq(jobs.id, id));
}

describe("enqueueJob", () => {
	test("inserts a queued row with a JSON spec and a numeric priority", async () => {
		const id = await enqueueJob(
			{ type: "thumbnail", spec: { a: 1 }, priority: "background" },
			database,
		);
		expect(await row(id)).toMatchObject({
			type: "thumbnail",
			spec: '{"a":1}',
			status: "queued",
			priority: -10,
		});
	});

	test("two enqueues of one dedupe key share a job", async () => {
		const input = {
			type: "thumbnail",
			spec: {},
			dedupeKey: "k",
			priority: "background",
		} as const;
		const [a, b] = await Promise.all([
			enqueueJob(input, database),
			enqueueJob(input, database),
		]);
		expect(a).toBe(b);
		expect(await database.select().from(jobs)).toHaveLength(1);
	});

	test("an interactive request raises the queued job it joins", async () => {
		const id = await enqueueJob(
			{ type: "thumbnail", spec: {}, dedupeKey: "k", priority: "background" },
			database,
		);
		await enqueueJob(
			{ type: "thumbnail", spec: {}, dedupeKey: "k", priority: "interactive" },
			database,
		);
		expect((await row(id))?.priority).toBe(10);
	});

	test("a finished job does not absorb a new request", async () => {
		const input = {
			type: "thumbnail",
			spec: {},
			dedupeKey: "k",
			priority: "background",
		} as const;
		const first = await enqueueJob(input, database);
		await finish(first, {});
		expect(await enqueueJob(input, database)).not.toBe(first);
	});
});

describe("awaitJob", () => {
	test("returns status, error and result once it finishes", async () => {
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		setTimeout(() => void finish(id, { n: 1 }), 20);
		const job = await awaitJob(id, { database, intervalMs: 1 });
		expect(job).toEqual({
			status: "succeeded",
			error: null,
			result: '{"n":1}',
		});
	});

	test("consume deletes the row once read", async () => {
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		await finish(id, {});
		await awaitJob(id, { database, consume: true });
		expect(await row(id)).toBeUndefined();
	});

	test("a job still queued at the deadline is cancelled, so it never runs", async () => {
		await workerSeen(Date.now());
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		const job = await awaitJob(id, { database, intervalMs: 1, timeoutMs: 10 });
		expect(job).toBeUndefined();
		expect(await row(id)).toMatchObject({
			status: "failed",
			error: "timed out waiting",
		});
	});

	test("settle keeps waiting for a job that was already running", async () => {
		await workerSeen(Date.now());
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		await database
			.update(jobs)
			.set({ status: "running", heartbeatAt: Date.now() })
			.where(eq(jobs.id, id));
		setTimeout(() => void finish(id, { late: true }), 50);
		const job = await awaitJob(id, {
			database,
			intervalMs: 1,
			timeoutMs: 5,
			settle: true,
		});
		expect(job?.result).toBe('{"late":true}');
	});

	test("without settle a running job is left to finish on its own", async () => {
		await workerSeen(Date.now());
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		await database
			.update(jobs)
			.set({ status: "running", heartbeatAt: Date.now() })
			.where(eq(jobs.id, id));
		expect(
			await awaitJob(id, { database, intervalMs: 1, timeoutMs: 5 }),
		).toBeUndefined();
		expect((await row(id))?.status).toBe("running");
	});

	test("fails fast and cancels when no worker has checked in", async () => {
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		const started = Date.now();
		const job = await awaitJob(id, {
			database,
			timeoutMs: 60_000,
			bootedAt: LONG_AGO,
		});
		expect(job).toBeUndefined();
		expect(Date.now() - started).toBeLessThan(1000);
		expect(await row(id)).toMatchObject({
			status: "failed",
			error: "no worker is running",
		});
	});

	test("a running job whose worker went silent is failed", async () => {
		await workerSeen(LONG_AGO);
		const stale = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		await database
			.update(jobs)
			.set({ status: "running", heartbeatAt: LONG_AGO })
			.where(eq(jobs.id, stale));
		expect(
			await awaitJob(stale, { database, settle: true, bootedAt: LONG_AGO }),
		).toBeUndefined();
		expect((await row(stale))?.status).toBe("failed");
	});

	test("a live worker keeps the wait going", async () => {
		await workerSeen(Date.now());
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		setTimeout(() => void finish(id, {}), 30);
		const job = await awaitJob(id, {
			database,
			intervalMs: 1,
			bootedAt: LONG_AGO,
		});
		expect(job?.status).toBe("succeeded");
	});
});

describe("awaitJob, round 2", () => {
	test("cancelOnTimeout: false leaves a shared job for its other waiters", async () => {
		await workerSeen(Date.now());
		const id = await enqueueJob(
			{ type: "thumbnail", spec: {}, dedupeKey: "k", priority: "background" },
			database,
		);
		expect(
			await awaitJob(id, {
				database,
				intervalMs: 1,
				timeoutMs: 5,
				cancelOnTimeout: false,
			}),
		).toBeUndefined();
		expect((await row(id))?.status).toBe("queued");
	});

	test("under settle the deadline cancel is tried once, not every poll", async () => {
		await workerSeen(Date.now());
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		await database
			.update(jobs)
			.set({ status: "running", heartbeatAt: Date.now() })
			.where(eq(jobs.id, id));
		let updates = 0;
		const counting = new Proxy(database, {
			get(target, prop, receiver) {
				if (prop === "update") {
					updates++;
				}
				return Reflect.get(target, prop, receiver);
			},
		});
		setTimeout(() => void finish(id, {}), 60);
		await awaitJob(id, {
			database: counting,
			intervalMs: 1,
			timeoutMs: 5,
			settle: true,
		});
		expect(updates).toBe(1);
	});

	// A cold `go build` of the dev worker outlasts 30s; failing every job
	// meanwhile made the first boot scan error out.
	test("before any worker checks in, boot grace outlasts the 30s silence", async () => {
		const id = await enqueueJob(
			{ type: "t", spec: {}, priority: "mutation" },
			database,
		);
		await awaitJob(id, {
			database,
			intervalMs: 1,
			timeoutMs: 5,
			bootedAt: Date.now() - 60_000,
		});
		expect((await row(id))?.error).toBe("timed out waiting");
	});
});

describe("failOrphanedJobs", () => {
	test("fails queued caller-bound jobs from a previous run, and only those", async () => {
		const add = (
			id: string,
			type: string,
			status: string,
			heartbeatAt?: number,
		) =>
			database.insert(jobs).values({
				id,
				type,
				status,
				heartbeatAt,
				spec: '{"big":true}',
				priority: 5,
			});
		await add("queued-copy", "copy", "queued");
		await add("stale-delete", "delete", "running", LONG_AGO);
		await add("live-copy", "copy", "running", Date.now());
		await add("queued-thumb", "thumbnail", "queued");

		expect(await failOrphanedJobs(database)).toBe(1);
		expect(await row("queued-copy")).toMatchObject({
			status: "failed",
			spec: "{}",
		});
		// Its worker died mid-run: failing it here would discard what it did.
		// The next worker stops it at once and records that instead.
		expect((await row("stale-delete"))?.status).toBe("running");
		expect((await row("live-copy"))?.status).toBe("running");
		expect((await row("queued-thumb"))?.status).toBe("queued");
	});
});

describe("requester tracking", () => {
	test("every job carries the instance that enqueued it", async () => {
		const id = await enqueueJob(
			{ type: "copy", spec: {}, priority: "mutation" },
			database,
		);
		expect((await row(id))?.requestedBy).toBe(INSTANCE_ID);
	});

	test("the instance beat upserts one row", async () => {
		await beatInstance(database);
		await beatInstance(database);
		const rows = await database.select().from(appInstances);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.id).toBe(INSTANCE_ID);
		expect(Math.abs((rows[0]?.seenAt ?? 0) - Date.now())).toBeLessThan(5000);
	});

	test("failOrphanedJobs leaves this instance's own queued jobs", async () => {
		const id = await enqueueJob(
			{ type: "copy", spec: {}, priority: "mutation" },
			database,
		);
		expect(await failOrphanedJobs(database)).toBe(0);
		expect((await row(id))?.status).toBe("queued");
	});
});

describe("ownership", () => {
	// A rolling deploy: the new instance must not fail the old one's work.
	test("failOrphanedJobs leaves a live instance's queued job", async () => {
		await database
			.insert(appInstances)
			.values({ id: "other", seenAt: Date.now() });
		await database.insert(jobs).values({
			id: "theirs",
			type: "delete",
			spec: "{}",
			requestedBy: "other",
		});
		expect(await failOrphanedJobs(database)).toBe(0);
		expect((await row("theirs"))?.status).toBe("queued");
	});

	test("adopting is a compare-and-swap on the requester", async () => {
		await database.insert(jobs).values({
			id: "j",
			type: "copy",
			spec: "{}",
			requestedBy: "dead",
		});
		expect(await adoptJob("j", "someone-else", database)).toBe(false);
		expect(await adoptJob("j", "dead", database)).toBe(true);
		expect((await row("j"))?.requestedBy).toBe(INSTANCE_ID);
	});

	test("finishing only deletes a job this process still owns", async () => {
		const mine = await enqueueJob(
			{ type: "copy", spec: {}, priority: "mutation" },
			database,
		);
		await database
			.update(jobs)
			.set({ requestedBy: "adopted-by-other" })
			.where(eq(jobs.id, mine));
		expect(await finishJob(mine, database)).toBe(false);
		expect(await row(mine)).toBeDefined();
	});

	test("disowning hands the job to the reconciler", async () => {
		const id = await enqueueJob(
			{ type: "delete", spec: {}, priority: "mutation" },
			database,
		);
		await disownJob(id, database);
		expect((await row(id))?.requestedBy).toBe("disowned");
	});

	// A dev HMR reload re-evaluates the module; the heartbeat, guarded on
	// globalThis, would keep beating the old id while jobs carry a new one.
	test("the instance id survives the module being re-evaluated", () => {
		expect(
			(globalThis as { __penombre_instance?: string }).__penombre_instance,
		).toBe(INSTANCE_ID);
	});

	test("a failed copy/delete keeps its spec as the record, others drop it", async () => {
		await database.insert(jobs).values([
			{ id: "c", type: "copy", spec: '{"pairs":[1]}' },
			{ id: "t", type: "thumbnail", spec: '{"x":1}' },
		]);
		await awaitJob("c", { database, timeoutMs: 0, intervalMs: 1 });
		await awaitJob("t", { database, timeoutMs: 0, intervalMs: 1 });
		expect(await row("c")).toMatchObject({
			result: '{"pairs":[1]}',
			spec: "{}",
		});
		expect(await row("t")).toMatchObject({ result: null, spec: "{}" });
	});

	// Adopted away during a pause, then disowned back: ownership returns to
	// this process's id while it is still applying. Its own reconciler must
	// not take the job and delete bytes the apply is about to rely on.
	test("a job this process is applying is never offered to its reconciler", async () => {
		const id = await enqueueJob(
			{ type: "copy", spec: {}, priority: "mutation" },
			database,
		);
		await finish(id, {});
		await awaitJob(id, { database });
		await database
			.update(jobs)
			.set({ requestedBy: "disowned" })
			.where(eq(jobs.id, id));
		expect(await orphanedOutcomes(database)).toEqual([]);

		await disownJob(id, database);
		expect((await orphanedOutcomes(database)).map((o) => o.id)).toEqual([id]);
	});
});
