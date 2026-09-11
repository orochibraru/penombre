/**
 * Drives the upload worker and keeps the progress stores in step with it.
 *
 * One instance per tab, created lazily on first use. Everything it needs to
 * carry on after a reload lives in IndexedDB (`queue.ts`), so this module is
 * pure wiring: enqueue → worker → stores + queue.
 */

import { toast } from "svelte-sonner";
import { browser } from "$app/environment";
import { invalidate } from "$app/navigation";
import { api, type ObjectItem } from "$lib/api";
import * as m from "$lib/paraglide/messages.js";
import {
	failedUploads,
	uploadedItems,
	uploadingItems,
	uploadingItemsNames,
	uploadStats,
} from "$lib/store/upload";
import {
	allJobs,
	deleteJob,
	failInFlight,
	putJob,
	putJobs,
	type UploadJob,
} from "./queue";
import type { WorkerEvent, WorkerJob, WorkerRequest } from "./worker";

let worker: Worker | undefined;
/** Jobs this tab knows about, by queue id. */
const known = new Map<string, UploadJob>();
/** Bytes sent per job, for the speed and ETA readout. */
const sent = new Map<string, number>();

function uploadUrl(fileId: string): string {
	return `/api/v1/storage/file/${encodeURIComponent(fileId)}/upload`;
}

function toWorkerJob(job: UploadJob): WorkerJob {
	return {
		id: job.id,
		fileId: job.fileId,
		url: uploadUrl(job.fileId),
		file: job.file,
	};
}

function refreshStats(): void {
	uploadStats.update((stats) => {
		const uploaded = [...sent.values()].reduce((sum, n) => sum + n, 0);
		const elapsed = stats.startTime ? (Date.now() - stats.startTime) / 1000 : 0;
		const speed = elapsed > 0 ? uploaded / elapsed : 0;
		const remaining = Math.max(0, stats.totalBytes - uploaded);
		return {
			...stats,
			uploadedBytes: uploaded,
			speed,
			eta: speed > 0 ? Math.round(remaining / speed) : 0,
		};
	});
}

function dropProgress(rowKey: string): void {
	uploadingItems.update((items) => {
		const next = { ...items };
		delete next[rowKey];
		return next;
	});
}

async function onDone(job: UploadJob): Promise<void> {
	sent.set(job.id, job.size);
	uploadStats.update((stats) => ({
		...stats,
		completedFiles: stats.completedFiles + 1,
	}));
	refreshStats();

	const { data } = await api.GET("/api/v1/storage/file/{id}", {
		params: { path: { id: encodeURIComponent(job.finalName) } },
	});

	if (data?.data) {
		const item = data.data as unknown as ObjectItem;
		item.key = job.rowKey;
		uploadedItems.update((items) => ({ ...items, [job.rowKey]: item }));
	}

	dropProgress(job.rowKey);
	await deleteJob(job.id);
	known.delete(job.id);
}

async function onFailed(job: UploadJob, message: string): Promise<void> {
	dropProgress(job.rowKey);
	// Out of `known` but still in IndexedDB: a retry reads it back from there,
	// and leaving it here would make the next batch look like a continuation
	// of this one.
	known.delete(job.id);
	sent.delete(job.id);
	await putJob({ ...job, status: "failed", error: message });
	failedUploads.update((jobs) => [
		...jobs.filter((entry) => entry.id !== job.id),
		{
			id: job.id,
			displayName: job.displayName,
			size: job.size,
			error: message,
		},
	]);
}

function handle(event: WorkerEvent): void {
	if (event.type === "idle") {
		void invalidate("app:files");
		return;
	}

	const job = known.get(event.id);
	if (!job) {
		return;
	}

	switch (event.type) {
		case "start":
			void putJob({ ...job, status: "uploading" });
			break;
		case "progress":
			uploadingItems.update((items) => ({
				...items,
				[job.rowKey]: event.total > 0 ? (event.loaded / event.total) * 100 : 0,
			}));
			sent.set(job.id, event.loaded);
			refreshStats();
			break;
		case "done":
			void onDone(job);
			break;
		case "error":
			void onFailed(job, event.message);
			break;
		default:
			break;
	}
}

function ensureWorker(): Worker | undefined {
	if (!browser) {
		return undefined;
	}
	if (!worker) {
		try {
			worker = new Worker(new URL("./worker.ts", import.meta.url), {
				type: "module",
			});
			worker.onmessage = (event: MessageEvent<WorkerEvent>) =>
				handle(event.data);
			// Best effort only. The real guarantee is `resumeUploads`, which
			// treats anything still marked in flight at load time as
			// interrupted — a write started here may not land if the tab is
			// killed outright.
			addEventListener("pagehide", () => void failInFlight());
		} catch {
			// Nothing recoverable here: with no worker there is no transfer,
			// so say so rather than leaving a queue that never moves.
			toast.error(m.upload_worker_error());
			return undefined;
		}
	}
	return worker;
}

function send(request: WorkerRequest): void {
	ensureWorker()?.postMessage(request);
}

/**
 * Seed the stats for a fresh batch, or extend the one already running.
 *
 * "Fresh" is decided by whether anything is still in flight, not by a flag:
 * a second drop while the first is still going should add to the same totals,
 * or the percentage jumps backwards.
 */
function accountFor(jobs: UploadJob[]): void {
	const fresh = known.size === jobs.length;
	if (fresh) {
		for (const id of [...sent.keys()]) {
			if (!known.has(id)) {
				sent.delete(id);
			}
		}
	}
	uploadStats.update((stats) => ({
		totalFiles: (fresh ? 0 : stats.totalFiles) + jobs.length,
		completedFiles: fresh ? 0 : stats.completedFiles,
		totalBytes:
			(fresh ? 0 : stats.totalBytes) +
			jobs.reduce((sum, job) => sum + job.size, 0),
		uploadedBytes: fresh ? 0 : stats.uploadedBytes,
		startTime: fresh ? Date.now() : stats.startTime,
		speed: fresh ? 0 : stats.speed,
		eta: fresh ? 0 : stats.eta,
	}));
}

/** Queue a batch of already-registered files for upload. */
export async function enqueueUploads(jobs: UploadJob[]): Promise<void> {
	if (jobs.length === 0) {
		return;
	}
	await putJobs(jobs);
	for (const job of jobs) {
		known.set(job.id, job);
		sent.set(job.id, 0);
	}

	accountFor(jobs);
	uploadingItems.update((items) => {
		const next = { ...items };
		for (const job of jobs) {
			next[job.rowKey] = 0;
		}
		return next;
	});
	uploadingItemsNames.update((names) => {
		const next = { ...names };
		for (const job of jobs) {
			next[job.rowKey] = job.displayName;
		}
		return next;
	});

	send({ type: "enqueue", jobs: jobs.map(toWorkerJob) });
}

/**
 * Pick up whatever the last page load left behind.
 *
 * Anything still marked `pending` or `uploading` was cut off when the tab went
 * away — it is recorded as failed first (so the state is honest even if this
 * resume itself never finishes) and then retried.
 */
export async function resumeUploads(): Promise<void> {
	if (!browser) {
		return;
	}
	const stored = await allJobs();
	const interrupted = stored.filter((job) => job.status !== "done");
	if (interrupted.length === 0) {
		return;
	}

	const resumable: UploadJob[] = [];
	for (const job of interrupted) {
		await putJob({ ...job, status: "failed", error: "interrupted" });
		// A handle whose file has been moved or deleted since cannot be read
		// back; there is nothing to resume, so it stays failed.
		if (job.file && job.file.size > 0) {
			resumable.push({ ...job, status: "pending" });
		} else {
			failedUploads.update((jobs) => [
				...jobs,
				{
					id: job.id,
					displayName: job.displayName,
					size: job.size,
					error: "unavailable",
				},
			]);
			await deleteJob(job.id);
		}
	}

	if (resumable.length > 0) {
		toast.info(m.upload_resumed({ count: String(resumable.length) }));
	}
	await enqueueUploads(resumable);
}

/** Retry one failed job, by queue id. */
export async function retryUpload(id: string): Promise<void> {
	const stored = (await allJobs()).find((job) => job.id === id);
	if (!stored) {
		return;
	}
	failedUploads.update((jobs) => jobs.filter((job) => job.id !== id));
	await enqueueUploads([{ ...stored, status: "pending", error: undefined }]);
}

/**
 * Give up on a failed upload.
 *
 * The metadata row was created before the bytes were sent, so abandoning a
 * transfer has to delete it too — otherwise the drive keeps a zero-byte file
 * nobody asked for.
 */
export async function dismissFailed(id: string): Promise<void> {
	const job = (await allJobs()).find((entry) => entry.id === id);
	failedUploads.update((jobs) => jobs.filter((entry) => entry.id !== id));
	await deleteJob(id);
	if (job) {
		await api.DELETE("/api/v1/storage/file/{id}", {
			params: { path: { id: encodeURIComponent(job.finalName) } },
		});
		await invalidate("app:files");
	}
}
