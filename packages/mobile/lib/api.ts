/**
 * API client for the OpenDrive v1 API.
 *
 * The base URL should be configured via the EXPO_PUBLIC_API_URL env var
 * (e.g. "http://192.168.1.x:8080" during dev, or production URL).
 */

// ─── Types (mirrored from the web OpenAPI schema) ────────────────────────────

export type FileCategory =
	| "MUSIC"
	| "DOCUMENTS"
	| "IMAGES"
	| "3D"
	| "VIDEO"
	| "RECENT"
	| "CODE"
	| "ARCHIVES"
	| "UNKNOWN";

export type ObjectItemMetadata = {
	id: string;
	name?: string;
	category: FileCategory;
	tags?: string[];
	contentType: string;
	createdAt: string;
	owner: string;
	isTrashed: boolean;
	isStarred: boolean;
	music?: { duration?: number };
	video?: { duration?: number };
};

export type ObjectItem = {
	key: string;
	updatedAt?: string;
	size?: number;
	metadata: ObjectItemMetadata;
	type: "file" | "folder";
	parent?: string;
	parentKey?: string;
};

export type ObjectList = {
	list: ObjectItem[];
	count: number;
	total: number;
};

export type Activity = {
	id: string;
	userId: string;
	action: string;
	message: string;
	link?: string;
	level: string;
	createdAt: string;
};

export type UserSession = {
	id: string;
	email: string;
	name: string;
	image?: string;
	role?: string;
};

export type FileCounts = {
	trash: number;
	starred: number;
};

// ─── API client ──────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(
	path: string,
	options?: RequestInit,
): Promise<{ data?: T; error?: string }> {
	try {
		const res = await fetch(`${API_BASE}${path}`, {
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
			credentials: "include",
			...options,
		});
		if (!res.ok) {
			const body = await res.text().catch(() => "");
			return { error: `${res.status}: ${body || res.statusText}` };
		}
		const json = await res.json();
		return { data: json.data ?? json };
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}

/** List files at the root (My Drive) */
export function listFiles(path?: string) {
	const params = path ? `?prefix=${encodeURIComponent(path)}` : "";
	return apiFetch<ObjectList>(`/api/v1/storage/list${params}`);
}

/** List recently modified files */
export function listRecentFiles() {
	return apiFetch<ObjectList>("/api/v1/storage/list/recent");
}

/** List starred files */
export function listStarredFiles() {
	return apiFetch<ObjectList>("/api/v1/storage/list/starred");
}

/** List trashed files */
export function listTrashedFiles() {
	return apiFetch<ObjectList>("/api/v1/storage/list/trash");
}

/** List shared files */
export function listSharedFiles() {
	return apiFetch<ObjectList>("/api/v1/storage/list/shared");
}

/** List files by category */
export function listFilesByCategory(category: FileCategory) {
	return apiFetch<ObjectList>(`/api/v1/storage/list/category/${category}`);
}

/** Get file counts (trash, starred) */
export function getFileCounts() {
	return apiFetch<FileCounts>("/api/v1/storage/file/counts");
}

/** Get recent activity */
export function getActivity() {
	return apiFetch<Activity[]>("/api/v1/activity");
}

/** Toggle star on a file */
export function toggleStar(fileId: string) {
	return apiFetch<void>(`/api/v1/storage/file/${fileId}/star`, {
		method: "POST",
	});
}

/** Move a file to trash */
export function trashFile(fileId: string) {
	return apiFetch<void>(`/api/v1/storage/file/${fileId}/trash`, {
		method: "POST",
	});
}

/** Restore a file from trash */
export function restoreFile(fileId: string) {
	return apiFetch<void>(`/api/v1/storage/file/${fileId}/restore`, {
		method: "POST",
	});
}

/** Permanently delete a file */
export function deleteFile(fileId: string) {
	return apiFetch<void>(`/api/v1/storage/file/${fileId}`, {
		method: "DELETE",
	});
}

export default {
	listFiles,
	listRecentFiles,
	listStarredFiles,
	listTrashedFiles,
	listSharedFiles,
	listFilesByCategory,
	getFileCounts,
	getActivity,
	toggleStar,
	trashFile,
	restoreFile,
	deleteFile,
};
