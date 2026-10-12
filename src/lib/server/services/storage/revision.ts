import { createHash } from "node:crypto";

/**
 * What an editor opened, as a token its saves send back. A hash of the
 * plaintext rather than the row's date: a scan re-dating the row or a key
 * rotation resealing the bytes must not read as someone else's save.
 */
export function revisionOf(bytes: ArrayBuffer | Uint8Array): string {
	return createHash("sha256").update(new Uint8Array(bytes)).digest("hex");
}

const saving = new Map<string, Promise<unknown>>();

/**
 * Runs saves of one file one at a time, so two that read the same revision
 * cannot both pass the check and overwrite each other.
 */
export function oneSaveAtATime<T>(fileId: string, save: () => Promise<T>) {
	const previous = saving.get(fileId) ?? Promise.resolve();
	const run = previous.catch(() => undefined).then(save);
	saving.set(fileId, run);
	void run
		.finally(() => {
			if (saving.get(fileId) === run) {
				saving.delete(fileId);
			}
		})
		.catch(() => undefined);
	return run;
}
