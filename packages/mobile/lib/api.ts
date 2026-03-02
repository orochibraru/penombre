/**
 * API client for the OpenDrive v1 API.
 *
 * The base URL should be configured via the EXPO_PUBLIC_API_URL env var
 * (e.g. "http://192.168.1.x:8080" during dev, or production URL).
 */

import createClient from "openapi-fetch";
import type { components, paths } from "./api.v1.d";

// ─── Re-export types from OpenAPI schema ─────────────────────────────────────

export type FileCategory =
	components["schemas"]["ObjectList"]["list"][number]["metadata"]["category"];
export type ObjectItem = components["schemas"]["ObjectItem"];
export type ObjectList = components["schemas"]["ObjectList"];
export type Activity = NonNullable<
	paths["/api/v1/activity"]["get"]["responses"]["200"]["content"]["application/json"]["data"]
>[number];
export type FileCounts = NonNullable<
	paths["/api/v1/storage/file/counts"]["get"]["responses"]["200"]["content"]["application/json"]["data"]
>;

// ─── API client ──────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5173";

const client = createClient<paths>({
	baseUrl: API_BASE,
	credentials: "include",
	headers: {
		"Content-Type": "application/json",
	},
});

// Add logging middleware
client.use({
	async onRequest({ request }) {
		// React Native doesn't set Origin automatically — better-auth requires it for CSRF
		if (!request.headers.get("origin")) {
			request.headers.set("origin", API_BASE);
		}
		console.log(`API Request: ${request.method} ${request.url}`);
		return request;
	},
	async onResponse({ response }) {
		console.log(`API Response: ${response.status} ${response.statusText}`);
		return response;
	},
});

function handleError(error?: unknown) {
	if (error instanceof Error) {
		return String(error.message);
	}

	if (error && typeof error === "object" && "message" in error) {
		return String((error as { message: string }).message);
	}

	return String(error);
}

function handleResponse<T>(response: { data?: T; error?: unknown }) {
	return {
		data: response.data,
		error: handleError(response.error),
	};
}

/** List files at the root (My Drive) */
export async function listFiles(_path?: string) {
	const { data, error } = await client.GET("/api/v1/storage/list");
	return handleResponse({ data: data?.data, error });
}

/** List recently modified files */
export async function listRecentFiles() {
	const { data, error } = await client.GET("/api/v1/storage/list/recent");
	return handleResponse({ data: data?.data, error });
}

/** List starred files */
export async function listStarredFiles() {
	const { data, error } = await client.GET("/api/v1/storage/file/starred");
	return handleResponse({ data: data?.data, error });
}

/** List trashed files */
export async function listTrashedFiles() {
	const { data, error } = await client.GET("/api/v1/storage/file/trash");
	return handleResponse({ data: data?.data, error });
}

/** List shared files */
export async function listSharedFiles() {
	// Note: Shared files endpoint may not be in the current API spec
	// Falling back to regular list for now
	const { data, error } = await client.GET("/api/v1/storage/list");
	return handleResponse({ data: data?.data, error });
}

/** List files by category */
export async function listFilesByCategory(category: FileCategory) {
	const { data, error } = await client.GET(
		"/api/v1/storage/file/category/{category}",
		{
			params: { path: { category } },
		},
	);
	return handleResponse({ data: data?.data, error });
}

/** Get file counts (trash, starred) */
export async function getFileCounts() {
	const { data, error } = await client.GET("/api/v1/storage/file/counts");
	return handleResponse({ data: data?.data, error });
}

/** Get recent activity */
export async function getActivity() {
	const { data, error } = await client.GET("/api/v1/activity");
	return handleResponse({ data: data?.data, error });
}

/** Toggle star on a file */
export async function toggleStar(fileId: string, isStarred: boolean) {
	const { data, error } = await client.PUT("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
		body: { isStarred },
	});
	return handleResponse({ data: data?.data, error });
}

/** Move a file to trash */
export async function trashFile(fileId: string) {
	const { data, error } = await client.PUT("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
		body: { isTrashed: true },
	});
	return handleResponse({ data: data?.data, error });
}

/** Restore a file from trash */
export async function restoreFile(fileId: string) {
	const { data, error } = await client.PUT("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
		body: { isTrashed: false },
	});
	return handleResponse({ data: data?.data, error });
}

/** Permanently delete a file */
export async function deleteFile(fileId: string) {
	const { data, error } = await client.DELETE("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
	});
	return handleResponse({ data: data?.data, error });
}

// ─── Authentication ──────────────────────────────────────────────────────────

export type AuthProvider = NonNullable<
	paths["/api/v1/auth/providers"]["get"]["responses"]["200"]["content"]["application/json"]["data"]
>[number];

export type User = components["schemas"]["User"];

/** Fetch available auth providers from the server */
export async function fetchAuthProviders() {
	const { data, error } = await client.GET("/api/v1/auth/providers");
	return handleResponse({ data: data?.data, error });
}

/** Check if user is authenticated by fetching activity (uses typed endpoint) */
export async function checkAuth(): Promise<{
	authenticated: boolean;
	error?: string;
}> {
	const { data, error } = await client.GET("/api/v1/activity");
	return {
		authenticated: !error && !!data,
		error: error ? handleError(error) : undefined,
	};
}

/** Sign in with email and password */
export async function signIn(
	email: string,
	password: string,
): Promise<{ success: boolean; error?: string }> {
	const { error } = await client.POST("/api/v1/auth/sign-in/email", {
		body: { email, password },
	});

	if (error) {
		return { success: false, error: handleError(error) };
	}

	return { success: true };
}

/**
 * Sign in with an OAuth provider.
 * Posts to /api/v1/auth/sign-in/oauth2 and returns the redirect URL to open in a browser.
 */
export async function signInWithOAuth(
	providerId: string,
	callbackURL: string,
): Promise<{ url?: string; error?: string }> {
	const { data, error } = await client.POST("/api/v1/auth/sign-in/oauth2", {
		body: { providerId, callbackURL },
	});

	if (error) {
		return { error: handleError(error) };
	}

	if (data?.url) {
		return { url: data.url };
	}

	return { error: "OAuth sign-in failed: no redirect URL returned" };
}

/** Sign out the current user */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
	const { error } = await client.POST("/api/v1/auth/sign-out", {});

	if (error) {
		return { success: false, error: handleError(error) };
	}

	return { success: true };
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
	fetchAuthProviders,
	checkAuth,
	signIn,
	signOut,
	signInWithOAuth,
};
