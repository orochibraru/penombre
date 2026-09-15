import createClient from "openapi-fetch";
import { browser } from "$app/environment";
import { page } from "$app/state";
import { DRIVE_HEADER } from "$lib/drives";
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
 * Inside a shared drive, every call acts on that drive.
 *
 * The alternative was threading a `drive` argument through several dozen call
 * sites and remembering it at each new one; the route's own parameter is the
 * same answer and cannot fall out of step with the page. Server-side loads are
 * skipped — `page` is not theirs to read — so a load that needs a drive passes
 * `query: { drive }` itself, and an explicit one always wins.
 *
 * It travels as `DRIVE_HEADER` rather than as a query parameter — see that
 * constant for why. The server takes either, and `?drive=` stays the
 * documented spelling for media URLs and the upload worker, which have no
 * client to carry a header for them.
 */
api.use({
	onRequest({ request }) {
		// The route parameter inside a drive; the query parameter on the pages
		// reached from one (`/edit`, `/view`), which live outside `/drives`.
		const drive = browser
			? (page.params.drive ?? page.url.searchParams.get("drive"))
			: undefined;
		if (drive && !new URL(request.url).searchParams.has("drive")) {
			request.headers.set(DRIVE_HEADER, drive);
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
