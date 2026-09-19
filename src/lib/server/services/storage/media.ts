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
import { and, eq, isNull, notInArray, or, sql } from "drizzle-orm";
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
): Promise<
	{ durations: Map<string, number>; probed: Set<string> } | undefined
> {
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
		return undefined;
	}
	const { durations, probed = [] } = JSON.parse(job.result) as {
		durations: Record<string, number>;
		probed?: string[];
	};
	return {
		durations: new Map(Object.entries(durations)),
		probed: new Set(probed),
	};
}

/**
 * Probes `rows` and writes what came back. Never throws. Returns the ids the
 * probe ran on and could not read — not ones it never reached (no worker).
 */
export async function recordDurations(
	ctx: StorageContext,
	rows: MediaRow[],
	dedupeKey?: string,
): Promise<string[]> {
	const unread: string[] = [];
	try {
		const outcome = await probeDurations(
			rows.map((row) => join(ctx.storagePath, row.path)),
			dedupeKey,
		);
		if (!outcome) {
			return [];
		}
		for (const row of rows) {
			const path = join(ctx.storagePath, row.path);
			const duration = outcome.durations.get(path);
			if (duration === undefined) {
				// Only what ffprobe actually ran on: a joined job may have
				// probed another batch.
				if (outcome.probed.has(path)) {
					unread.push(row.id);
				}
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
	return unread;
}

/**
 * Rows ffprobe could not read, and when to try again: doubling from a
 * minute to a day. In memory on purpose — a restart retrying them all once
 * is the right amount of "transient failures are retried".
 */
const backoff = new Map<string, { at: number; delay: number }>();
const MAX_BACKOFF_MS = 24 * 60 * 60_000;
/** Backed-off ids excluded in SQL, so they cannot fill the batch. */
const MAX_EXCLUDED = 5000;

/** Ids waiting out a backoff; entries long overdue are forgotten. */
function backedOff(now: number): string[] {
	const waiting: string[] = [];
	for (const [id, entry] of backoff) {
		if (entry.at > now) {
			waiting.push(id);
		} else if (entry.at < now - MAX_BACKOFF_MS) {
			// Due a day ago and never retried: deleted, or filled elsewhere.
			backoff.delete(id);
		}
	}
	return waiting.slice(0, MAX_EXCLUDED);
}

/**
 * Probes one batch of this root's media rows with no duration yet. Random
 * order, so rows that keep failing cannot starve the rest; one dedupe key per
 * root, so overlapping sweeps join one job.
 */
export async function probeMissingDurations(
	ctx: StorageContext,
): Promise<void> {
	const now = Date.now();
	const waiting = backedOff(now);
	const rows: MediaRow[] = await ctx.db
		.select({
			id: files.id,
			path: files.path,
			category: files.category,
			updatedAt: files.updatedAt,
		})
		.from(files)
		.where(
			and(
				ownedFiles(ctx),
				missingDuration(),
				waiting.length > 0 ? notInArray(files.id, waiting) : undefined,
			),
		)
		.orderBy(sql`random()`)
		.limit(PROBE_BATCH);
	const due = rows.filter((row) => (backoff.get(row.id)?.at ?? 0) <= now);
	if (due.length === 0) {
		return;
	}
	const unread = new Set(
		await recordDurations(ctx, due, `media-probe:${ctx.storagePath}`),
	);
	for (const row of due) {
		if (unread.has(row.id)) {
			const delay = Math.min(
				(backoff.get(row.id)?.delay ?? 30_000) * 2,
				MAX_BACKOFF_MS,
			);
			backoff.set(row.id, { at: now + delay, delay });
		} else {
			backoff.delete(row.id);
		}
	}
}
