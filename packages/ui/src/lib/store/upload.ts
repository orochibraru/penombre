import { type Writable, writable } from "svelte/store";
import type { ObjectItem } from "$lib/api";

export const uploadingItems: Writable<Record<string, number>> = writable({});
export const uploadedItems: Writable<Record<string, ObjectItem>> = writable({});
