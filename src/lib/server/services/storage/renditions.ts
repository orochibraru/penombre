/**
 * Lower renditions of a video: an H.264 MP4 the Go worker renders on demand
 * into `.thumbnails/`, where a file's other renders already live and die with
 * it. They are what plays when the original's format (AVI, WMV) or bitrate
 * (a phone's 4K over a home uplink) will not.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { files } from "#lib/server/db/schema.js";
import { awaitJob, enqueueJob } from "#lib/server/services/jobs.js";
import type { StorageContext } from "./context";
import { ownedFiles } from "./scope";

/** A fixed ladder, like thumbnail sizes: the cache stays bounded. */
export const RENDITION_HEIGHTS = [720, 480] as const;
export type RenditionHeight = (typeof RENDITION_HEIGHTS)[number];

export interface RenditionState {
	status: "ready" | "preparing" | "failed" | "unavailable";
	error?: string;
}

export class RenditionService {
	constructor(
		private readonly ctx: StorageContext,
		/** The job queue; a test hands in its own. */
		private readonly queue = { enqueueJob, awaitJob },
	) {}

	/** Where a rendition sits, as a key the storage driver can open. */
	key(fileKey: string, height: RenditionHeight): string {
		return `.thumbnails/${fileKey.replace(/\//g, "_")}_${height}p.mp4`;
	}

	exists(fileKey: string, height: RenditionHeight): boolean {
		return existsSync(join(this.ctx.storagePath, this.key(fileKey, height)));
	}

	/**
	 * Starts the render if nothing has, and waits up to `waitMs` for it: a
	 * client polls this, and each call is a long poll rather than a retry.
	 * The job is shared by everyone asking (dedupe) and outlives this call.
	 */
	async ensure(
		fileKey: string,
		height: RenditionHeight,
		waitMs = 20_000,
	): Promise<RenditionState> {
		const [file] = await this.ctx.db
			.select({ contentType: files.contentType })
			.from(files)
			.where(and(eq(files.path, fileKey), ownedFiles(this.ctx)));
		// ponytail: no renditions where files are sealed. The worker writes an
		// MP4 to a seekable plaintext file; a sealed one needs a sealed writer.
		if (!file?.contentType.startsWith("video/") || this.ctx.encrypted) {
			return { status: "unavailable" };
		}
		if (this.exists(fileKey, height)) {
			return { status: "ready" };
		}
		const output = join(this.ctx.storagePath, this.key(fileKey, height));
		const job = await this.queue.awaitJob(
			await this.queue.enqueueJob({
				type: "transcode",
				dedupeKey: output,
				priority: "interactive",
				spec: { source: join(this.ctx.storagePath, fileKey), output, height },
			}),
			{ timeoutMs: waitMs, cancelOnTimeout: false },
		);
		if (!job) {
			return { status: "preparing" };
		}
		return job.status === "succeeded"
			? { status: "ready" }
			: { status: "failed", error: job.error ?? undefined };
	}
}
