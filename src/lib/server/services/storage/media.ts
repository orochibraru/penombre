/**
 * Media duration, read by the Go `media-probe` job (ffprobe) rather than
 * `music-metadata` in-process.
 *
 * Never on a request path: the upload records its row first and the duration
 * lands when the job does. `null` means "not known yet", which the periodic
 * sweep (`duration-sweep.ts`) retries on every drive; `0` means ffprobe read
 * the file and it has none.
 */

import { join } from "node:path";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { FileCategoryEnum } from "#lib/file-helpers.js";
import { Logger } from "#lib/logger.js";
import { files } from "#lib/server/db/schema.js";
import { awaitJob, enqueueJob } from "#lib/server/services/jobs.js";
import type { StorageContext } from "./context";
import { ownedFiles } from "./scope";

const logger = new Logger("StorageMedia");

const PROBE_TIMEOUT_MS = 30 * 60_000;

const MUSIC: string = FileCategoryEnum.MUSIC;

/** Durations probed per root per sweep; the next sweep carries on. */
const PROBE_BATCH = 500;

export interface MediaRow {
	id: string;
	path: string;
	category: string;
	/** The bytes this probe is for; a later upload makes its result stale. */
	updatedAt: Date;
}

/** Playable rows whose duration is not known yet. */
export const missingDuration = () =>
	or(
		and(
			eq(files.category, FileCategoryEnum.MUSIC),
			isNull(files.musicDuration),
		),
		and(
			eq(files.category, FileCategoryEnum.VIDEO),
			isNull(files.videoDuration),
		),
	);

/**
 * Durations in seconds by absolute path. A path absent from the map is
 * unknown (the job never ran), not zero.
 */
export async function probeDurations(
	paths: string[],
	dedupeKey?: string,
): Promise<Map<string, number>> {
	const id = await enqueueJob({
		type: "media-probe",
		spec: { paths },
		dedupeKey,
		priority: "mutation",
	});
	const job = await awaitJob(id, {
		timeoutMs: PROBE_TIMEOUT_MS,
		consume: true,
	});
	if (job?.status !== "succeeded" || !job.result) {
		return new Map();
	}
	const { durations } = JSON.parse(job.result) as {
		durations: Record<string, number>;
	};
	return new Map(Object.entries(durations));
}

/** Probes `rows` and writes what came back. Never throws. */
export async function recordDurations(
	ctx: StorageContext,
	rows: MediaRow[],
	dedupeKey?: string,
): Promise<void> {
	try {
		const durations = await probeDurations(
			rows.map((row) => join(ctx.storagePath, row.path)),
			dedupeKey,
		);
		for (const row of rows) {
			const duration = durations.get(join(ctx.storagePath, row.path));
			if (duration === undefined) {
				continue;
			}
			await ctx.db
				.update(files)
				.set(
					// Kept: a probe is not a modification, and `$onUpdate` would
					// bump it and reorder "last modified" listings.
					row.category === MUSIC
						? { musicDuration: duration, updatedAt: row.updatedAt }
						: { videoDuration: duration, updatedAt: row.updatedAt },
				)
				.where(
					and(
						eq(files.id, row.id),
						eq(files.updatedAt, row.updatedAt),
						ownedFiles(ctx),
					),
				);
		}
	} catch (error) {
		logger.warn(
			`Failed to record media durations for ${rows.length} file(s)`,
			error,
		);
	}
}

/**
 * Probes one batch of this root's media rows with no duration yet. Random
 * order, so rows that keep failing cannot starve the rest; one dedupe key per
 * root, so overlapping sweeps join one job.
 */
export async function probeMissingDurations(
	ctx: StorageContext,
): Promise<void> {
	const rows: MediaRow[] = await ctx.db
		.select({
			id: files.id,
			path: files.path,
			category: files.category,
			updatedAt: files.updatedAt,
		})
		.from(files)
		.where(and(ownedFiles(ctx), missingDuration()))
		.orderBy(sql`random()`)
		.limit(PROBE_BATCH);
	if (rows.length > 0) {
		await recordDurations(ctx, rows, `media-probe:${ctx.storagePath}`);
	}
}
