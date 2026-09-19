/**
 * Applies copy/delete outcomes whose requester died before it could — an
 * app restarted while an external worker finished the job, or died between
 * reading the outcome and writing its rows. Runs at boot and every minute,
 * since a requester only counts as gone once its heartbeat is 30s stale.
 */

import { Logger } from "#lib/logger.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import { adoptJob, disownJob, finishJob, orphanedOutcomes } from "./jobs";
import type { CopyResult, DeleteResult } from "./storage/reconcile";
import type { JobContext } from "./storage/scope";

const logger = new Logger("JobReconcile");

const RECONCILE_INTERVAL_MS = 60_000;

/**
 * A result, or — for a job failed before it could report — its spec. Every
 * path of a spec may have been touched, so it reads as "all copies may have
 * landed, all deletes may have happened"; the reconcilers check rows and
 * disk before acting on either.
 */
type JobRecord = Partial<CopyResult & DeleteResult> & {
	context?: JobContext;
	pairs?: { dest: string }[];
	files?: string[];
	dirs?: string[];
};

function asOutcome(type: string, record: JobRecord): CopyResult | DeleteResult {
	return type === "copy"
		? {
				copied: record.copied ?? [],
				failed:
					record.failed ??
					(record.pairs ?? []).map((pair) => ({ dest: pair.dest })),
			}
		: {
				deleted: record.deleted ?? record.files ?? [],
				deletedDirs: record.deletedDirs ?? record.dirs ?? [],
			};
}

export interface Reconciler {
	getStoragePath(): string;
	reconcileOrphanedJob(
		type: string,
		result: CopyResult | DeleteResult,
	): Promise<number>;
}

async function serviceFor(
	context: JobContext,
): Promise<Reconciler | undefined> {
	// Lazy: the storage stack is heavy, and a test injects its own resolver.
	const { serviceForRoot } = await import("./storage-for");
	return serviceForRoot(context);
}

/**
 * Never throws. Each job is adopted first (a compare-and-swap on its
 * requester), so a requester back from a pause and a second reconciler never
 * apply it at the same time as this one. A job that cannot be applied is
 * disowned again for the next pass. A legacy job with no context (enqueued
 * before results carried one) cannot be mapped back to rows and is dropped.
 */
export async function reconcileOrphanedJobs(
	database: Database = getDb(),
	resolve: (
		context: JobContext,
	) => Promise<Reconciler | undefined> = serviceFor,
): Promise<void> {
	let outcomes: Awaited<ReturnType<typeof orphanedOutcomes>>;
	try {
		outcomes = await orphanedOutcomes(database);
	} catch (error) {
		logger.warn("Could not list orphaned jobs", error);
		return;
	}
	for (const { id, type, result, requestedBy } of outcomes) {
		if (!(await adoptJob(id, requestedBy, database))) {
			continue;
		}
		try {
			const parsed = JSON.parse(result) as JobRecord;
			const service = parsed.context && (await resolve(parsed.context));
			// A root that moved would map these paths to the wrong rows.
			if (service && service.getStoragePath() === parsed.context?.root) {
				const removed = await service.reconcileOrphanedJob(
					type,
					asOutcome(type, parsed),
				);
				logger.info(`Applied orphaned ${type} job ${id}: ${removed} removed`);
			} else {
				logger.error(
					`Orphaned ${type} job ${id} names a root that no longer exists; dropping it`,
				);
			}
			await finishJob(id, database);
		} catch (error) {
			logger.error(`Could not apply orphaned ${type} job ${id}`, error);
			await disownJob(id, database).catch(() => undefined);
		}
	}
}

const globalForReconcile = globalThis as unknown as {
	__reconcile_timer?: ReturnType<typeof setInterval>;
	__reconcile_running?: boolean;
};

export function startJobReconciler(): void {
	if (globalForReconcile.__reconcile_timer) {
		return;
	}
	const tick = async () => {
		if (globalForReconcile.__reconcile_running) {
			return;
		}
		globalForReconcile.__reconcile_running = true;
		try {
			await reconcileOrphanedJobs();
		} finally {
			globalForReconcile.__reconcile_running = false;
		}
	};
	void tick();
	globalForReconcile.__reconcile_timer = setInterval(
		() => void tick(),
		RECONCILE_INTERVAL_MS,
	);
	globalForReconcile.__reconcile_timer.unref?.();
}
