/**
 * Prunes `activity`, `notifications` and finished `jobs` rows past the
 * admin's retention window (`effectiveRetentionDays`). Off (rows kept
 * forever) unless a window is set.
 *
 * `copy`/`delete` job rows are never touched here: they are cleaned up by the
 * caller-bound invariants in `jobs.ts` (`finishJob`, `reconcileOrphanedJobs`),
 * and a row still present past its retention window is evidence those
 * invariants have not finished with it yet. Deleting it on a timer would
 * race that machinery and could strand bytes no row points at.
 */

import { and, inArray, lt, notInArray } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import { activity, jobs, notifications } from "#lib/server/db/schema.js";
import { effectiveRetentionDays } from "./app-settings";

const logger = new Logger("RetentionSweep");
const DAY_MS = 24 * 60 * 60 * 1000;
const TERMINAL_JOB_STATUSES = ["succeeded", "failed"] as const;
const CALLER_BOUND_JOB_TYPES = ["copy", "delete"];

/** Repeats `batch` until it deletes fewer than `size` rows. */
async function inBatches(
	batch: () => Promise<unknown[]>,
	size: number,
): Promise<void> {
	for (;;) {
		if ((await batch()).length < size) {
			return;
		}
	}
}

/**
 * Never throws: a scheduled sweep failing must not take anything else down.
 * Deletes in batches, so a first run over a big table does not hold SQLite's
 * single writer for seconds.
 */
export async function pruneRetainedData(
	database: Database = getDb(),
	resolveDays: () => Promise<number | null> = effectiveRetentionDays,
	batchSize = 10_000,
): Promise<void> {
	try {
		const days = await resolveDays();
		if (!days) {
			return;
		}
		const cutoff = new Date(Date.now() - days * DAY_MS);

		await inBatches(
			() =>
				database
					.delete(activity)
					.where(
						inArray(
							activity.id,
							database
								.select({ id: activity.id })
								.from(activity)
								.where(lt(activity.createdAt, cutoff))
								.limit(batchSize),
						),
					)
					.returning({ id: activity.id }),
			batchSize,
		);
		await inBatches(
			() =>
				database
					.delete(notifications)
					.where(
						inArray(
							notifications.id,
							database
								.select({ id: notifications.id })
								.from(notifications)
								.where(lt(notifications.createdAt, cutoff))
								.limit(batchSize),
						),
					)
					.returning({ id: notifications.id }),
			batchSize,
		);
		await inBatches(
			() =>
				database
					.delete(jobs)
					.where(
						inArray(
							jobs.id,
							database
								.select({ id: jobs.id })
								.from(jobs)
								.where(
									and(
										inArray(jobs.status, [...TERMINAL_JOB_STATUSES]),
										lt(jobs.finishedAt, cutoff.getTime()),
										notInArray(jobs.type, CALLER_BOUND_JOB_TYPES),
									),
								)
								.limit(batchSize),
						),
					)
					.returning({ id: jobs.id }),
			batchSize,
		);
	} catch (error) {
		logger.warn("Retention sweep failed", error);
	}
}

const RETENTION_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const globalForRetentionSweep = globalThis as unknown as {
	__retention_sweep_timer?: ReturnType<typeof setInterval>;
};

/** Survives Vite HMR, so a hot reload doesn't stack up duplicate timers. */
export function startRetentionSweeper(): void {
	if (globalForRetentionSweep.__retention_sweep_timer) {
		return;
	}
	void pruneRetainedData();
	globalForRetentionSweep.__retention_sweep_timer = setInterval(
		() => void pruneRetainedData(),
		RETENTION_SWEEP_INTERVAL_MS,
	);
}
