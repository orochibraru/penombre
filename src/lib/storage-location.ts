/**
 * Where a request acts: the caller's own drive, a shared drive, or a mounted
 * volume.
 *
 * Both non-personal cases are the same thing to the storage layer — a volume
 * — so they travel the same way and are resolved in one place. They are two
 * parameters rather than one because a drive is addressed by id and a volume
 * by the name its `VOLUME_<NAME>_PATH` gave it.
 *
 * They travel as headers rather than query parameters: setting a header on an
 * outgoing request is in-place, while changing its URL means rebuilding the
 * `Request`, which turns its body into a stream upload — and Chrome refuses
 * those over plain HTTP/1.1. The server takes either spelling, and the query
 * one is what a media `src` or the upload worker uses, having no client to
 * carry a header for them.
 */

export const DRIVE_HEADER = "x-drive";
export const VOLUME_HEADER = "x-volume";

/** A listing's address, as the API takes it. Empty means the personal drive. */
export interface StorageLocation {
	drive?: string;
	volume?: string;
}

/**
 * The location a set of route params describes.
 *
 * `/drives/[drive]/…` and `/volumes/[volume]/…` are the only two that are not
 * the personal drive, so one look at the params answers it for every page.
 */
export function locationOf(
	params: Partial<Record<string, string>> | undefined | null,
): StorageLocation {
	if (params?.drive) {
		return { drive: params.drive };
	}
	if (params?.volume) {
		return { volume: params.volume };
	}
	return {};
}

/**
 * Where a route acts: its own parameters, or — for `/view` and `/edit`, which
 * live outside both `/drives` and `/volumes` — the query the link carried.
 */
export function locationFrom(
	params: Partial<Record<string, string>> | undefined | null,
	url: URL,
): StorageLocation {
	const fromParams = locationOf(params);
	if (fromParams.drive || fromParams.volume) {
		return fromParams;
	}
	return {
		drive: url.searchParams.get("drive") ?? undefined,
		volume: url.searchParams.get("volume") ?? undefined,
	};
}

/** The same, as query parameters for a URL that cannot carry a header. */
export function locationQuery(location: StorageLocation): string {
	if (location.drive) {
		return `drive=${encodeURIComponent(location.drive)}`;
	}
	if (location.volume) {
		return `volume=${encodeURIComponent(location.volume)}`;
	}
	return "";
}
