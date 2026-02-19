import type { RequestEvent } from "@sveltejs/kit";
import type { z } from "zod";
import type { Pathname } from "$app/types";
import { Http } from "$lib/server/http";
import { type HttpMethod, registry } from "./registry";

function formatZodErrors(result: {
	error?: { issues?: Array<{ path: PropertyKey[]; message: string }> };
}): string {
	const issues = result.error?.issues ?? [];
	return issues
		.map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
		.join(", ");
}

interface RouteConfig<
	TParams extends z.ZodType | undefined = undefined,
	TQuery extends z.ZodType | undefined = undefined,
	TBody extends z.ZodType | undefined = undefined,
	TResponse extends z.ZodType = z.ZodType,
> {
	method: HttpMethod;
	path: Pathname;
	summary?: string;
	description?: string;
	tags?: string[];
	params?: TParams;
	query?: TQuery;
	body?: TBody;
	response: TResponse;
	errors?: number[];
	isFormData?: boolean;
}

type InferOrUndefined<T> = T extends z.ZodType ? z.infer<T> : undefined;

interface ValidatedData<
	TParams extends z.ZodType | undefined,
	TQuery extends z.ZodType | undefined,
	TBody extends z.ZodType | undefined,
> {
	params: InferOrUndefined<TParams>;
	query: InferOrUndefined<TQuery>;
	body: InferOrUndefined<TBody>;
	event: RequestEvent;
}

type HandlerCallback<
	TParams extends z.ZodType | undefined,
	TQuery extends z.ZodType | undefined,
	TBody extends z.ZodType | undefined,
> = (
	data: ValidatedData<TParams, TQuery, TBody>,
) => Promise<Response> | Response;

/**
 * Registers a route definition with the OpenAPI registry and returns
 * a typed handler factory.
 *
 * Call this at module top-level in a route definition file (e.g.
 * `$lib/server/openapi/v1/storage.ts`). The returned object has a
 * `handler()` method you import in your `+server.ts` route files.
 *
 * The handler wrapper automatically:
 * - Checks authentication (returns 401 if no user)
 * - Validates path params, query params, body against Zod schemas
 * - Returns 400/422 on validation errors
 * - Passes fully typed `{ params, query, body, event }` to your callback
 *
 * @example
 * ```ts
 * // In $lib/server/openapi/v1/storage.ts
 * export const listFiles = defineRoute({
 *   method: "get",
 *   path: "/api/v1/storage/list",
 *   summary: "List all files",
 *   tags: ["Storage"],
 *   response: objectListSchema,
 * });
 *
 * // In routes/api/v1/storage/list/+server.ts
 * import { listFiles } from "$lib/server/openapi/v1/storage";
 *
 * export const GET = listFiles.handler(async ({ event }) => {
 *   const service = new StorageService(event.locals.user!);
 *   return Http.Ok(await service.listFiles());
 * });
 * ```
 */
export function defineRoute<
	TParams extends z.ZodType | undefined = undefined,
	TQuery extends z.ZodType | undefined = undefined,
	TBody extends z.ZodType | undefined = undefined,
	TResponse extends z.ZodType = z.ZodType,
>(config: RouteConfig<TParams, TQuery, TBody, TResponse>) {
	// Register with OpenAPI registry (side effect at import time)
	registry.registerRoute({
		method: config.method,
		path: config.path,
		summary: config.summary,
		description: config.description,
		tags: config.tags,
		params: config.params,
		query: config.query,
		body: config.body,
		response: config.response,
		errors: config.errors,
		isFormData: config.isFormData,
	});

	return {
		config,

		/**
		 * Creates a SvelteKit RequestHandler with auth + validation.
		 */
		handler(callback: HandlerCallback<TParams, TQuery, TBody>) {
			return async (event: RequestEvent): Promise<Response> => {
				// Auth check
				if (!event.locals.user) {
					return Http.Unauthorized();
				}

				// Validate path params
				let parsedParams = undefined as InferOrUndefined<TParams>;
				if (config.params) {
					const result = config.params.safeParse(event.params);
					if (!result.success) {
						return Http.BadRequest(
							`Invalid path parameters: ${formatZodErrors(result)}`,
						);
					}
					parsedParams = result.data as InferOrUndefined<TParams>;
				}

				// Validate query params
				let parsedQuery = undefined as InferOrUndefined<TQuery>;
				if (config.query) {
					const queryObj: Record<string, string> = {};
					for (const [key, value] of event.url.searchParams.entries()) {
						queryObj[key] = value;
					}
					const result = config.query.safeParse(queryObj);
					if (!result.success) {
						return Http.BadRequest(
							`Invalid query parameters: ${formatZodErrors(result)}`,
						);
					}
					parsedQuery = result.data as InferOrUndefined<TQuery>;
				}

				// Validate request body (skip for FormData routes)
				let parsedBody = undefined as InferOrUndefined<TBody>;
				if (config.body && !config.isFormData) {
					try {
						const rawBody = await event.request.json();
						const result = config.body.safeParse(rawBody);
						if (!result.success) {
							return Http.UnprocessableEntity(
								`Invalid request body: ${formatZodErrors(result)}`,
							);
						}
						parsedBody = result.data as InferOrUndefined<TBody>;
					} catch {
						return Http.BadRequest("Invalid JSON in request body");
					}
				}

				return callback({
					params: parsedParams,
					query: parsedQuery,
					body: parsedBody,
					event,
				});
			};
		},
	};
}

export type { RouteConfig, ValidatedData, HandlerCallback };
