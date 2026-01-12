import { type Writable, writable } from "svelte/store";
import type { ObjectItem } from "$lib/api-client";

export const uploadingItems: Writable<Record<string, number>> = writable({});
export const uploadedItems: Writable<Record<string, ObjectItem>> = writable({});

// Pending files dropped from drag/drop zones - to be picked up by upload dialog
export const pendingUploadFiles: Writable<File[]> = writable([]);

// Controls whether the upload dialog should open
export const uploadDialogOpen: Writable<boolean> = writable(false);

// Controls whether the new folder dialog should open
export const newFolderDialogOpen: Writable<boolean> = writable(false);
