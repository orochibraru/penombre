import { type Writable, writable } from "svelte/store";

/**
 * The id of a row to scroll to and pulse once it is listed: a folder just
 * created. The listings read it; it clears itself after the pulse.
 */
export const highlightedItem: Writable<string | null> = writable(null);

const HIGHLIGHT_MS = 2600;
let clear: ReturnType<typeof setTimeout> | undefined;

export function highlightItem(id: string) {
	clearTimeout(clear);
	highlightedItem.set(id);
	clear = setTimeout(() => highlightedItem.set(null), HIGHLIGHT_MS);
}
