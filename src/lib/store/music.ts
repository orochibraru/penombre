import { type Writable, writable } from "svelte/store";

export type PlayableMusic = {
	title: string;
	source: string;
	isPlaying: boolean;
	/** The item this track came from, so a note can be attached to it. */
	fileId?: string;
} | null;

export const playableMusic: Writable<PlayableMusic> = writable(null);

/**
 * Playback position of the global music player, in seconds.
 *
 * Lives outside `playableMusic` on purpose: it changes several times a second
 * and every subscriber of that store would re-run on each tick.
 */
export const playbackPosition: Writable<number> = writable(0);
