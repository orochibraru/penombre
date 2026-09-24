import { get, writable } from "svelte/store";
import { toast } from "svelte-sonner";
import { api, type ObjectItem } from "#lib/api/index.js";
import { m } from "#lib/paraglide/messages.js";
import type { ListedVersion } from "#lib/versions.js";

/** Files whose versions are unfolded in the listing, by file id. */
export const expandedVersions = writable<Record<string, ListedVersion[]>>({});

/** The file whose history the grid's modal shows; tiles do not unfold. */
export const historyFor = writable<ObjectItem | null>(null);

/** Files waiting on the merge dialog to become one file's versions. */
export const mergeVersionsOf = writable<{
	items: ObjectItem[];
	onmerged: () => void;
} | null>(null);

/** A restore or delete waiting on its confirmation dialog. */
export const pendingVersionAction = writable<{
	item: ObjectItem;
	action: "restore" | "delete";
} | null>(null);

async function fetchVersions(fileId: string): Promise<ListedVersion[] | null> {
	const { data, error } = await api.GET("/api/v1/storage/file/{id}/versions", {
		params: { path: { id: fileId } },
	});
	if (error || !data?.data) {
		toast.error(m.versions_load_error());
		return null;
	}
	return data.data.versions;
}

/** One file's versions, for the modal: not tied to what is unfolded. */
export function loadVersions(fileId: string): Promise<ListedVersion[] | null> {
	return fetchVersions(fileId);
}

export async function toggleVersions(fileId: string): Promise<void> {
	if (get(expandedVersions)[fileId]) {
		expandedVersions.update(({ [fileId]: _, ...rest }) => rest);
		return;
	}
	const versions = await fetchVersions(fileId);
	if (versions) {
		expandedVersions.update((all) => ({ ...all, [fileId]: versions }));
	}
}

/** Bumped whenever a file's versions change, for the modal to reload. */
export const versionsChanged = writable(0);

/** After a restore, delete or new upload: only what is already unfolded. */
export async function refreshVersions(fileId: string): Promise<void> {
	versionsChanged.update((n) => n + 1);
	if (!get(expandedVersions)[fileId]) {
		return;
	}
	const versions = await fetchVersions(fileId);
	if (versions) {
		expandedVersions.update((all) => ({ ...all, [fileId]: versions }));
	}
}
