import { type Writable, writable } from 'svelte/store';

export type PlayableMusic = {
	title: string;
	source: string;
	isPlaying: boolean;
} | null;

export const playableMusic: Writable<PlayableMusic> = writable(null);
