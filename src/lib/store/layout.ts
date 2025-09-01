import { type Writable, writable } from 'svelte/store';

export type AvailableLayouts = 'grid' | 'list';
export const availableLayouts = ['grid', 'list'];

export const layoutStore: Writable<AvailableLayouts> = writable('list');
