import { DownloadIcon, RotateCcwIcon, TrashIcon } from "@lucide/svelte";
import type { ObjectItem } from "#lib/api/index.js";
import { pendingVersionAction } from "#lib/store/versions.js";
import type { ItemActionGroup } from "#lib/utils.js";
import { versionOf } from "#lib/versions.js";
import { downloadUrl } from "./file-links";
import { clickDownload } from "./wrapper.svelte.js";

/** What an earlier version's row offers instead of the file's actions. */
const VERSION_ACTIONS: ItemActionGroup[] = [
	{
		actions: [
			{
				title: "Download",
				icon: DownloadIcon,
				action: (item) =>
					clickDownload(downloadUrl(item), item.metadata.name ?? item.key),
			},
			{
				title: "Restore",
				icon: RotateCcwIcon,
				action: (item) => pendingVersionAction.set({ item, action: "restore" }),
			},
		],
	},
	{
		actions: [
			{
				title: "Delete version",
				icon: TrashIcon,
				iconClass: "text-destructive",
				variant: "destructive",
				action: (item) => pendingVersionAction.set({ item, action: "delete" }),
			},
		],
	},
];

export function actionsFor(
	item: ObjectItem | undefined,
	itemActions: ItemActionGroup[],
): ItemActionGroup[] {
	return item && versionOf(item) ? VERSION_ACTIONS : itemActions;
}
