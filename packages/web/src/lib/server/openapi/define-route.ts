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
	TService = undefined,
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
	requireAuth?: boolean; // Default: true
	service?: (user: NonNullable<App.Locals["user"]>) => TService;
}

type InferOrUndefined<T> = T extends z.ZodType ? z.infer<T> : undefined;

interface ValidatedData<
	TParams extends z.ZodType | undefined,
	TQuery extends z.ZodType | undefined,
	TBody extends z.ZodType | undefined,
	TService = undefined,
> {
	params: InferOrUndefined<TParams>;
	query: InferOrUndefined<TQuery>;
	body: InferOrUndefined<TBody>;
	event: RequestEvent;
	user: NonNullable<App.Locals["user"]>;
	service: TService;
}

type HandlerCallback<
	TParams extends z.ZodType | undefined,
	TQuery extends z.ZodType | undefined,
	TBody extends z.ZodType | undefined,
	TService = undefined,
> = (
	data: ValidatedData<TParams, TQuery, TBody, TService>,
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
 * export const GET = listFiles.handler(async ({ service }) => {
 *   return Http.Ok(await service.listFiles());
 * });
 * ```
 */
export function defineRoute<
	TParams extends z.ZodType | undefined = undefined,
	TQuery extends z.ZodType | undefined = undefined,
	TBody extends z.ZodType | undefined = undefined,
	TResponse extends z.ZodType = z.ZodType,
	TService = undefined,
>(config: RouteConfig<TParams, TQuery, TBody, TResponse, TService>) {
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
		requireAuth: config.requireAuth,
	});

	return {
		config,

		/**
		 * Creates a SvelteKit RequestHandler with auth + validation.
		 */
		handler(callback: HandlerCallback<TParams, TQuery, TBody, TService>) {
			return async (event: RequestEvent): Promise<Response> => {
				// Auth check (skip if requireAuth is false)
				const requireAuth = config.requireAuth !== false; // Default to true
				if (requireAuth && !event.locals.user) {
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
					let rawBody: unknown = {};
					try {
						rawBody = await event.request.json();
					} catch {
						// No body or empty body — fall back to empty object so that
						// routes with all-optional fields (e.g. DELETE) work without a body.
					}
					const result = config.body.safeParse(rawBody);
					if (!result.success) {
						return Http.UnprocessableEntity(
							`Invalid request body: ${formatZodErrors(result)}`,
						);
					}
					parsedBody = result.data as InferOrUndefined<TBody>;
				}

				return callback({
					params: parsedParams,
					query: parsedQuery,
					body: parsedBody,
					event,
					// biome-ignore lint/style/noNonNullAssertion: User is guaranteed to exist at this point if requireAuth !== false
					user: event.locals.user!,
					service:
						config.service && event.locals.user
							? config.service(event.locals.user)
							: (undefined as TService),
				});
			};
		},
	};
}

export type { HandlerCallback, RouteConfig, ValidatedData };
