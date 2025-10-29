import { writable } from 'svelte/store';
import type { ObjectItem } from '$lib/api';

export type ItemAction = {
	open: boolean;
	item?: ObjectItem;
};

export const itemAction = writable<ItemAction>();
