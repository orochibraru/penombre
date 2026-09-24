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
import { type VersionRef, versionOf } from "#lib/versions.js";
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

/** An earlier version's endpoint, absolute like `getObjectUrl`'s. */
function versionUrl(
	version: VersionRef,
	endpoint: "raw" | "thumbnail",
	params: Record<string, string> = {},
): string {
	const query = new URLSearchParams(params);
	const location = locationQuery(locationOf(page.params));
	const path = `/api/v1/storage/file/${encodeURIComponent(version.fileId)}/versions/${encodeURIComponent(version.id)}/${endpoint}`;
	const search = [query.toString(), location].filter(Boolean).join("&");
	return new URL(search ? `${path}?${search}` : path, page.url.origin).href;
}

/** Raw bytes of a file, as served by the proxy route. */
export function rawUrl(item: ObjectItem): string {
	const version = versionOf(item);
	if (version) {
		return versionUrl(version, "raw");
	}
	return getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		fileId: item.metadata.id,
		raw: true,
	});
}

/** A saved download of the bytes, for the Download action. */
export function downloadUrl(item: ObjectItem): string {
	const version = versionOf(item);
	return version ? versionUrl(version, "raw", { download: "1" }) : rawUrl(item);
}

/** A thumbnail; for audio the same URL answers with waveform peaks. */
export function thumbnailUrl(
	item: ObjectItem,
	size: "small" | "medium" | "large" = "large",
): string {
	const version = versionOf(item);
	if (version) {
		return versionUrl(version, "thumbnail", { size });
	}
	return getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		fileId: item.metadata.id,
		thumbnail: true,
		size,
	});
}

/** Peak-data URL for an audio file, which the waveform reads as JSON. */
export function peaksUrl(item: ObjectItem): string {
	return thumbnailUrl(item, "large");
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
	// `/view` loads a file by id; it has no way to show an earlier version.
	return Boolean(
		item.metadata.id &&
			!versionOf(item) &&
			VIEWABLE.has(item.metadata.category ?? ""),
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
