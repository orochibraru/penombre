/**
 * Fills media durations nothing else will. An upload probes off the request,
 * so a probe lost to a restart or a missing worker leaves `null` behind, and
 * the library scan only runs in simple mode and on mounted volumes. This
 * visits every root — personal drives, shared drives, volumes — that has one.
 */

import { Logger } from "#lib/logger.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import { files } from "#lib/server/db/schema.js";
import { missingDuration } from "./storage/media";

const logger = new Logger("DurationSweep");

const SWEEP_INTERVAL_MS = 60_000;

export interface Root {
	ownerId: string;
	volumeId: string | null;
}

async function serviceFor(
	_database: Database,
	root: Root,
): Promise<{ probeMissingDurations(): Promise<void> } | undefined> {
	// Lazy: the storage stack is heavy, and a test injects its own resolver.
	const { serviceForRoot } = await import("./storage-for");
	return serviceForRoot(root);
}

/** One batch per root, roots one after another. Never throws. */
export async function sweepMissingDurations(
	database: Database = getDb(),
	resolve: typeof serviceFor = serviceFor,
): Promise<void> {
	try {
		const roots: Root[] = await database
			.selectDistinct({ ownerId: files.ownerId, volumeId: files.volumeId })
			.from(files)
			.where(missingDuration());
		for (const root of roots) {
			await (await resolve(database, root))?.probeMissingDurations();
		}
	} catch (error) {
		logger.warn("Duration sweep failed", error);
	}
}

/** Survives Vite HMR, so a hot reload doesn't stack up duplicate timers. */
const globalForSweep = globalThis as unknown as {
	__duration_timer?: ReturnType<typeof setInterval>;
	__duration_running?: boolean;
};

export function startDurationSweeper(): void {
	if (globalForSweep.__duration_timer) {
		return;
	}
	const tick = async () => {
		// A sweep awaits its probes, which can outlast the interval.
		if (globalForSweep.__duration_running) {
			return;
		}
		globalForSweep.__duration_running = true;
		try {
			await sweepMissingDurations();
		} finally {
			globalForSweep.__duration_running = false;
		}
	};
	globalForSweep.__duration_timer = setInterval(
		() => void tick(),
		SWEEP_INTERVAL_MS,
	);
	globalForSweep.__duration_timer.unref?.();
}
