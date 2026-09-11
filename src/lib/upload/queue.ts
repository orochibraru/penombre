/**
 * The upload queue, persisted in IndexedDB.
 *
 * The point is surviving a reload: `File` objects are structured-cloneable, so
 * a browser can hand the same bytes back after a refresh without asking the
 * user to pick the files again. The server-side metadata row is created before
 * the bytes are sent, so a resumed job already knows where it is going.
 *
 * A handle can still go stale (the file was moved or deleted on disk since).
 * Reading it then throws, and the job is marked failed rather than retried
 * forever.
 */

export type UploadStatus = "pending" | "uploading" | "done" | "failed";

export interface UploadJob {
	/** Queue id, not the server's. */
	id: string;
	/** Server metadata row this uploads into. */
	fileId: string;
	/** Server-side path, used as the key in the progress stores. */
	finalName: string;
	/** What the user called it. */
	displayName: string;
	/**
	 * Key the file list and the progress stores use for this row — the path
	 * relative to the folder that was on screen. Stored rather than recomputed
	 * so a resumed job does not depend on where the user has navigated since.
	 */
	rowKey: string;
	size: number;
	file: File;
	status: UploadStatus;
	error?: string;
	createdAt: number;
}

const DB_NAME = "penombre-uploads";
const STORE = "jobs";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | undefined;

function openDb(): Promise<IDBDatabase | null> {
	dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
		if (typeof indexedDB === "undefined") {
			resolve(null);
			return;
		}
		const request = indexedDB.open(DB_NAME, VERSION);
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(STORE)) {
				request.result.createObjectStore(STORE, { keyPath: "id" });
			}
		};
		request.onsuccess = () => resolve(request.result);
		// A private window with storage blocked must not break uploading — it
		// just loses the ability to resume one.
		request.onerror = () => resolve(null);
	});
	return dbPromise;
}

function run<T>(
	mode: IDBTransactionMode,
	body: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
	return openDb().then(
		(db) =>
			new Promise<T | null>((resolve) => {
				if (!db) {
					resolve(null);
					return;
				}
				try {
					const request = body(db.transaction(STORE, mode).objectStore(STORE));
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => resolve(null);
				} catch {
					resolve(null);
				}
			}),
	);
}

export async function putJob(job: UploadJob): Promise<void> {
	await run("readwrite", (store) => store.put(job));
}

export async function putJobs(jobs: UploadJob[]): Promise<void> {
	for (const job of jobs) {
		await putJob(job);
	}
}

export async function deleteJob(id: string): Promise<void> {
	await run("readwrite", (store) => store.delete(id));
}

export async function allJobs(): Promise<UploadJob[]> {
	const jobs = await run<UploadJob[]>("readonly", (store) => store.getAll());
	return (jobs ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function clearFinished(): Promise<void> {
	for (const job of await allJobs()) {
		if (job.status === "done") {
			await deleteJob(job.id);
		}
	}
}

export async function clearAll(): Promise<void> {
	await run("readwrite", (store) => store.clear());
}

/**
 * Mark everything still in flight as failed.
 *
 * Called when the tab goes away: those transfers were cut off mid-body, and
 * recording that is what lets the next load show them as failed rather than
 * silently pretending they are still going.
 */
export async function failInFlight(): Promise<void> {
	for (const job of await allJobs()) {
		if (job.status === "uploading" || job.status === "pending") {
			await putJob({ ...job, status: "failed", error: "interrupted" });
		}
	}
}
