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

/** Either the parsed value, or the error Response to return instead. */
type ParseOutcome<T> = { data: T } | { response: Response };

/** Validate `value` against `schema`, turning a failure into an error Response. */
function parseOrRespond<T extends z.ZodType>(
	schema: T,
	value: unknown,
	toResponse: (message: string) => Response,
): ParseOutcome<z.infer<T>> {
	const result = schema.safeParse(value);
	if (!result.success) {
		return { response: toResponse(formatZodErrors(result)) };
	}
	return { data: result.data };
}

function parseQueryParams<T extends z.ZodType>(
	schema: T,
	url: URL,
): ParseOutcome<z.infer<T>> {
	const queryObj: Record<string, string> = {};
	for (const [key, value] of url.searchParams.entries()) {
		queryObj[key] = value;
	}
	return parseOrRespond(schema, queryObj, (message) =>
		Http.BadRequest(`Invalid query parameters: ${message}`),
	);
}

async function parseJsonBody<T extends z.ZodType>(
	schema: T,
	request: Request,
): Promise<ParseOutcome<z.infer<T>>> {
	let rawBody: unknown = {};
	try {
		rawBody = await request.json();
	} catch {
		// No body or empty body — fall back to empty object so that
		// routes with all-optional fields (e.g. DELETE) work without a body.
	}
	return parseOrRespond(schema, rawBody, (message) =>
		Http.UnprocessableEntity(`Invalid request body: ${message}`),
	);
}

/**
 * Validate path params, query params and JSON body against the route's schemas.
 * Returns the first error Response, or the parsed values.
 */
async function validateRequest<
	TParams extends z.ZodType | undefined,
	TQuery extends z.ZodType | undefined,
	TBody extends z.ZodType | undefined,
>(
	config: {
		params?: TParams;
		query?: TQuery;
		body?: TBody;
		isFormData?: boolean;
	},
	event: RequestEvent,
): Promise<
	| { response: Response }
	| {
			params: InferOrUndefined<TParams>;
			query: InferOrUndefined<TQuery>;
			body: InferOrUndefined<TBody>;
	  }
> {
	let params = undefined as InferOrUndefined<TParams>;
	if (config.params) {
		const result = parseOrRespond(config.params, event.params, (message) =>
			Http.BadRequest(`Invalid path parameters: ${message}`),
		);
		if ("response" in result) {
			return result;
		}
		params = result.data as InferOrUndefined<TParams>;
	}

	let query = undefined as InferOrUndefined<TQuery>;
	if (config.query) {
		const result = parseQueryParams(config.query, event.url);
		if ("response" in result) {
			return result;
		}
		query = result.data as InferOrUndefined<TQuery>;
	}

	// FormData routes parse their own body inside the handler
	let body = undefined as InferOrUndefined<TBody>;
	if (config.body && !config.isFormData) {
		const result = await parseJsonBody(config.body, event.request);
		if ("response" in result) {
			return result;
		}
		body = result.data as InferOrUndefined<TBody>;
	}

	return { params, query, body };
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

				const validated = await validateRequest(config, event);
				if ("response" in validated) {
					return validated.response;
				}

				return callback({
					params: validated.params,
					query: validated.query,
					body: validated.body,
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
