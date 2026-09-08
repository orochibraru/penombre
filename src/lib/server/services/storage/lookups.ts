/**
 * Lookups shared by the file, folder and listing modules.
 *
 * They live here rather than on one of those modules so none of them has to
 * depend on another just to resolve a path or de-duplicate a name.
 */

import { and, eq, isNull } from "drizzle-orm";
import { files, folders } from "$lib/server/db/schema";
import type { StorageContext } from "./context";

export async function getFolderIdByPath(
	ctx: StorageContext,
	path: string,
): Promise<string | null> {
	const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
	if (!normalized) {
		return null;
	}
	const [folder] = await ctx.db
		.select({ id: folders.id })
		.from(folders)
		.where(and(eq(folders.path, normalized), eq(folders.ownerId, ctx.user.id)));
	return folder?.id ?? null;
}

export async function getUniqueDisplayName(
	ctx: StorageContext,
	name: string,
	folder?: string,
	type: "file" | "folder" = "file",
): Promise<string> {
	const folderId = folder ? await getFolderIdByPath(ctx, folder) : null;

	let existingNames: Set<string>;
	if (type === "folder") {
		const existing = await ctx.db
			.select({ name: folders.name })
			.from(folders)
			.where(
				and(
					eq(folders.ownerId, ctx.user.id),
					eq(folders.isTrashed, false),
					folderId ? eq(folders.parentId, folderId) : isNull(folders.parentId),
				),
			);
		existingNames = new Set(existing.map((r) => r.name.toLowerCase()));
	} else {
		const existing = await ctx.db
			.select({ name: files.name })
			.from(files)
			.where(
				and(
					eq(files.ownerId, ctx.user.id),
					eq(files.isTrashed, false),
					folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
				),
			);
		existingNames = new Set(existing.map((r) => r.name.toLowerCase()));
	}

	if (!existingNames.has(name.toLowerCase())) {
		return name;
	}

	let baseName: string;
	let extension: string;
	if (type === "file" && name.includes(".")) {
		const lastDot = name.lastIndexOf(".");
		baseName = name.slice(0, lastDot);
		extension = name.slice(lastDot);
	} else {
		baseName = name;
		extension = "";
	}

	let counter = 1;
	let newName = `${baseName} (${counter})${extension}`;
	while (existingNames.has(newName.toLowerCase())) {
		counter++;
		newName = `${baseName} (${counter})${extension}`;
	}
	return newName;
}
