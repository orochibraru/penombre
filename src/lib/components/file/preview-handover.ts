import { type Writable, writable } from "svelte/store";
import type { ObjectItem } from "$lib/api";
import { playableMusic } from "$lib/store/music";
import { fullscreenUrl, peaksUrl, rawUrl } from "./file-links";
import type { FileToView } from "./wrapper.svelte.js";

/**
 * A video the full-screen viewer handed back, and where its playhead was.
 *
 * The preview dialog is the small player and only the browse pages own one,
 * so the viewer cannot open one itself: it leaves the request here and
 * navigates back.
 */
export const pendingPreview: Writable<{ fileId: string; at: number } | null> =
	writable(null);

/**
 * Consume that request, returning what to show. A file that is not in the
 * listing yields null — the user went somewhere else on the way back.
 */
export function takePendingPreview(
	pending: { fileId: string; at: number },
	list: ObjectItem[],
): FileToView {
	pendingPreview.set(null);
	const item = list.find((entry) => entry.metadata.id === pending.fileId);
	if (!item) {
		return null;
	}
	return { item, src: rawUrl(item), type: "video", startAt: pending.at };
}

/**
 * What to show for the "Notes" action.
 *
 * Audio plays in the global player, so there is no preview to put beside the
 * thread — but the dialog still needs a real `src`, or its full-screen button
 * leads nowhere. A track is loaded into the player as well, paused: a
 * timestamped note has no playhead to read without it.
 */
export function notesView(item: ObjectItem): FileToView {
	if (item.metadata.category === "MUSIC") {
		playableMusic.set({
			title: item.metadata.name || item.key,
			source: rawUrl(item),
			peaks: peaksUrl(item),
			isPlaying: false,
			fileId: item.metadata.id,
		});
	}
	return { item, src: fullscreenUrl(item), type: "notes" };
}
