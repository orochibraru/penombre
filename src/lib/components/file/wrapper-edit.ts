import { FileCodeIcon } from "@lucide/svelte";
import type { ObjectItem } from "#lib/api/index.js";
import { editorKindForName } from "#lib/documents.js";
import type { ItemAction } from "#lib/utils.js";
import { versionOf } from "#lib/versions.js";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { withLocation } from "./file-links";

/**
 * Text the plain editor can take. Documents already open in theirs, and a
 * version row only previews.
 */
function isPlainText(item: ObjectItem): boolean {
	const name = item.metadata.name ?? item.key;
	if (!item.metadata.id || versionOf(item) || editorKindForName(name)) {
		return false;
	}
	return (
		item.metadata.category === "CODE" ||
		/\.(txt|log)$/i.test(name) ||
		!name.includes(".")
	);
}

export const editAsText: ItemAction = {
	title: "Edit",
	icon: FileCodeIcon,
	action: (item) =>
		void goto(
			withLocation(
				resolve("/(app)/edit/[fileId]", { fileId: item.metadata.id ?? "" }),
			),
		),
	fileOnly: true,
	hidden: (item) => !isPlainText(item),
};
