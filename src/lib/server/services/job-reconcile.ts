/**
 * Applies copy/delete outcomes whose requester died before it could — an
 * app restarted while an external worker finished the job, or died between
 * reading the outcome and writing its rows. Runs at boot and every minute,
 * since a requester only counts as gone once its heartbeat is 30s stale.
 */

import { Logger } from "#lib/logger.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import { deleteJob, orphanedOutcomes } from "./jobs";
import type { CopyResult, DeleteResult } from "./storage/reconcile";
import type { JobContext } from "./storage/scope";

const logger = new Logger("JobReconcile");

const RECONCILE_INTERVAL_MS = 60_000;

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

/** Never throws; a job that cannot be applied is logged and kept. */
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
	for (const { id, type, result } of outcomes) {
		try {
			const parsed = JSON.parse(result) as (CopyResult | DeleteResult) & {
				context?: JobContext;
			};
			const service = parsed.context && (await resolve(parsed.context));
			// A root that moved would map these paths to the wrong rows.
			if (service && service.getStoragePath() === parsed.context?.root) {
				const removed = await service.reconcileOrphanedJob(type, parsed);
				logger.info(`Applied orphaned ${type} job ${id}: ${removed} removed`);
			} else {
				logger.error(
					`Orphaned ${type} job ${id} names a root that no longer exists; dropping it`,
				);
			}
			await deleteJob(id, database);
		} catch (error) {
			logger.error(`Could not apply orphaned ${type} job ${id}`, error);
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
