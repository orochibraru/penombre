/**
 * Duplicating an item in place: the context-menu action and ⌘D / Ctrl+D.
 *
 * A file has its own endpoint; a folder is copied into its own parent through
 * the transfer endpoint, which is what walks the subtree.
 */

import { toast } from "svelte-sonner";
import { api, type ObjectItem } from "#lib/api/index.js";
import * as m from "#lib/paraglide/messages.js";
import { locationOf } from "#lib/storage-location.js";
import { invalidate } from "$app/navigation";
import { page } from "$app/state";

async function duplicateFile(path: string): Promise<void> {
	const { error } = await api.POST("/api/v1/storage/file/{id}/duplicate", {
		params: { path: { id: encodeURIComponent(path) } },
	});
	if (error) {
		throw new Error("Failed to duplicate file");
	}
}

async function duplicateFolder(path: string, parent: string): Promise<void> {
	const { data, error } = await api.POST("/api/v1/storage/transfer", {
		body: {
			items: [{ path, type: "folder" }],
			destination: { ...locationOf(page.params), folder: parent },
			mode: "copy",
		},
	});
	if (error || !data?.data || data.data.failCount > 0) {
		throw new Error("Failed to duplicate folder");
	}
}

export function duplicateItem(item: ObjectItem, currentFolder: string): void {
	const name = item.metadata.name ?? item.key;
	const key = item.key.replace(/\/$/, "");
	const path = currentFolder ? `${currentFolder}/${key}` : key;

	const done = (
		item.type === "folder"
			? duplicateFolder(path, currentFolder)
			: duplicateFile(path)
	).then(() => invalidate("app:files"));

	toast.promise(done, {
		loading: m.toast_duplicating({ name }),
		success: m.toast_duplicated({ name }),
		error: m.toast_duplicate_error({ name }),
	});
}

/** ⌘D / Ctrl+D, but never while typing: it is the browser's bookmark key. */
export function isDuplicateShortcut(e: KeyboardEvent): boolean {
	const target = e.target as HTMLElement | null;
	const typing =
		target?.isContentEditable ||
		["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
	return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && !typing;
}
