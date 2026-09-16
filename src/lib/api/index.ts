import createClient from "openapi-fetch";
import { browser } from "$app/environment";
import { navigating, page } from "$app/state";
import {
	DRIVE_HEADER,
	locationFrom,
	SHARE_HEADER,
	VOLUME_HEADER,
} from "$lib/storage-location";
import type { components, paths } from "./v1";

/**
 * Typed API client for the Penombre v1 API.
 *
 * Uses `openapi-fetch` backed by the generated OpenAPI types, providing
 * full autocomplete and type safety for paths, params, query, body, and responses.
 *
 * Requests are made with `credentials: "include"` so the session cookie is
 * automatically attached (cookie-based auth via better-auth).
 *
 * @example
 * ```ts
 * import { api } from "$lib/api";
 *
 * // GET /api/v1/storage/list
 * const { data, error } = await api.GET("/api/v1/storage/list", {
 *   params: { query: { sortColumn: "name", sortDirection: "asc" } },
 * });
 *
 * // POST /api/v1/storage/file
 * const { data, error } = await api.POST("/api/v1/storage/file", {
 *   body: { name: "hello.txt", path: "/" },
 * });
 * ```
 */
export const api = createClient<paths>({
	credentials: "include",
});

/**
 * Every call acts where the page is: a shared drive, a mounted volume, or the
 * caller's own drive.
 *
 * The alternative was threading the location through several dozen call sites
 * and remembering it at each new one; the route's own parameters are the same
 * answer and cannot fall out of step with the page. Server-side loads are
 * skipped — `page` is not theirs to read — so a load that needs it passes
 * `query: { drive }` / `{ volume }` itself, and an explicit one always wins.
 *
 * **The navigation target wins over the current page.** A load runs *during*
 * the navigation, while `page` still describes the page being left — so
 * leaving a drive for `/browse` fetched My Drive's listing with the drive's
 * header still on it, and the personal drive showed the shared drive's files
 * until a full reload. `navigating.to` is the route whose load is running.
 */
api.use({
	onRequest({ request }) {
		if (!browser) {
			return;
		}
		const url = new URL(request.url);
		if (
			url.searchParams.has("drive") ||
			url.searchParams.has("volume") ||
			url.searchParams.has("share")
		) {
			return;
		}

		const target = navigating.to ?? page;
		const { drive, volume, share } = locationFrom(target.params, target.url);
		if (drive) {
			request.headers.set(DRIVE_HEADER, drive);
		} else if (volume) {
			request.headers.set(VOLUME_HEADER, volume);
		} else if (share) {
			request.headers.set(SHARE_HEADER, share);
		}
	},
});

// Re-export schema types from the generated OpenAPI spec
export type ObjectItem = components["schemas"]["ObjectItem"];
export type ObjectList = components["schemas"]["ObjectList"];
export type UploadResult = components["schemas"]["UploadResult"];

// Re-export User from better-auth for convenience
export type { User } from "better-auth";

export type { components, paths };
