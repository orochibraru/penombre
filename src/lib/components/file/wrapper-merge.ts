import { GitMergeIcon } from "@lucide/svelte";
import type { ObjectItem } from "#lib/api/index.js";
import { mergeVersionsOf } from "#lib/store/versions.js";
import { isFolderItem, type MultipleItemsAction } from "#lib/utils.js";
import { page } from "$app/state";

/** Opens the merge dialog; undefined unless two or more files, no folders. */
export function mergeHandler(
	items: ObjectItem[] | undefined,
	checkedItems: Record<string, string | false>,
	onmerged: () => void,
): (() => void) | undefined {
	const selected = (items ?? []).filter((item) => checkedItems[item.key]);
	if (
		!page.data.versioning ||
		selected.length < 2 ||
		selected.some((item) => isFolderItem(item))
	) {
		return undefined;
	}
	return () => mergeVersionsOf.set({ items: selected, onmerged });
}

export function mergeVersionsAction(action: () => void): MultipleItemsAction {
	return {
		title: "Merge as versions",
		icon: GitMergeIcon,
		variant: "outline",
		action,
	};
}
