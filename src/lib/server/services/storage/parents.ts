import { and, inArray } from "drizzle-orm";

import type {
	File as DbFile,
	Folder as DbFolder,
} from "#lib/server/db/schema.js";
import { folders } from "#lib/server/db/schema.js";
import type { ObjectItem } from "#lib/server/schema.js";

import type { StorageContext } from "./context";
import {
	ancestorFolders,
	fileDbToObjectItem,
	folderDbToObjectItem,
} from "./mappers";
import { ownedFolders } from "./scope";

/** A search hit's folder, by path; none at the root. */
export function withParentKey(item: ObjectItem, path: string): ObjectItem {
	const cut = path.lastIndexOf("/");
	if (cut > 0) {
		item.parentKey = path.slice(0, cut);
	}
	return item;
}

/** Rows from anywhere in the tree, each with the folder it sits in. */
export async function locatedItems(
	ctx: StorageContext,
	pageFolders: DbFolder[],
	pageFiles: DbFile[],
): Promise<ObjectItem[]> {
	const items = [
		...pageFolders.map((f) => withParentKey(folderDbToObjectItem(f), f.path)),
		...pageFiles.map((f) => withParentKey(fileDbToObjectItem(f), f.path)),
	];
	await nameParents(ctx, items);
	return items;
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

/** Display names of these folder paths and all their ancestors. */
export async function folderNames(
	ctx: StorageContext,
	paths: string[],
): Promise<Map<string, string>> {
	const wanted = [
		...new Set(paths.flatMap((path) => ancestorFolders(`${path}/`))),
	];
	if (wanted.length === 0) {
		return new Map();
	}
	const named = await ctx.db
		.select({ name: folders.name, path: folders.path })
		.from(folders)
		.where(and(ownedFolders(ctx), inArray(folders.path, wanted)));
	return new Map(named.map((folder) => [folder.path, folder.name]));
}
