import { derived, type Writable, writable } from "svelte/store";
import type { ObjectItem } from "$lib/api-client";
import { itemAction } from "./actions";

export const uploadingItems: Writable<Record<string, number>> = writable({});
export const uploadedItems: Writable<Record<string, ObjectItem>> = writable({});

// Pending files dropped from drag/drop zones - to be picked up by upload dialog
export const pendingUploadFiles: Writable<File[]> = writable([]);

// Controls whether the upload dialog should open
export const uploadDialogOpen: Writable<boolean> = writable(false);

// Controls whether the new folder dialog should open
export const newFolderDialogOpen: Writable<boolean> = writable(false);

/**
 * Derived store for global upload progress.
 * Returns { isUploading: boolean, progress: number (0-100), count: number }
 */
export const globalUploadProgress = derived(uploadingItems, ($items) => {
	const entries = Object.entries($items);
	if (entries.length === 0) {
		return { isUploading: false, progress: 0, count: 0 };
	}
	const totalProgress = entries.reduce((sum, [, pct]) => sum + pct, 0);
	const avgProgress = totalProgress / entries.length;
	return {
		isUploading: true,
		progress: Math.round(avgProgress),
		count: entries.length,
	};
});

/**
 * Closes all dialog stores. Call this on navigation to clean up.
 */
export function closeAllDialogs() {
	uploadDialogOpen.set(false);
	newFolderDialogOpen.set(false);
	itemAction.set({ open: false, item: undefined });
}
