import { randomUUID } from "node:crypto";
import {
	and,
	eq,
	inArray,
	isNotNull,
	isNull,
	lt,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { isSqliteDialect } from "#lib/server/db/dialect.js";
import { type Database, db } from "#lib/server/db/index.js";
import {
	appInstances,
	type Job,
	jobs,
	workers,
} from "#lib/server/db/schema.js";

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

/**
 * This process, as a requester. Stamped on every job it enqueues and
 * heartbeated in `app_instances`, so a worker can stop a copy or delete whose
 * requester died, and a later process can apply what it did.
 */
/**
 * Caller-bound jobs this process has read an outcome for and not yet
 * finished or disowned. Ownership can come back to `INSTANCE_ID` while it is
 * still applying one — adopted away during a pause, then disowned back — so
 * the reconciler here skips these, not only its own id. On `globalThis` for
 * the same reason as the id.
 */
const applying: Set<string> = ((
	globalThis as { __penombre_applying?: Set<string> }
).__penombre_applying ??= new Set());

export const INSTANCE_ID: string = ((
	globalThis as { __penombre_instance?: string }
).__penombre_instance ??= randomUUID());

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
				requestedBy: INSTANCE_ID,
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

/**
 * Nobody will run it: its spec (possibly MBs) goes with it — except a
 * copy/delete's, which becomes its result. It may have run part-way, and
 * those paths are what the requester or the reconciler checks on disk.
 */
const failed = (reason: string) => ({
	status: "failed",
	error: reason,
	finishedAt: dbNow,
	workerId: null,
	result: sql`case when ${jobs.type} in ('copy', 'delete') then ${jobs.spec} end`,
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
 * Nobody alive will apply this job's outcome: no requester (legacy), a
 * disowned one, or one silent for 30s. Never this process's own — it is
 * either awaiting the job or applying it.
 */
const requesterGone = () =>
	or(
		isNull(jobs.requestedBy),
		and(
			ne(jobs.requestedBy, INSTANCE_ID),
			sql`not exists (select 1 from ${appInstances} where ${appInstances.id} = ${jobs.requestedBy} and ${appInstances.seenAt} >= ${dbNow} - ${WORKER_SILENCE_MS})`,
		),
	);

/**
 * At boot, before a worker starts: a queued caller-bound job whose requester
 * is gone never started, so failing it loses nothing. A live instance's
 * queued job is its own business. One that was running is left alone: a
 * worker stops it at its next item and records what it did, which
 * `reconcileOrphanedJobs` applies — failing it here would throw that record
 * away. Returns how many were failed.
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
				eq(jobs.status, "queued"),
				requesterGone(),
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
				.select({
					type: jobs.type,
					status: jobs.status,
					error: jobs.error,
					result: jobs.result,
				})
				.from(jobs)
				.where(eq(jobs.id, id))
				.limit(1);
			if (consume) {
				await database.delete(jobs).where(eq(jobs.id, id));
			}
			if (!outcome) {
				return undefined;
			}
			if (CALLER_BOUND.includes(outcome.type)) {
				applying.add(id);
			}
			return {
				status: outcome.status,
				error: outcome.error,
				result: outcome.result,
			};
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

/** Upserts this process's liveness row, on the database's clock. */
export async function beatInstance(database: Database = db): Promise<void> {
	await database
		.insert(appInstances)
		.values({ id: INSTANCE_ID, seenAt: dbNow })
		.onConflictDoUpdate({ target: appInstances.id, set: { seenAt: dbNow } });
}

const globalForBeat = globalThis as unknown as {
	__instance_beat?: ReturnType<typeof setInterval>;
};

/** First beat awaited, so no job is enqueued by an instance nobody sees. */
export async function startInstanceBeat(): Promise<void> {
	await beatInstance();
	if (globalForBeat.__instance_beat) {
		return;
	}
	globalForBeat.__instance_beat = setInterval(() => {
		beatInstance().catch((error: unknown) => {
			logger.warn("Instance heartbeat failed", error);
		});
	}, 5000);
	globalForBeat.__instance_beat.unref?.();
}

/** Finished copy/delete jobs whose outcome nobody alive will apply. */
export async function orphanedOutcomes(
	database: Database = db,
): Promise<
	{ id: string; type: string; result: string; requestedBy: string | null }[]
> {
	const rows = await database
		.select({
			id: jobs.id,
			type: jobs.type,
			result: jobs.result,
			requestedBy: jobs.requestedBy,
		})
		.from(jobs)
		.where(
			and(
				inArray(jobs.type, CALLER_BOUND),
				inArray(jobs.status, ["succeeded", "failed"]),
				isNotNull(jobs.result),
				requesterGone(),
			),
		);
	return rows.flatMap((row) =>
		row.result === null || applying.has(row.id)
			? []
			: [{ ...row, result: row.result }],
	);
}

/**
 * Takes an orphan over, only if nobody else did since it was read: a
 * requester back from a pause, or another instance's reconciler.
 */
export async function adoptJob(
	id: string,
	requestedBy: string | null,
	database: Database = db,
): Promise<boolean> {
	const adopted = await database
		.update(jobs)
		.set({ requestedBy: INSTANCE_ID })
		.where(
			and(
				eq(jobs.id, id),
				requestedBy === null
					? isNull(jobs.requestedBy)
					: eq(jobs.requestedBy, requestedBy),
			),
		)
		.returning({ id: jobs.id });
	return adopted.length > 0;
}

/**
 * The owner's receipt: its outcome is fully applied. False means someone
 * adopted the job meanwhile — this process was taken for dead — and the
 * caller must check what it applied still holds.
 */
export async function finishJob(
	id: string,
	database: Database = db,
): Promise<boolean> {
	const finished = await database
		.delete(jobs)
		.where(and(eq(jobs.id, id), eq(jobs.requestedBy, INSTANCE_ID)))
		.returning({ id: jobs.id });
	applying.delete(id);
	return finished.length > 0;
}

/** Applying failed half-way: hand the job to the reconciler at once. */
export async function disownJob(
	id: string,
	database: Database = db,
): Promise<void> {
	await database
		.update(jobs)
		.set({ requestedBy: "disowned" })
		.where(and(eq(jobs.id, id), eq(jobs.requestedBy, INSTANCE_ID)));
	applying.delete(id);
}
