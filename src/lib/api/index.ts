import createClient from "openapi-fetch";
import {
	DRIVE_HEADER,
	locationFrom,
	SHARE_HEADER,
	VOLUME_HEADER,
} from "#lib/storage-location.js";
import { browser } from "$app/env";
import { page } from "$app/state";
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
 * import { api } from "#lib/api/index.js";
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
const defaultFetch = (request: Request) => globalThis.fetch(request);

export const api = createClient<paths>({
	credentials: "include",
	fetch: defaultFetch,
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
 * **Loads are skipped too.** A load passes its own `fetch` and runs for a
 * route that is not `page` yet: during a navigation `page` is the one being
 * left, and during a hover preload even `navigating` is empty. Either way
 * the drive's header rode along to `/browse`, and My Drive showed the shared
 * drive's files. Every universal load is a personal-drive route, which is the
 * server's default, so a load names nothing.
 */
api.use({
	onRequest({ request, options }) {
		if (!browser || options.fetch !== defaultFetch) {
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

		const { drive, volume, share } = locationFrom(page.params, page.url);
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
