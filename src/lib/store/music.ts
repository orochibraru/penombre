import { type Writable, writable } from 'svelte/store';

export type PlayableMusic = {
	title: string;
	source: string;
} | null;

export const playableMusic: Writable<PlayableMusic> = writable(null);
