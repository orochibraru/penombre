import createClient from "openapi-fetch";
import { authClient } from "@/lib/auth-client";
import { API_BASE } from "@/lib/constants";
import type { components, paths } from "./api.v1.d";

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

const client = createClient<paths>({
	baseUrl: API_BASE,
	credentials: "omit",
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

		const isAuthenticated = await authClient
			.getSession()
			.then((data) => {
				if (data.error) {
					return false;
				}
				if (data.data?.user) {
					return true;
				}
				return false;
			})
			.catch(() => false);
		if (isAuthenticated) {
			console.debug("User is authenticated, attaching cookies to API request");
			const cookies = authClient.getCookie();
			if (cookies) {
				console.debug("Attaching cookies to API request:", cookies);
				request.headers.set("cookie", cookies);
			}
		} else {
			console.debug("No authenticated user, proceeding without cookies");
		}

		return request;
	},
	async onResponse({ response }) {
		console.debug(`API Response: ${response.status} ${response.statusText}`);
		return response;
	},
	async onError({ error }) {
		if (error instanceof Error) {
			console.debug(`API Error: ${error.message}`);
			return new Response(error.message, { status: 500 });
		}
		console.debug("API Error", error);
		return new Response("Unknown API error", { status: 500 });
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

export async function listFiles(_path?: string) {
	const { data, error } = await client.GET("/api/v1/storage/list");
	return handleResponse({ data: data?.data, error });
}

export async function listRecentFiles() {
	const { data, error } = await client.GET("/api/v1/storage/list/recent");
	return handleResponse({ data: data?.data, error });
}

export async function listStarredFiles() {
	const { data, error } = await client.GET("/api/v1/storage/file/starred");
	return handleResponse({ data: data?.data, error });
}

export async function listTrashedFiles() {
	const { data, error } = await client.GET("/api/v1/storage/file/trash");
	return handleResponse({ data: data?.data, error });
}

export async function listSharedFiles() {
	// Note: Shared files endpoint may not be in the current API spec
	// Falling back to regular list for now
	const { data, error } = await client.GET("/api/v1/storage/list");
	return handleResponse({ data: data?.data, error });
}

export async function listFilesByCategory(category: FileCategory) {
	const { data, error } = await client.GET(
		"/api/v1/storage/file/category/{category}",
		{
			params: { path: { category } },
		},
	);
	return handleResponse({ data: data?.data, error });
}

export async function getFileCounts() {
	const { data, error } = await client.GET("/api/v1/storage/file/counts");
	return handleResponse({ data: data?.data, error });
}

export async function getActivity() {
	const { data, error } = await client.GET("/api/v1/activity");
	return handleResponse({ data: data?.data, error });
}

export async function toggleStar(fileId: string, isStarred: boolean) {
	const { data, error } = await client.PUT("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
		body: { isStarred },
	});
	return handleResponse({ data: data?.data, error });
}

export async function trashFile(fileId: string) {
	const { data, error } = await client.PUT("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
		body: { isTrashed: true },
	});
	return handleResponse({ data: data?.data, error });
}

export async function restoreFile(fileId: string) {
	const { data, error } = await client.PUT("/api/v1/storage/file/{id}", {
		params: { path: { id: fileId } },
		body: { isTrashed: false },
	});
	return handleResponse({ data: data?.data, error });
}

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

export async function fetchAuthProviders() {
	const { data, error } = await client.GET("/api/v1/auth/providers");
	return handleResponse({ data: data?.data, error });
}

export async function checkAuth(): Promise<{
	authenticated: boolean;
	error?: string;
}> {
	const { data, error } = await client.GET("/api/v1/auth/get-session");

	if (error) {
		console.log("Auth check failed:", handleError(error));
		return { authenticated: false, error: handleError(error) };
	}

	if (!data) {
		return { authenticated: false, error: "No data returned from auth check" };
	}

	if (!data.session || !data.user) {
		return { authenticated: false, error: "No active session" };
	}

	return { authenticated: true, error: undefined };
}

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
