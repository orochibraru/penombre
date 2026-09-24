import type { ObjectItem, paths } from "#lib/api/index.js";

export type VersionNaming = "sequential" | "date";

export type ListedVersion = NonNullable<
	paths["/api/v1/storage/file/{id}/versions"]["get"]["responses"][200]["content"]["application/json"]["data"]
>["versions"][number];

/** What makes a listing row an earlier version rather than a file. */
export interface VersionRef {
	fileId: string;
	/** The file's own row, so a version can always get back to the rest. */
	file: ObjectItem;
	id: string;
	seq: number;
	authorName: string | null;
}

/** `v3`, or the moment that version was kept, per the user's preference. */
export function versionLabel(
	naming: VersionNaming | undefined,
	seq: number,
	at: string | Date,
): string {
	return naming === "date" ? new Date(at).toLocaleString() : `v${seq}`;
}

export function versionOf(item: ObjectItem): VersionRef | undefined {
	return (item as ObjectItem & { version?: VersionRef }).version;
}

/**
 * A version as a listing row: the file's row with the version's bytes. Its id
 * and key are its own, so it never collides with the file in a keyed `each`,
 * a selection or the upload stores.
 */
export function versionItem(file: ObjectItem, version: ListedVersion) {
	return {
		...file,
		key: `${file.key}@${version.id}`,
		size: version.size,
		updatedAt: version.createdAt,
		metadata: {
			...file.metadata,
			id: `${file.metadata.id}:v:${version.id}`,
			contentType: version.contentType as ObjectItem["metadata"]["contentType"],
			isStarred: false,
			versionSeq: undefined,
			music: undefined,
			video: undefined,
		},
		version: {
			fileId: file.metadata.id,
			file,
			id: version.id,
			seq: version.seq,
			authorName: version.authorName,
		},
	} satisfies ObjectItem & { version: VersionRef };
}

/**
 * The rows a layout renders: each expanded file followed by its versions.
 * Rows, not a panel, so the virtualizer's fixed row height stays exact.
 */
export function withVersions(
	items: ObjectItem[],
	expanded: Record<string, ListedVersion[]>,
): ObjectItem[] {
	if (Object.keys(expanded).length === 0) {
		return items;
	}
	return items.flatMap((item) => {
		const versions = expanded[item.metadata.id];
		return versions
			? [item, ...versions.map((version) => versionItem(item, version))]
			: [item];
	});
}

/** What the player and the listing call a row: a version names its take. */
export function displayTitle(
	item: ObjectItem,
	naming: VersionNaming | undefined,
): string {
	const name = item.metadata.name || item.key;
	const version = versionOf(item);
	return version
		? `${name} · ${versionLabel(naming, version.seq, item.updatedAt ?? "")}`
		: name;
}
