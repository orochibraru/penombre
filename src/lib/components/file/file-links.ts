/**
 * Where a file's URLs point.
 *
 * Split out of `wrapper.svelte.ts` so the preview dialog can ask for a link
 * without importing the wrapper's whole action surface.
 */

import { get } from "svelte/store";
import type { ObjectItem } from "#lib/api/index.js";
import { locationOf, locationQuery } from "#lib/storage-location.js";
import { playableMusic, playbackPosition } from "#lib/store/music.js";
import { getObjectUrl } from "#lib/url.js";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";

/**
 * Keep the drive or volume the page is in on a link that leaves it.
 *
 * `/view` and `/edit` sit under neither, so where the file lives cannot come
 * from their own parameters — the load reads it from here, and so does the API
 * client while that page is open.
 */
export function withLocation(href: string): string {
	const query = locationQuery(locationOf(page.params));
	if (!query) {
		return href;
	}
	return `${href}${href.includes("?") ? "&" : "?"}${query}`;
}

/** Raw bytes of a file, as served by the proxy route. */
export function rawUrl(item: ObjectItem): string {
	return getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		fileId: item.metadata.id,
		raw: true,
	});
}

/** Peak-data URL for an audio file, which the waveform reads as JSON. */
export function peaksUrl(item: ObjectItem): string {
	return getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		fileId: item.metadata.id,
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
function hasViewer(item: ObjectItem): boolean {
	return Boolean(
		item.metadata.id && VIEWABLE.has(item.metadata.category ?? ""),
	);
}

export function fullscreenUrl(item: ObjectItem, resume?: Resume): string {
	if (hasViewer(item) && item.metadata.id) {
		return withResume(
			withLocation(resolve("/view/[fileId]", { fileId: item.metadata.id })),
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
	const url = fullscreenUrl(item, resume);
	// `goto` rejects a URL with no page route, which the raw file is.
	if (hasViewer(item)) {
		void goto(url);
	} else {
		window.location.assign(url);
	}
}
