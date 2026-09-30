/**
 * The file-search query, split out of `wrapper.svelte` so the component keeps
 * only the state and the markup.
 */

import { api, type ObjectItem } from "#lib/api/index.js";
import type { StorageLocation } from "#lib/storage-location.js";

/** A match, and the drive or mount it was found in. */
export type Found = ObjectItem & {
	place: { kind: "personal" | "drive" | "volume"; id?: string; name: string };
};

/**
 * Matches for `query` in every place the account can browse, or an empty list
 * for a blank or failed search.
 */
export async function searchFiles(query: string): Promise<Found[]> {
	const q = query.trim();
	if (!q) {
		return [];
	}
	try {
		const { data } = await api.GET("/api/v1/search", {
			params: { query: { q } },
		});
		return (data?.data?.list ?? []) as unknown as Found[];
	} catch {
		return [];
	}
}

/** Where a result lives, as the listing routes take it. */
export function locationOfPlace(place: Found["place"]): StorageLocation {
	if (place.kind === "drive") {
		return { drive: place.id };
	}
	if (place.kind === "volume") {
		return { volume: place.id };
	}
	return {};
}

/** A folder result's own path: its parent's plus its key, without the slash. */
export function folderPathOf(found: Found): string {
	const key = found.key.replace(/\/$/, "");
	return found.parentKey ? `${found.parentKey}/${key}` : key;
}

/** True when the event is the focus-the-search shortcut. */
export function isSearchShortcut(event: KeyboardEvent): boolean {
	return (event.ctrlKey || event.metaKey) && event.key === "k";
}
