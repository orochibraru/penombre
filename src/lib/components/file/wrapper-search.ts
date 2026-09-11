/**
 * The file-search query, split out of `wrapper.svelte` so the component keeps
 * only the state and the markup.
 */

import { api, type ObjectItem } from "$lib/api";

/** Matching files for `query`, or an empty list for a blank or failed search. */
export async function searchFiles(query: string): Promise<ObjectItem[]> {
	const q = query.trim();
	if (!q) {
		return [];
	}
	try {
		const { data } = await api.GET("/api/v1/storage/file/search", {
			params: { query: { q } },
		});
		return (data?.data?.list ?? []) as unknown as ObjectItem[];
	} catch {
		return [];
	}
}

/** True when the event is the focus-the-search shortcut. */
export function isSearchShortcut(event: KeyboardEvent): boolean {
	return (event.ctrlKey || event.metaKey) && event.key === "k";
}
