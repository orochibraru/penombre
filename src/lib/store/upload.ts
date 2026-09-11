import { derived, type Writable, writable } from "svelte/store";
import type { ObjectItem } from "$lib/api";
import { itemAction } from "./actions";

export const uploadingItems: Writable<Record<string, number>> = writable({});
export const uploadingItemsNames: Writable<Record<string, string>> = writable(
	{},
); // Maps UUID to display name
export const uploadedItems: Writable<Record<string, ObjectItem>> = writable({});

// Tracks the preparing phase (folder creation + metadata) before actual uploads start
export const preparingUpload: Writable<{ active: boolean; status: string }> =
	writable({
		active: false,
		status: "",
	});

// Upload statistics: file counts, speed, and ETA
export interface UploadStats {
	totalFiles: number;
	completedFiles: number;
	totalBytes: number;
	uploadedBytes: number;
	startTime: number; // Date.now() when uploads started
	speed: number; // bytes per second (rolling average)
	eta: number; // estimated seconds remaining
}

export const uploadStats: Writable<UploadStats> = writable({
	totalFiles: 0,
	completedFiles: 0,
	totalBytes: 0,
	uploadedBytes: 0,
	startTime: 0,
	speed: 0,
	eta: 0,
});

/**
 * Uploads that were cut off or exhausted their retries, kept until the user
 * retries or dismisses them. Populated from the persisted queue on load, so a
 * transfer interrupted by closing the tab is still reported next time.
 */
export interface FailedUpload {
	id: string;
	displayName: string;
	size: number;
	error: string;
}

export const failedUploads: Writable<FailedUpload[]> = writable([]);

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
 *
 * Deliberately leaves `preparingUpload` and `uploadStats` alone: a transfer
 * runs in a worker and outlives any navigation, so zeroing its totals here
 * only blanked the progress panel of an upload that was still going.
 */
export function closeAllDialogs() {
	uploadDialogOpen.set(false);
	newFolderDialogOpen.set(false);
	itemAction.set({ open: false, item: undefined });
}
