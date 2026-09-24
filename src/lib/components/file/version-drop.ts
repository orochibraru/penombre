import { toast } from "svelte-sonner";
import { api, type ObjectItem } from "#lib/api/index.js";
import * as m from "#lib/paraglide/messages.js";
import { locationOf } from "#lib/storage-location.js";
import {
	loadVersions,
	mergeVersionsOf,
	pendingVersionAction,
	refreshVersions,
} from "#lib/store/versions.js";
import { enqueueUploads } from "#lib/upload/manager.js";
import { isFolderItem, randomId } from "#lib/utils.js";
import { versionOf } from "#lib/versions.js";
import { invalidate } from "$app/navigation";
import { page } from "$app/state";

/** A file's content replaced by `file`, its old bytes kept as a version. */
export async function uploadVersion(item: ObjectItem, file: File) {
	// In a folder that does not version, a new upload would simply replace
	// the file and keep nothing.
	const { data } = await api.GET("/api/v1/storage/file/{id}/versions", {
		params: { path: { id: item.metadata.id } },
	});
	if (!data?.data?.versioning.enabled) {
		toast.info(m.versions_not_kept());
		return;
	}
	const folder = page.params.path ?? "";
	await enqueueUploads([
		{
			id: randomId(),
			fileId: item.metadata.id,
			finalName: folder ? `${folder}/${item.key}` : item.key,
			rowKey: item.key,
			location: locationOf(page.params),
			displayName: item.metadata.name ?? item.key,
			size: file.size,
			file,
			status: "pending",
			createdAt: Date.now(),
		},
	]);
}

/** Moves `moved` to where `onto` is, oldest first, and renumbers. */
async function reorder(fileId: string, moved: string, onto: string) {
	const versions = await loadVersions(fileId);
	if (!versions) {
		return;
	}
	const ids = versions.toSorted((a, b) => a.seq - b.seq).map((v) => v.id);
	const next = ids.filter((id) => id !== moved);
	next.splice(ids.indexOf(onto), 0, moved);
	const { error } = await api.PUT("/api/v1/storage/file/{id}/versions/order", {
		params: { path: { id: fileId } },
		body: { ids: next },
	});
	if (error) {
		toast.error(m.versions_reorder_error());
		return;
	}
	await Promise.all([refreshVersions(fileId), invalidate("app:files")]);
}

/**
 * What landing on a file or version row means. Files from the computer: a new
 * version. A file from the listing: the merge dialog. A version: its new place
 * among the others, or, dropped on its own file, a restore.
 */
async function drop(
	target: ObjectItem,
	dragged: ObjectItem | undefined,
	files: File[],
	onmerged: () => void,
) {
	const onto = versionOf(target);
	const file = onto?.file ?? target;
	if (files.length > 0) {
		if (files.length > 1) {
			toast.info(m.versions_drop_one());
			return;
		}
		await uploadVersion(file, files[0] as File);
		return;
	}
	if (!dragged) {
		return;
	}
	const moved = versionOf(dragged);
	if (moved) {
		if (moved.fileId !== file.metadata.id || moved.id === onto?.id) {
			return;
		}
		if (onto) {
			await reorder(moved.fileId, moved.id, onto.id);
		} else {
			pendingVersionAction.set({ item: dragged, action: "restore" });
		}
		return;
	}
	if (!isFolderItem(dragged) && dragged.metadata.id !== file.metadata.id) {
		mergeVersionsOf.set({ items: [dragged, file], onmerged });
	}
}

/**
 * Drag handlers for a file or version row. `dragged` is the listing's own
 * drag, read at drop time; `target` highlights the row under it.
 */
export function itemDrop(
	item: ObjectItem,
	ctx: {
		dragged: () => ObjectItem | undefined;
		setTarget: (key: string | undefined) => void;
		onmerged: () => void;
	},
) {
	const accepts = (e: DragEvent) => {
		if (e.dataTransfer?.types.includes("Files")) {
			return page.data.versioning === true;
		}
		const dragged = ctx.dragged();
		return !!dragged && dragged.key !== item.key && !isFolderItem(dragged);
	};
	return {
		ondragover: (e: DragEvent) => {
			if (!accepts(e)) {
				return;
			}
			// Not the listing's: a file dropped here is not an upload to the folder.
			e.preventDefault();
			e.stopPropagation();
			ctx.setTarget(item.key);
		},
		ondragleave: () => ctx.setTarget(undefined),
		ondrop: (e: DragEvent) => {
			if (!accepts(e)) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			ctx.setTarget(undefined);
			void drop(
				item,
				ctx.dragged(),
				Array.from(e.dataTransfer?.files ?? []),
				ctx.onmerged,
			);
		},
	};
}
