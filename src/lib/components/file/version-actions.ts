import {
	DownloadIcon,
	FileArchiveIcon,
	FileOutputIcon,
	RotateCcwIcon,
	TrashIcon,
} from "@lucide/svelte";
import { toast } from "svelte-sonner";
import { api, type ObjectItem } from "#lib/api/index.js";
import * as m from "#lib/paraglide/messages.js";
import { pendingVersionAction, refreshVersions } from "#lib/store/versions.js";
import type { ItemAction, ItemActionGroup } from "#lib/utils.js";
import { versionOf } from "#lib/versions.js";
import { invalidate } from "$app/navigation";
import { page } from "$app/state";
import { clickDownload, downloadUrl, withLocation } from "./file-links";

/** Versions back out as files beside theirs; all of them without `ids`. */
async function extract(fileId: string, ids?: string[]) {
	const { data, error } = await api.POST(
		"/api/v1/storage/file/{id}/versions/extract",
		{ params: { path: { id: fileId } }, body: { ids } },
	);
	if (error || !data?.data) {
		toast.error(m.versions_extract_error());
		return;
	}
	toast.success(m.versions_extracted({ count: String(data.data.ids.length) }));
	await Promise.all([refreshVersions(fileId), invalidate("app:files")]);
}

/** A file's own history entries, shown only on a file that has one. */
export function fileHistoryActions(): ItemAction[] {
	const hidden = (item: ObjectItem) =>
		!(page.data.versioning && item.metadata.versionSeq);
	return [
		{
			title: "Download all versions",
			icon: FileArchiveIcon,
			fileOnly: true,
			hidden,
			action: (item) =>
				clickDownload(
					withLocation(
						`/api/v1/storage/file/${encodeURIComponent(item.metadata.id)}/versions/zip`,
					),
					`${item.metadata.name ?? item.key} (versions).zip`,
				),
		},
		{
			title: "Extract all versions",
			icon: FileOutputIcon,
			fileOnly: true,
			hidden,
			action: (item) => void extract(item.metadata.id),
		},
	];
}

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
			{
				title: "Extract as file",
				icon: FileOutputIcon,
				action: (item) => {
					const version = versionOf(item);
					if (version) {
						void extract(version.fileId, [version.id]);
					}
				},
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
