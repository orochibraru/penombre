/**
 * Where a file's URLs point.
 *
 * Split out of `wrapper.svelte.ts` so the preview dialog can ask for a link
 * without importing the wrapper's whole action surface.
 */

import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";
import type { ObjectItem } from "$lib/api";
import { playableMusic, playbackPosition } from "$lib/store/music";
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
 * Where "open full screen" should land.
 *
 * Media goes to the app's viewer — the browser's built-in player is a bare
 * `<video>` on a black page with no notes and no title. Everything else is
 * still the raw file, which is what a PDF or a text file wants.
 */
export function fullscreenUrl(item: ObjectItem, resume?: Resume): string {
	if (item.metadata.id && VIEWABLE.has(item.metadata.category ?? "")) {
		return withResume(
			resolve("/view/[fileId]", { fileId: item.metadata.id }),
			resume,
		);
	}
	return rawUrl(item);
}

/** Where a track was and whether it was running, carried across the nav. */
export interface Resume {
	at?: number;
	playing?: boolean;
}

/**
 * Playback state as query parameters.
 *
 * The viewer is a different top-level route, so its `<audio>`/`<video>` is a
 * new element that would otherwise start at zero. The URL rather than a store
 * so a reload or a pasted link resumes just the same.
 */
export function withResume(href: string, resume?: Resume): string {
	const params = new URLSearchParams();
	if (resume?.at && Number.isFinite(resume.at) && resume.at > 0) {
		params.set("t", resume.at.toFixed(2));
	}
	if (resume?.playing) {
		params.set("playing", "1");
	}
	if ([...params].length === 0) {
		return href;
	}
	return `${href}${href.includes("?") ? "&" : "?"}${params}`;
}

/** Same tab: the viewer is a route, not a popup. */
export function handleOpenItemFullscreen(item: ObjectItem): void {
	const music = get(playableMusic);
	const resume =
		music?.fileId && music.fileId === item.metadata.id
			? { at: get(playbackPosition), playing: music.isPlaying }
			: undefined;
	void goto(fullscreenUrl(item, resume));
}
