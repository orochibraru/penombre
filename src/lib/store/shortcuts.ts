import { writable } from "svelte/store";

/** A folder being dragged from a listing, for the sidebar to take as a shortcut. */
export const draggedFolder = writable<{ id: string; name: string } | null>(
	null,
);
