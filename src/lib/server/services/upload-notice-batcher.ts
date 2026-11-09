/**
 * Tells a link's creator that files arrived through its upload form, once per
 * burst: a drop of forty photos is one notification, not forty.
 *
 * Trailing debounce per link: the notice goes out after `QUIET_MS` without a
 * new upload, or `MAX_WAIT_MS` after the first one of a burst that never
 * pauses. Held in memory, so a restart mid-burst loses that notice; the files
 * themselves are already stored.
 */

import { Logger } from "#lib/logger.js";

const logger = new Logger("Share upload notices");

export const QUIET_MS = 2 * 60_000;
export const MAX_WAIT_MS = 10 * 60_000;

export interface UploadNotice {
	shareId: string;
	/** The link's creator: who is told. */
	recipientId: string;
	folderId: string;
	folderName: string;
}

interface Batch extends UploadNotice {
	count: number;
	firstAt: number;
	timer: ReturnType<typeof setTimeout>;
}

export type Deliver = (
	batch: UploadNotice & { count: number },
) => Promise<void>;

export class UploadNoticeBatcher {
	private readonly pending = new Map<string, Batch>();

	constructor(
		private readonly send: Deliver,
		private readonly now: () => number = Date.now,
	) {}

	/** One file landed through a link. */
	record(notice: UploadNotice): void {
		const existing = this.pending.get(notice.shareId);
		if (existing) {
			clearTimeout(existing.timer);
			existing.count += 1;
			existing.timer = this.schedule(notice.shareId, existing.firstAt);
			return;
		}
		const firstAt = this.now();
		this.pending.set(notice.shareId, {
			...notice,
			count: 1,
			firstAt,
			timer: this.schedule(notice.shareId, firstAt),
		});
	}

	/** Sends every pending notice now (shutdown, tests). */
	async flushAll(): Promise<void> {
		await Promise.all([...this.pending.keys()].map((id) => this.flush(id)));
	}

	private schedule(shareId: string, firstAt: number) {
		const wait = Math.max(
			0,
			Math.min(QUIET_MS, firstAt + MAX_WAIT_MS - this.now()),
		);
		return setTimeout(() => void this.flush(shareId), wait);
	}

	private async flush(shareId: string): Promise<void> {
		const batch = this.pending.get(shareId);
		if (!batch) {
			return;
		}
		clearTimeout(batch.timer);
		this.pending.delete(shareId);
		const { timer: _timer, firstAt: _firstAt, ...notice } = batch;
		try {
			await this.send(notice);
		} catch (error) {
			// Runs from a timer: a rejection here would take the process down.
			logger.error("Could not send an upload notice", error);
		}
	}
}
