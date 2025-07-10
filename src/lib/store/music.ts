import { type Writable, writable } from 'svelte/store';

export const musicSourceUrl: Writable<string> = writable('');
