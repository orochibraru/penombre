/**
 * Bulk restore/delete for the file wrapper's multi-select mode.
 *
 * Both operations fire one request per checked item, report progress through a
 * single toast, and revalidate the listing once everything settles.
 */

import { toast } from "svelte-sonner";
import { invalidate } from "$app/navigation";
import { page } from "$app/state";
import type { ObjectItem } from "$lib/api";
import * as m from "$lib/paraglide/messages.js";
import {
	getDeleteFolderPromise,
	getDeleteForeverPromise,
	getRestoreFilePromise,
	getRestoreFolderPromise,
	getTrashFilePromise,
	getTrashFolderPromise,
} from "./wrapper.svelte.js";

export function executeRestoreOperation(
	checkedItems: Record<string, string | false>,
	callbacks: {
		setRestoringItem: (v: boolean) => void;
		setConfirmRestoreOpen: (v: boolean) => void;
		setActionsContextOpen: (v: boolean) => void;
		clearCheckedItems: () => void;
		setActionableItem: (v: ObjectItem | undefined) => void;
	},
): void {
	const keys = Object.keys(checkedItems);
	if (keys.length === 0) {
		return;
	}

	const promises: Promise<void>[] = [];
	const count = keys.length;

	callbacks.setActionsContextOpen(false);

	for (const checkedItem of keys) {
		callbacks.setRestoringItem(true);
		const itemPath = page.params.path
			? `${page.params.path}/${checkedItem}`
			: checkedItem;

		if (itemPath.endsWith("/")) {
			promises.push(
				getRestoreFolderPromise(itemPath, {
					onSuccess: () => {
						callbacks.setConfirmRestoreOpen(false);
						callbacks.setRestoringItem(false);
					},
					onError: () => callbacks.setRestoringItem(false),
				}),
			);
		} else {
			promises.push(
				getRestoreFilePromise(itemPath, {
					onSuccess: () => {
						callbacks.setConfirmRestoreOpen(false);
						callbacks.setRestoringItem(false);
					},
					onError: () => callbacks.setRestoringItem(false),
				}),
			);
		}
	}

	let failures = 0;

	toast.promise(
		Promise.all(promises)
			.catch(() => {
				failures += 1;
			})
			.finally(() => {
				callbacks.clearCheckedItems();
				callbacks.setActionsContextOpen(false);
				callbacks.setActionableItem(undefined);
			})
			.then(() => invalidate("app:files")),
		{
			loading: m.toast_restoring_items({ count: String(count) }),
			success: m.toast_items_restored({ count: String(count) }),
			error: m.toast_restore_items_error({ count: String(failures) }),
		},
	);
}

export function executeDeleteOperation(
	checkedItems: Record<string, string | false>,
	isTrash: boolean,
	callbacks: {
		setDeletingItem: (v: boolean) => void;
		setConfirmDeleteOpen: (v: boolean) => void;
		setActionsContextOpen: (v: boolean) => void;
		clearCheckedItems: () => void;
		setActionableItem: (v: ObjectItem | undefined) => void;
	},
): void {
	const keys = Object.keys(checkedItems);
	if (keys.length === 0) {
		return;
	}

	const promises: Promise<void>[] = [];
	const amount = keys.length;

	callbacks.setActionsContextOpen(false);

	for (const checkedItem of keys) {
		callbacks.setDeletingItem(true);
		// On trash page, items already contain full paths; otherwise prepend current folder path
		const itemPath =
			isTrash || !page.params.path
				? checkedItem
				: `${page.params.path}/${checkedItem}`;

		const isFolder = itemPath.endsWith("/");

		if (isFolder) {
			if (isTrash) {
				promises.push(
					getDeleteFolderPromise(itemPath, {
						onSuccess: () => {
							callbacks.setConfirmDeleteOpen(false);
							callbacks.setDeletingItem(false);
						},
						onError: () => callbacks.setDeletingItem(false),
					}),
				);
			} else {
				promises.push(
					getTrashFolderPromise(itemPath, {
						onSuccess: () => {
							callbacks.setConfirmDeleteOpen(false);
							callbacks.setDeletingItem(false);
						},
						onError: () => callbacks.setDeletingItem(false),
					}),
				);
			}
			continue;
		}

		if (isTrash) {
			promises.push(
				getDeleteForeverPromise(itemPath, {
					onSuccess: () => {
						callbacks.setConfirmDeleteOpen(false);
						callbacks.setDeletingItem(false);
					},
					onError: () => callbacks.setDeletingItem(false),
				}),
			);
			continue;
		}

		promises.push(
			getTrashFilePromise(itemPath, {
				onSuccess: () => {
					callbacks.setConfirmDeleteOpen(false);
					callbacks.setDeletingItem(false);
				},
				onError: () => callbacks.setDeletingItem(false),
			}),
		);
	}

	let failures = 0;

	toast.promise(
		Promise.all(promises)
			.catch(() => {
				failures += 1;
			})
			.finally(() => {
				callbacks.clearCheckedItems();
				callbacks.setActionsContextOpen(false);
				callbacks.setActionableItem(undefined);
			})
			.then(() => invalidate("app:files")),
		{
			loading: isTrash
				? m.toast_deleting_permanently({ count: String(amount) })
				: m.toast_moving_to_trash({ count: String(amount) }),
			success: isTrash
				? m.toast_items_deleted_permanently({ count: String(amount) })
				: m.toast_items_moved_to_trash({ count: String(amount) }),
			error: isTrash
				? m.toast_delete_permanently_error({ count: String(failures) })
				: m.toast_move_to_trash_error({ count: String(failures) }),
		},
	);
}
