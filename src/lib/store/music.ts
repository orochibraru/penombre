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
 * needs to seek and pause it from the other side of the tree.
 *
 * One command carries the whole intent rather than one action: two
 * `commandPlayback` calls in the same tick collapse into the last write
 * before the player's effect ever runs, so "seek here, then pause" sent as
 * two commands silently lost the seek. `id` makes otherwise-identical
 * commands distinct, so seeking twice to the same moment works.
 */
export interface PlaybackCommand {
	id: number;
	/** Move the playhead here, in seconds. */
	seek?: number;
	pause?: boolean;
	play?: boolean;
}

export const playbackCommand: Writable<PlaybackCommand | null> = writable(null);

let commandId = 0;

export function commandPlayback(command: Omit<PlaybackCommand, "id">): void {
	commandId += 1;
	playbackCommand.set({ ...command, id: commandId });
}
