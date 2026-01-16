import type { User } from "better-auth";
import { hc } from "hono/client";
import type { Router } from "$lib/api-types";

// The client type - extract from the hc function
type Client = ReturnType<typeof hc<Router>>;

let browserClient: Client;

export const getApiClient = (customFetch?: typeof fetch): Client => {
	const isBrowser = typeof window !== "undefined";
	const origin = isBrowser ? window.location.origin : "";

	if (isBrowser && browserClient) {
		browserClient = hc<Router>(`${origin}/api`, { fetch: customFetch });
		return browserClient;
	}

	const client = hc<Router>(`${origin}/api`, { fetch: customFetch });

	if (isBrowser) {
		browserClient = client;
	}

	return client;
};

// Re-export schema types from server for convenience
// These are used by components that need to type their props
export type { ObjectItem, ObjectList, UploadResult } from "$lib/server/schema";

// Re-export User from better-auth
export type { User };

// Export the client type for external use
export type ApiClient = Client;
