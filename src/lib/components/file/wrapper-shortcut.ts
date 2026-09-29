import { toast } from "svelte-sonner";
import { api, type ObjectItem } from "#lib/api/index.js";
import * as m from "#lib/paraglide/messages.js";
import { draggedFolder } from "#lib/store/shortcuts.js";
import { isFolderItem } from "#lib/utils.js";
import { invalidate } from "$app/navigation";
import { page } from "$app/state";

const nameOf = (item: ObjectItem) =>
	item.metadata.name || item.key.replace(/\/$/, "");

/** Offers a dragged folder to the sidebar, which clears it on `dragend`. */
export function offerFolderDrag(item: ObjectItem): ObjectItem {
	draggedFolder.set(
		isFolderItem(item) ? { id: item.metadata.id, name: nameOf(item) } : null,
	);
	return item;
}

export function isShortcut(item: ObjectItem): boolean {
	const shortcuts: Array<{ folderId: string }> = page.data.shortcuts ?? [];
	return shortcuts.some((shortcut) => shortcut.folderId === item.metadata.id);
}

/** Pins a folder to the sidebar, or unpins it. */
export async function toggleShortcut(item: ObjectItem): Promise<void> {
	const name = nameOf(item);
	const pinned = isShortcut(item);
	const { error } = pinned
		? await api.DELETE("/api/v1/shortcuts/{folderId}", {
				params: { path: { folderId: item.metadata.id } },
			})
		: await api.POST("/api/v1/shortcuts", {
				body: { folderId: item.metadata.id },
			});
	if (error) {
		toast.error(m.toast_shortcut_error());
		return;
	}
	toast.success(
		pinned
			? m.toast_shortcut_removed({ name })
			: m.toast_shortcut_added({ name }),
	);
	await invalidate("app:shortcuts");
}
