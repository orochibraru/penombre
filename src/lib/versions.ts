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
	/** The file it came from, when merged in from a separate file. */
	name: string | null;
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
			name: version.name,
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
	const version = versionOf(item);
	const name = version?.name || item.metadata.name || item.key;
	return version
		? `${name} · ${versionLabel(naming, version.seq, item.updatedAt ?? "")}`
		: name;
}

/** A render's take marker: ` (1)`, `-001`, `-v2`, a date stamp and what follows it. */
const TAKE_SUFFIXES = [
	/ \(\d+\)$/,
	/[-_ ]\d{4}-\d{2}-\d{2}(?:[-_ T]\d{2}[-_:.]\d{2}(?:[-_:.]\d{2})?)?.*$/,
	/[-_ ]v?\d{1,4}$/i,
];

/**
 * What a set of takes is a take of: `Song-001.wav`, `Song-002 (1).wav` and
 * `Song-2026-09-07-23_26_16-notes.wav` are all `Song.wav`. The extension is
 * the last name's.
 */
export function mergedName(names: string[]): string {
	const last = names.at(-1) ?? "";
	const dot = last.lastIndexOf(".");
	const extension = dot > 0 ? last.slice(dot) : "";
	const stems = names.map((name) => {
		let stem =
			name.lastIndexOf(".") > 0 ? name.slice(0, name.lastIndexOf(".")) : name;
		for (const suffix of TAKE_SUFFIXES) {
			stem = stem.replace(suffix, "");
		}
		return stem;
	});
	let common = stems[0] ?? "";
	for (const stem of stems) {
		let i = 0;
		while (i < common.length && common[i] === stem[i]) {
			i++;
		}
		common = common.slice(0, i);
	}
	common = common.replace(/[-_ .]+$/, "");
	return common ? `${common}${extension}` : last;
}

export type MergeOrder = "date" | "name";

const byName = (a: ObjectItem, b: ObjectItem) =>
	(a.metadata.name || a.key).localeCompare(
		b.metadata.name || b.key,
		undefined,
		{
			numeric: true,
			sensitivity: "base",
		},
	);

/**
 * Takes oldest first, as a merge keeps them: by their files' own dates, or by
 * name with numbers compared as numbers (`-2` before `-10`). The last stays.
 */
export function mergeOrder(items: ObjectItem[], by: MergeOrder): ObjectItem[] {
	const time = (item: ObjectItem) => new Date(item.updatedAt ?? 0).getTime();
	return items.toSorted(
		by === "date" ? (a, b) => time(a) - time(b) || byName(a, b) : byName,
	);
}
