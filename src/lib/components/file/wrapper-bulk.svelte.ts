/**
 * Bulk restore/delete for the file wrapper's multi-select mode.
 *
 * Restore and delete fire one request per checked item, a few at a time,
 * report progress through a single toast and revalidate the listing once
 * everything settles. Emptying the trash is one server-side request instead.
 */

import { toast } from "svelte-sonner";
import { api, type ObjectItem } from "#lib/api/index.js";
import * as m from "#lib/paraglide/messages.js";
import { isFolderItem, readableFileSize } from "#lib/utils.js";
import { invalidate } from "$app/navigation";
import { page } from "$app/state";
import {
	bulkZipDownloadUrl,
	clickDownload,
	getDeleteFolderPromise,
	getDeleteForeverPromise,
	getRestoreFilePromise,
	getRestoreFolderPromise,
	getTrashFilePromise,
	getTrashFolderPromise,
} from "./wrapper.svelte.js";

/**
 * How many item requests are in flight at once.
 *
 * Firing one per selected row put hundreds of writes on the server at the
 * same time; enough of them failed that a "move to trash" over a large
 * selection left part of the drive behind.
 */
const MAX_PARALLEL_REQUESTS = 6;

interface OperationCallbacks {
	setBusy: (v: boolean) => void;
	closeDialog: () => void;
	setActionsContextOpen: (v: boolean) => void;
	clearCheckedItems: () => void;
	setActionableItem: (v: ObjectItem | undefined) => void;
}

/** Run `tasks` a few at a time, counting the ones that actually failed. */
async function runPooled(tasks: (() => Promise<void>)[]): Promise<number> {
	let failures = 0;
	let next = 0;

	const worker = async () => {
		while (next < tasks.length) {
			const task = tasks[next];
			next += 1;
			try {
				await task?.();
			} catch {
				failures += 1;
			}
		}
	};

	await Promise.all(
		Array.from({ length: Math.min(MAX_PARALLEL_REQUESTS, tasks.length) }, () =>
			worker(),
		),
	);
	return failures;
}

/** Thrown once a batch settles, so the toast can report the real tally. */
class PartialFailure extends Error {
	constructor(readonly failures: number) {
		super(`${failures} items failed`);
	}
}

function runBatch(
	tasks: (() => Promise<void>)[],
	callbacks: OperationCallbacks,
	messages: {
		loading: string;
		success: string;
		error: (failures: number) => string;
		/**
		 * Offered on the success toast only; not during loading (nothing to
		 * undo yet) and not on error (a partial failure needs its own retry,
		 * not a blind reverse of the whole batch). Runs the given keys back
		 * through their reverse operation.
		 */
		undo?: () => void;
	},
): void {
	callbacks.setBusy(true);
	callbacks.setActionsContextOpen(false);

	// A manual loading/success/error sequence, not `toast.promise`: its
	// `action` option applies to every state the one toast passes through,
	// which would offer "Undo" while the batch was still running.
	const toastId = toast.loading(messages.loading);
	runPooled(tasks)
		.then(async (failures) => {
			await invalidate("app:files");
			if (failures > 0) {
				throw new PartialFailure(failures);
			}
		})
		.then(() => {
			toast.success(messages.success, {
				id: toastId,
				action: messages.undo
					? { label: m.undo(), onClick: messages.undo }
					: undefined,
			});
		})
		.catch((error) => {
			toast.error(
				messages.error(error instanceof PartialFailure ? error.failures : 1),
				{ id: toastId },
			);
		})
		.finally(() => {
			callbacks.setBusy(false);
			callbacks.closeDialog();
			callbacks.clearCheckedItems();
			callbacks.setActionableItem(undefined);
		});
}

const noop = () => {
	// The batch, not the individual request, drives the dialog state.
};

export function executeRestoreOperation(
	checkedItems: Record<string, string | false>,
	callbacks: OperationCallbacks,
): void {
	const keys = selectedKeys(checkedItems);
	if (keys.length === 0) {
		return;
	}

	const tasks = keys.map((checkedItem) => {
		const itemPath = page.params.path
			? `${page.params.path}/${checkedItem}`
			: checkedItem;
		const restore = itemPath.endsWith("/")
			? getRestoreFolderPromise
			: getRestoreFilePromise;
		return () => restore(itemPath, { onSuccess: noop, onError: noop });
	});

	runBatch(tasks, callbacks, {
		loading: m.toast_restoring_items({ count: String(keys.length) }),
		success: m.toast_items_restored({ count: String(keys.length) }),
		error: (failures) =>
			m.toast_restore_items_error({ count: String(failures) }),
	});
}

export function executeDeleteOperation(
	checkedItems: Record<string, string | false>,
	isTrash: boolean,
	callbacks: OperationCallbacks,
): void {
	const keys = selectedKeys(checkedItems);
	if (keys.length === 0) {
		return;
	}

	const tasks = keys.map((checkedItem) => {
		// Trash rows carry their full path already; a folder listing gives a
		// key relative to the folder being browsed.
		const itemPath =
			isTrash || !page.params.path
				? checkedItem
				: `${page.params.path}/${checkedItem}`;

		const isFolder = itemPath.endsWith("/");
		const operation = isFolder
			? isTrash
				? getDeleteFolderPromise
				: getTrashFolderPromise
			: isTrash
				? getDeleteForeverPromise
				: getTrashFilePromise;

		return () => operation(itemPath, { onSuccess: noop, onError: noop });
	});

	const count = String(keys.length);
	runBatch(tasks, callbacks, {
		loading: isTrash
			? m.toast_deleting_permanently({ count })
			: m.toast_moving_to_trash({ count }),
		success: isTrash
			? m.toast_items_deleted_permanently({ count })
			: m.toast_items_moved_to_trash({ count }),
		error: (failures) =>
			isTrash
				? m.toast_delete_permanently_error({ count: String(failures) })
				: m.toast_move_to_trash_error({ count: String(failures) }),
		// Permanent delete has nothing to undo; a trash move does, as long as
		// the same relative keys still resolve under the same folder; which
		// they do, since trashing only flips a flag, it never moves the row.
		undo: isTrash
			? undefined
			: () => {
					const restoreKeys = Object.fromEntries(keys.map((key) => [key, key]));
					executeRestoreOperation(restoreKeys, {
						setBusy: () => {},
						closeDialog: () => {},
						setActionsContextOpen: () => {},
						clearCheckedItems: () => {},
						setActionableItem: () => {},
					});
				},
	});
}

/**
 * Empty the trash in one request.
 *
 * Deleting row by row priced the job from what the page happened to list and
 * reported success for calls that had quietly done nothing; the server knows
 * what is in there and what it actually freed.
 */
export function executeEmptyTrash(callbacks: OperationCallbacks): void {
	callbacks.setBusy(true);
	callbacks.setActionsContextOpen(false);

	toast.promise(
		api
			.DELETE("/api/v1/storage/trash", {})
			.then(async ({ data, error }) => {
				if (error || !data?.data) {
					throw new Error("Failed to empty the trash");
				}
				await invalidate("app:files");
				return data.data;
			})
			.finally(() => {
				callbacks.setBusy(false);
				callbacks.closeDialog();
				callbacks.clearCheckedItems();
				callbacks.setActionableItem(undefined);
			}),
		{
			loading: m.toast_emptying_trash(),
			success: (result) =>
				result.failed > 0
					? m.toast_trash_emptied_partial({ count: String(result.failed) })
					: m.toast_trash_emptied({ size: readableFileSize(result.freed) }),
			error: m.toast_empty_trash_error(),
		},
	);
}

/**
 * Keys that are actually selected.
 *
 * Deselecting writes `false` rather than deleting the key, so `Object.keys`
 * keeps returning the high-water mark of everything ever ticked — bulk
 * actions would then act on items no longer chosen.
 */
export function selectedKeys(
	checkedItems: Record<string, string | false>,
): string[] {
	return Object.entries(checkedItems)
		.filter(([, name]) => !!name)
		.map(([key]) => key);
}

/**
 * Must match `BULK_DOWNLOAD_LINK_MAX` in
 * `#lib/server/openapi/v1/storage.ts`, which enforces the same cap; a
 * client-server import isn't possible since that module is server-only.
 */
const BULK_DOWNLOAD_LINK_MAX = 100;

/**
 * Download a multi-item selection as one zip.
 *
 * A plain link, not a `fetch` + blob: the browser streams the archive
 * straight to disk instead of buffering the whole thing in JS memory first.
 * That also means there is no completion signal to wait for; the toast can
 * only say the download started.
 */
export function downloadSelected(keys: string[], currentFolder: string): void {
	if (keys.length > BULK_DOWNLOAD_LINK_MAX) {
		downloadSelectedAsBlob(keys, currentFolder);
		return;
	}
	clickDownload(
		bulkZipDownloadUrl(currentFolder, keys),
		`penombre-download-${keys.length}-files.zip`,
	);
	toast.info(m.toast_downloaded_files({ count: String(keys.length) }));
}

/**
 * Fallback for a selection too large for the GET link's query string: a
 * `fetch` + blob download through the POST route, which buffers the whole
 * archive in JS memory but has no URL length to worry about.
 */
function downloadSelectedAsBlob(keys: string[], currentFolder: string): void {
	const paths = keys.map((key) =>
		currentFolder ? `${currentFolder}/${key}` : key,
	);

	toast.promise(
		(async () => {
			const { response, error } = await api.POST("/api/v1/storage/download", {
				body: { paths },
				parseAs: "blob",
			});
			if (error) {
				throw new Error("Failed to create download");
			}
			const url = URL.createObjectURL(await response.blob());
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `penombre-download-${paths.length}-files.zip`;
			document.body.appendChild(anchor);
			anchor.click();
			URL.revokeObjectURL(url);
			anchor.remove();
		})(),
		{
			loading: m.toast_creating_zip_files({ count: String(keys.length) }),
			success: m.toast_downloaded_files({ count: String(keys.length) }),
			error: m.toast_download_files_error(),
		},
	);
}

/** Star every selected item, files and folders alike. */
export async function starSelected(
	items: ObjectItem[],
	currentFolder: string,
	onDone: () => void,
): Promise<void> {
	if (items.length === 0) {
		return;
	}

	try {
		await Promise.all(
			items.map((item) => {
				if (isFolderItem(item)) {
					const folderId = item.key.replace(/\/$/, "");
					return api.PUT("/api/v1/storage/folder/{path}", {
						params: { path: { path: encodeURIComponent(folderId) } },
						body: {
							isStarred: true,
							parentFolderId: currentFolder || undefined,
						},
					});
				}
				return api.PUT("/api/v1/storage/file/{id}", {
					params: {
						path: { id: encodeURIComponent(item.key) },
						query: { folder: currentFolder },
					},
					body: { isStarred: true },
				});
			}),
		);
		toast.success(m.toast_added_to_starred({ name: String(items.length) }));
		onDone();
		await invalidate("app:files");
	} catch {
		toast.error(m.toast_star_error());
	}
}
