/**
 * Where a file's URLs point.
 *
 * Split out of `wrapper.svelte.ts` so the preview dialog can ask for a link
 * without importing the wrapper's whole action surface.
 */

import { resolve } from "$app/paths";
import { page } from "$app/state";
import type { ObjectItem } from "$lib/api";
import { getObjectUrl } from "$lib/url";

/** Raw bytes of a file, as served by the proxy route. */
export function rawUrl(item: ObjectItem): string {
	return getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		raw: true,
	});
}

/** Peak-data URL for an audio file, which the waveform reads as JSON. */
export function peaksUrl(item: ObjectItem): string {
	return getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		thumbnail: true,
		size: "large",
	});
}

/** Media kinds that get Penombre's own full-screen viewer. */
const VIEWABLE = new Set(["IMAGES", "VIDEO", "MUSIC"]);

/**
 * Where "open in a new tab" should land.
 *
 * Media goes to the app's viewer — the browser's built-in player is a bare
 * `<video>` on a black page with no notes and no title. Everything else is
 * still the raw file, which is what a PDF or a text file wants.
 */
export function newTabUrl(item: ObjectItem): string {
	if (item.metadata.id && VIEWABLE.has(item.metadata.category ?? "")) {
		return resolve("/view/[fileId]", { fileId: item.metadata.id });
	}
	return rawUrl(item);
}

export function handleOpenItemInNewTab(item: ObjectItem): void {
	window.open(newTabUrl(item));
}
