import createClient from "openapi-fetch";
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

// Re-export schema types from the generated OpenAPI spec
export type ObjectItem = components["schemas"]["ObjectItem"];
export type ObjectList = components["schemas"]["ObjectList"];
export type UploadResult = components["schemas"]["UploadResult"];

// Re-export User from better-auth for convenience
export type { User } from "better-auth";

export type { paths, components };
