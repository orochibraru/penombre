/**
 * Pure helpers shared across the storage modules: content-type lookup,
 * database-row → API-schema conversion, and small formatting utilities.
 * Nothing here touches the database, the driver, or the cache.
 */

import { createHash } from "node:crypto";
import { FileCategoryEnum } from "$lib/file-helpers";
import type { File as DbFile, Folder as DbFolder } from "$lib/server/db/schema";
import type {
	FileCategory,
	FileContentType,
	FileMetadata,
	ObjectItem,
	ObjectList,
} from "$lib/server/schema";
import fileTypesData from "./file-types.json" with { type: "json" };

interface FileTypesMapping {
	contentTypes: Record<string, FileContentType>;
	categories: Record<string, FileCategory>;
}

const fileTypes = fileTypesData as FileTypesMapping;

export function determineContentType(key: string): FileContentType {
	const extension = key.split(".").pop()?.toLowerCase();
	if (!extension) {
		return "application/octet-stream";
	}
	return fileTypes.contentTypes[extension] || "application/octet-stream";
}

export function determineCategory(key: string): FileCategory {
	const extension = key.split(".").pop()?.toLowerCase();
	if (!extension) {
		return FileCategoryEnum.UNKNOWN;
	}
	return fileTypes.categories[extension] || FileCategoryEnum.UNKNOWN;
}

export function fileDbToMetadata(file: DbFile): FileMetadata {
	return {
		id: file.id,
		name: file.name,
		category: file.category as FileCategory,
		contentType: file.contentType as FileContentType,
		tags: file.tags ?? [],
		createdAt: file.createdAt.toISOString(),
		owner: file.ownerId,
		isTrashed: file.isTrashed,
		isStarred: file.isStarred,
		music:
			file.musicDuration != null ? { duration: file.musicDuration } : undefined,
		video:
			file.videoDuration != null ? { duration: file.videoDuration } : undefined,
	};
}

export function folderDbToMetadata(folder: DbFolder): FileMetadata {
	return {
		id: folder.id,
		name: folder.name,
		category: FileCategoryEnum.UNKNOWN,
		contentType: "application/octet-stream",
		tags: folder.tags ?? [],
		createdAt: folder.createdAt.toISOString(),
		owner: folder.ownerId,
		isTrashed: folder.isTrashed,
		isStarred: folder.isStarred,
	};
}

export function fileDbToObjectItem(file: DbFile): ObjectItem {
	const pathSegment = file.path.includes("/")
		? (file.path.split("/").pop() ?? file.path)
		: file.path;
	return {
		key: pathSegment,
		size: file.size,
		updatedAt: file.updatedAt.toISOString(),
		metadata: fileDbToMetadata(file),
		type: "file",
	};
}

export function folderDbToObjectItem(folder: DbFolder): ObjectItem {
	const pathSegment = folder.path.includes("/")
		? (folder.path.split("/").pop() ?? folder.path)
		: folder.path;
	return {
		key: `${pathSegment}/`,
		size: 0,
		updatedAt: folder.updatedAt.toISOString(),
		metadata: folderDbToMetadata(folder),
		type: "folder",
	};
}

export function generateFileNameWithExtension(displayName: string): string {
	const uuid = crypto.randomUUID();
	const parts = displayName.split(".");
	if (parts.length === 1) {
		return uuid;
	}
	const extension = parts.slice(1).join(".");
	return `${uuid}.${extension}`;
}

export function extractExtension(filename: string): string {
	const parts = filename.split(".");
	if (parts.length === 1) {
		return "";
	}
	return parts.slice(1).join(".");
}

export function generateETag(data: { size: number; mtime: number }): string {
	const hash = createHash("md5")
		.update(`${data.size}-${data.mtime}`)
		.digest("hex");
	return `"${hash}"`;
}

export function buildDisplayPathForFile(opts: {
	filePath: string;
	displayName: string;
	folderBasePath: string;
	folderDisplayName: string;
	folderDisplayMap: Map<string, string>;
}): string {
	const {
		filePath,
		displayName,
		folderBasePath,
		folderDisplayName,
		folderDisplayMap,
	} = opts;
	const relPath = filePath.slice(folderBasePath.length + 1);
	const parts = relPath.split("/");
	parts.pop(); // remove filename segment

	const displayParts = [folderDisplayName];
	let currentPath = folderBasePath;
	for (const part of parts) {
		currentPath = `${currentPath}/${part}`;
		displayParts.push(folderDisplayMap.get(currentPath) ?? part);
	}
	displayParts.push(displayName);
	return displayParts.join("/");
}

export function searchDisplayName(item: ObjectItem): string {
	return (item.metadata.name || item.key).toLowerCase();
}

/**
 * Relevance weight for a search hit, highest first.
 * An exact name match outranks a prefix match, which outranks a plain hit;
 * folders come before files at equal relevance.
 */
function relevanceScore(
	name: string,
	item: ObjectItem,
	searchTerm: string,
): number {
	let score = 0;
	if (name === searchTerm) {
		score += 4;
	}
	if (name.startsWith(searchTerm)) {
		score += 2;
	}
	if (item.type === "folder") {
		score += 1;
	}
	return score;
}

/** Sort search hits by relevance, falling back to alphabetical order */
export function compareSearchRelevance(
	a: ObjectItem,
	b: ObjectItem,
	searchTerm: string,
): number {
	const nameA = searchDisplayName(a);
	const nameB = searchDisplayName(b);
	return (
		relevanceScore(nameB, b, searchTerm) -
			relevanceScore(nameA, a, searchTerm) || nameA.localeCompare(nameB)
	);
}

/** Slice `items` down to the requested page, keeping the unpaginated total */
export function paginateItems(
	items: ObjectItem[],
	options: { limit?: number; offset?: number },
): ObjectList {
	const offset = options.offset ?? 0;
	const paginated =
		options.limit || offset
			? items.slice(offset, options.limit ? offset + options.limit : undefined)
			: items;

	return { list: paginated, count: paginated.length, total: items.length };
}
