import { type Writable, writable } from "svelte/store";

export type PlayableMusic = {
	title: string;
	source: string;
	/** Peak data for the waveform, when the file has any. */
	peaks?: string;
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

/** Duration of the loaded track, published for anything drawing a playhead. */
export const playbackDuration: Writable<number> = writable(0);

/**
 * One-shot instruction for the global player.
 *
 * The `<audio>` element lives in the player component, but the notes panel
 * needs to seek and pause it from the other side of the tree. `id` makes each
 * command distinct so two identical seeks in a row both take effect.
 */
export interface PlaybackCommand {
	id: number;
	type: "seek" | "pause" | "play";
	seconds?: number;
}

export const playbackCommand: Writable<PlaybackCommand | null> = writable(null);

let commandId = 0;

export function commandPlayback(
	type: PlaybackCommand["type"],
	seconds?: number,
): void {
	commandId += 1;
	playbackCommand.set({ id: commandId, type, seconds });
}
