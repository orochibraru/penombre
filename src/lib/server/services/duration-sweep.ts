/**
 * Fills media durations nothing else will. An upload probes off the request,
 * so a probe lost to a restart or a missing worker leaves `null` behind, and
 * the library scan only runs in simple mode and on mounted volumes. This
 * visits every root — personal drives, shared drives, volumes — that has one.
 */

import { eq } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import { files, user } from "#lib/server/db/schema.js";
import { missingDuration } from "./storage/media";

const logger = new Logger("DurationSweep");

const SWEEP_INTERVAL_MS = 60_000;

export interface Root {
	ownerId: string;
	volumeId: string | null;
}

async function serviceFor(
	database: Database,
	root: Root,
): Promise<{ probeMissingDurations(): Promise<void> } | undefined> {
	const [owner] = await database
		.select()
		.from(user)
		.where(eq(user.id, root.ownerId));
	// Lazy: these pull in the whole storage stack, which a test injecting
	// its own resolver has no use for.
	const { volumeById } = await import("./storage-for");
	const { StorageService } = await import("./storage");
	const volume = await volumeById(root.volumeId);
	// A volume since removed from the environment, or a deleted drive.
	if (!owner || volume === null) {
		return undefined;
	}
	return new StorageService(owner, volume);
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
