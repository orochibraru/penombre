import { and, inArray } from "drizzle-orm";
import { folders } from "#lib/server/db/schema.js";
import type { ObjectItem } from "#lib/server/schema.js";
import type { StorageContext } from "./context";
import { ownedFolders } from "./scope";

/** A search hit's folder, by path; none at the root. */
export function withParentKey(item: ObjectItem, path: string): ObjectItem {
	const cut = path.lastIndexOf("/");
	if (cut > 0) {
		item.parentKey = path.slice(0, cut);
	}
	return item;
}

/** Names each item's folder, for the eye: `parentKey` is what it opens by. */
export async function nameParents(ctx: StorageContext, items: ObjectItem[]) {
	const paths = [
		...new Set(items.map((item) => item.parentKey).filter(Boolean)),
	] as string[];
	if (paths.length === 0) {
		return;
	}
	const named = await ctx.db
		.select({ name: folders.name, path: folders.path })
		.from(folders)
		.where(and(ownedFolders(ctx), inArray(folders.path, paths)));
	const nameOf = new Map(named.map((folder) => [folder.path, folder.name]));
	for (const item of items) {
		item.parent = item.parentKey ? nameOf.get(item.parentKey) : undefined;
	}
}
