/// <reference lib="webworker" />

/**
 * The upload worker.
 *
 * Uploads run here rather than on the main thread so a large transfer cannot
 * compete with rendering — a grid of thumbnails and a 4 GB video used to
 * stutter each other. `XMLHttpRequest` is used instead of `fetch` for the one
 * thing fetch still cannot do: report request-body progress.
 *
 * The worker owns the concurrency limit and the retry policy; the main thread
 * only enqueues and listens.
 */

export interface WorkerJob {
	id: string;
	fileId: string;
	url: string;
	file: File;
}

export type WorkerRequest =
	| { type: "enqueue"; jobs: WorkerJob[] }
	| { type: "cancel"; id: string };

export type WorkerEvent =
	| { type: "start"; id: string }
	| { type: "progress"; id: string; loaded: number; total: number }
	| { type: "done"; id: string }
	| { type: "error"; id: string; message: string }
	| { type: "idle" };

const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

const queue: WorkerJob[] = [];
const cancelled = new Set<string>();
const inFlight = new Map<string, XMLHttpRequest>();
let running = 0;

const post = (event: WorkerEvent) => self.postMessage(event);

function sendOnce(job: WorkerJob): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		inFlight.set(job.id, xhr);
		xhr.open("POST", job.url);
		xhr.withCredentials = true;

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				post({
					type: "progress",
					id: job.id,
					loaded: event.loaded,
					total: event.total,
				});
			}
		};

		xhr.onload = () => {
			inFlight.delete(job.id);
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
				return;
			}
			reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
		};
		xhr.onerror = () => {
			inFlight.delete(job.id);
			reject(new Error("Network error"));
		};
		xhr.onabort = () => {
			inFlight.delete(job.id);
			reject(new Error("Aborted"));
		};

		const form = new FormData();
		form.append("file", job.file);
		xhr.send(form);
	});
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runJob(job: WorkerJob): Promise<void> {
	post({ type: "start", id: job.id });
	let last = "Upload failed.";

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		if (cancelled.has(job.id)) {
			return;
		}
		try {
			await sendOnce(job);
			post({ type: "done", id: job.id });
			return;
		} catch (error) {
			last = (error as Error).message;
			if (cancelled.has(job.id)) {
				return;
			}
			if (attempt < MAX_ATTEMPTS) {
				await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
				// Progress restarts from zero on a retry.
				post({ type: "progress", id: job.id, loaded: 0, total: job.file.size });
			}
		}
	}

	post({ type: "error", id: job.id, message: last });
}

function pump(): void {
	while (running < CONCURRENCY && queue.length > 0) {
		const job = queue.shift();
		if (!job || cancelled.has(job.id)) {
			continue;
		}
		running += 1;
		void runJob(job).finally(() => {
			running -= 1;
			if (queue.length > 0) {
				pump();
			} else if (running === 0) {
				post({ type: "idle" });
			}
		});
	}
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
	const message = event.data;
	if (message.type === "cancel") {
		cancelled.add(message.id);
		inFlight.get(message.id)?.abort();
		return;
	}
	queue.push(...message.jobs);
	pump();
};
