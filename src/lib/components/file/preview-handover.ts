import { type Writable, writable } from "svelte/store";
import type { ObjectItem } from "#lib/api/index.js";
import { playableMusic } from "#lib/store/music.js";
import { fullscreenUrl, peaksUrl, rawUrl } from "./file-links";
import type { FileToView } from "./wrapper.svelte.js";

/**
 * A file to open once its folder is on screen: a video the full-screen viewer
 * handed back (with where its playhead was), or a search result from another
 * folder or drive.
 *
 * The preview dialog is the small player and only the browse pages own one,
 * so neither the viewer nor a search can open one itself: they leave the
 * request here and navigate.
 */
export const pendingPreview: Writable<{ fileId: string; at?: number } | null> =
	writable(null);

/**
 * Consume that request. A file that is not in the listing yields null: the
 * user went somewhere else on the way back, or it sits past the first page.
 */
export function takePendingPreview(
	pending: { fileId: string; at?: number },
	list: ObjectItem[],
): { item: ObjectItem; resume?: FileToView } | null {
	pendingPreview.set(null);
	const item = list.find((entry) => entry.metadata.id === pending.fileId);
	if (!item) {
		return null;
	}
	return pending.at === undefined
		? { item }
		: {
				item,
				resume: { item, src: rawUrl(item), type: "video", startAt: pending.at },
			};
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
			item,
		});
	}
	return { item, src: fullscreenUrl(item), type: "notes" };
}
