import { randomUUID } from "node:crypto";
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { isSqliteDialect } from "#lib/server/db/dialect.js";
import { type Database, db } from "#lib/server/db/index.js";
import { type Job, jobs, workers } from "#lib/server/db/schema.js";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type JobOutcome = Pick<Job, "status" | "error" | "result">;

const logger = new Logger("Jobs");

const PENDING: JobStatus[] = ["queued", "running"];

/**
 * Claim order. Someone waiting on screen beats data being moved, which beats
 * warming caches nobody asked for yet.
 */
const PRIORITIES = { interactive: 10, mutation: 5, background: -10 } as const;

export type JobPriority = keyof typeof PRIORITIES;

/** A worker stamps `workers.seen_at` every 5s; this long without one is dead. */
const WORKER_SILENCE_MS = 30_000;
/** Matches the worker's lease: a running job this stale has lost its worker. */
const LEASE_MS = 60_000;
const LIVENESS_CHECK_MS = 5000;
const bootedAt = Date.now();
let warnedAt = 0;

export async function enqueueJob(
	input: {
		type: string;
		spec: unknown;
		dedupeKey?: string;
		priority: JobPriority;
	},
	database: Database = db,
): Promise<string> {
	const priority = PRIORITIES[input.priority];
	// Retried only when the pending job we collided with finished in between.
	for (let attempt = 0; attempt < 3; attempt++) {
		const id = randomUUID();
		const inserted = await database
			.insert(jobs)
			.values({
				id,
				type: input.type,
				spec: JSON.stringify(input.spec),
				dedupeKey: input.dedupeKey,
				priority,
			})
			.onConflictDoNothing()
			.returning({ id: jobs.id });
		if (inserted.length > 0 || !input.dedupeKey) {
			return id;
		}
		const [pending] = await database
			.select({ id: jobs.id })
			.from(jobs)
			.where(
				and(eq(jobs.dedupeKey, input.dedupeKey), inArray(jobs.status, PENDING)),
			)
			.limit(1);
		if (pending) {
			await database
				.update(jobs)
				.set({ priority })
				.where(
					and(
						eq(jobs.id, pending.id),
						eq(jobs.status, "queued"),
						lt(jobs.priority, priority),
					),
				);
			return pending.id;
		}
	}
	throw new Error(`Could not enqueue ${input.type} job ${input.dedupeKey}`);
}

/**
 * The database's clock, in epoch ms. Every timestamp one process writes and
 * another compares (`seen_at`, `heartbeat_at`) is stamped and compared with
 * it, so an external worker on a host with a drifting clock is not "dead".
 */
const dbNow = isSqliteDialect()
	? sql`cast((julianday('now') - 2440587.5) * 86400000 as integer)`
	: sql`(extract(epoch from clock_timestamp()) * 1000)::bigint`;

/**
 * Before any worker has checked in since boot, give it up to this long: a
 * cold `go build` of the embedded dev worker takes minutes, not seconds.
 */
const BOOT_GRACE_MS = 5 * 60_000;
/** The boot a worker was last seen after; grace ends with the first one. */
let sawWorkerAfter: number | undefined;

async function workerAlive(
	database: Database,
	now: number,
	since: number,
): Promise<boolean> {
	const [row] = await database
		.select({
			alive: sql<unknown>`coalesce(max(${workers.seenAt}), 0) >= ${dbNow} - ${WORKER_SILENCE_MS}`,
		})
		.from(workers);
	if (row?.alive === true || Number(row?.alive) === 1) {
		sawWorkerAfter = since;
		return true;
	}
	return sawWorkerAfter !== since && now - since < BOOT_GRACE_MS;
}

/** A running job whose worker stopped heartbeating a lease ago. */
const staleLease = () =>
	and(
		eq(jobs.status, "running"),
		lt(jobs.heartbeatAt, sql`${dbNow} - ${LEASE_MS}`),
	);

/** Nobody will run it: its spec (possibly MBs) goes with it. */
const failed = (reason: string) => ({
	status: "failed",
	error: reason,
	finishedAt: dbNow,
	workerId: null,
	spec: "{}",
});

/** Fails a job no worker will touch; true when it did. */
async function abandon(
	database: Database,
	id: string,
	reason: string,
	orStaleRunning: boolean,
): Promise<boolean> {
	const notStarted = eq(jobs.status, "queued");
	const cancelled = await database
		.update(jobs)
		.set(failed(reason))
		.where(
			and(
				eq(jobs.id, id),
				orStaleRunning ? or(notStarted, staleLease()) : notStarted,
			),
		)
		.returning({ id: jobs.id });
	return cancelled.length > 0;
}

/**
 * Job types whose caller writes rows from the outcome. Run with nobody
 * awaiting, they leave bytes no row points at (copy) or rows whose bytes are
 * gone (delete). Mirrors `callerBound` in `internal/worker/worker.go`.
 */
const CALLER_BOUND = ["copy", "delete"];

/**
 * At boot, before a worker starts: every caller-bound job not actively
 * running belonged to a request that died with the last process. Returns how
 * many were failed.
 */
export async function failOrphanedJobs(
	database: Database = db,
): Promise<number> {
	const orphaned = await database
		.update(jobs)
		.set(failed("its caller is gone (the app restarted)"))
		.where(
			and(
				inArray(jobs.type, CALLER_BOUND),
				or(eq(jobs.status, "queued"), staleLease()),
			),
		)
		.returning({ id: jobs.id });
	if (orphaned.length > 0) {
		logger.warn(
			`Failed ${orphaned.length} copy/delete job(s) left by a previous run`,
		);
	}
	return orphaned.length;
}

/**
 * Waits for a job to finish; `undefined` when there is no outcome. A job
 * still queued at the deadline, or left with no live worker, is cancelled
 * first, so it never runs behind the caller's back — unless
 * `cancelOnTimeout: false`, for jobs other callers may have joined.
 *
 * One already running at the deadline may still land. `settle` keeps waiting
 * for it — required when the caller mutates rows from the outcome (copy,
 * delete) — bounded by worker liveness and the worker's per-job timeout
 * rather than this clock. `consume` deletes the row once read, for
 * result-heavy jobs nobody else awaits.
 */
export async function awaitJob(
	id: string,
	options: {
		timeoutMs?: number;
		intervalMs?: number;
		database?: Database;
		settle?: boolean;
		consume?: boolean;
		cancelOnTimeout?: boolean;
		/** Workers get a grace period after this; tests move it back. */
		bootedAt?: number;
	} = {},
): Promise<JobOutcome | undefined> {
	const {
		timeoutMs = 30_000,
		intervalMs = 100,
		database = db,
		settle = false,
		consume = false,
		cancelOnTimeout = true,
		bootedAt: since = bootedAt,
	} = options;
	const deadline = Date.now() + timeoutMs;
	let checkedAt = 0;
	let pastDeadline = false;
	for (;;) {
		const [row] = await database
			.select({ status: jobs.status })
			.from(jobs)
			.where(eq(jobs.id, id))
			.limit(1);
		if (!row) {
			return undefined;
		}
		if (row.status === "succeeded" || row.status === "failed") {
			const [outcome] = await database
				.select({ status: jobs.status, error: jobs.error, result: jobs.result })
				.from(jobs)
				.where(eq(jobs.id, id))
				.limit(1);
			if (consume) {
				await database.delete(jobs).where(eq(jobs.id, id));
			}
			return outcome;
		}

		const now = Date.now();
		if (now - checkedAt >= LIVENESS_CHECK_MS) {
			checkedAt = now;
			if (
				!(await workerAlive(database, now, since)) &&
				(await abandon(database, id, "no worker is running", true))
			) {
				if (now - warnedAt > 60_000) {
					warnedAt = now;
					logger.error(
						"No background worker has checked in for 30s, so jobs cannot run. " +
							"With WORKER_MODE=external, start a penombre-worker container on " +
							"this database; with WORKER_MODE=embedded, see the worker's own log.",
					);
				}
				return undefined;
			}
		}
		// Once only: under `settle` this loop can run for a long time.
		if (now >= deadline && !pastDeadline) {
			pastDeadline = true;
			const cancelled =
				cancelOnTimeout &&
				(await abandon(database, id, "timed out waiting", false));
			if (cancelled || !settle) {
				return undefined;
			}
		}
		await Bun.sleep(intervalMs);
	}
}
