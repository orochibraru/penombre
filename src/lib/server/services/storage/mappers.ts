/**
 * Pure helpers shared across the storage modules: content-type lookup,
 * database-row → API-schema conversion, and small formatting utilities.
 * Nothing here touches the database, the driver, or the cache.
 */

import { createHash } from "node:crypto";
import { FileCategoryEnum } from "#lib/file-helpers.js";
import type {
	File as DbFile,
	Folder as DbFolder,
} from "#lib/server/db/schema.js";
import type {
	FileCategory,
	FileContentType,
	FileMetadata,
	ObjectItem,
	ObjectList,
} from "#lib/server/schema.js";
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

/** Types a browser renders as a page and can run script from. */
const ACTIVE_CONTENT_TYPES = new Set([
	"text/html",
	"application/xhtml+xml",
	"image/svg+xml",
	"application/xml",
	"text/xml",
]);

/** Whether opening this type directly in a browser can run script. */
export function isActiveContentType(contentType: string): boolean {
	return ACTIVE_CONTENT_TYPES.has(contentType.toLowerCase());
}

/**
 * Headers on every raw file response, whoever's serving it.
 *
 * `sandbox` strips scripts, forms and navigation from anything rendered
 * inline; `nosniff` stops the browser guessing past the declared type. PDFs
 * skip the sandbox: Chrome refuses to display a sandboxed PDF at all, which
 * broke every `<embed>` preview, and a PDF runs no script on our origin.
 */
export function rawFileSecurityHeaders(
	contentType: string,
): Record<string, string> {
	return contentType.toLowerCase() === "application/pdf"
		? { "X-Content-Type-Options": "nosniff" }
		: {
				"Content-Security-Policy": "sandbox",
				"X-Content-Type-Options": "nosniff",
			};
}

/** Parse `Range: bytes=start-end` against a known length. */
export function parseRange(
	header: string | null,
	size: number,
): { start: number; end: number } | null {
	const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
	if (!match) {
		return null;
	}
	const [, rawStart, rawEnd] = match;
	// A suffix range ("-500") means the last N bytes.
	const start = rawStart ? Number(rawStart) : size - Number(rawEnd || 0);
	const end = rawStart ? (rawEnd ? Number(rawEnd) : size - 1) : size - 1;
	if (!(Number.isFinite(start) && Number.isFinite(end))) {
		return null;
	}
	if (start < 0 || end >= size || start > end) {
		return null;
	}
	return { start, end };
}

export function determineCategory(key: string): FileCategory {
	const extension = key.split(".").pop()?.toLowerCase();
	if (!extension) {
		return FileCategoryEnum.UNKNOWN;
	}
	return fileTypes.categories[extension] || FileCategoryEnum.UNKNOWN;
}

/** Every ancestor directory of a key: `a/b/c.mp3` → `a`, `a/b` */
export function ancestorFolders(key: string): string[] {
	const segments = key.split("/");
	segments.pop();

	const result: string[] = [];
	for (let i = 1; i <= segments.length; i++) {
		result.push(segments.slice(0, i).join("/"));
	}
	return result;
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

/**
 * A keyset cursor: the sort column's value on the last row seen, plus its id.
 * `k` marks a folder row in a listing that pages folders before files.
 */
export interface ListingCursor {
	v: string | number;
	id: string;
	k?: "folder";
}

/** Opaque to the client on purpose: the sort value and id are ours to reshape. */
export function encodeCursor(cursor: ListingCursor): string {
	return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

/** A cursor that fails to decode is treated as "start over", not a 400. */
export function decodeCursor(raw: string): ListingCursor | null {
	try {
		const parsed: unknown = JSON.parse(
			Buffer.from(raw, "base64url").toString("utf8"),
		);
		if (
			parsed &&
			typeof parsed === "object" &&
			"v" in parsed &&
			"id" in parsed &&
			(typeof parsed.v === "string" || typeof parsed.v === "number") &&
			typeof parsed.id === "string"
		) {
			return parsed as ListingCursor;
		}
		return null;
	} catch {
		return null;
	}
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
