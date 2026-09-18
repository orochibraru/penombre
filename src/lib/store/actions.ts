import { writable } from "svelte/store";
import type { ObjectItem } from "#lib/api/index.js";

export interface ItemAction {
	open: boolean;
	item?: ObjectItem;
}

export const itemAction = writable<ItemAction>();
