import { z } from "zod";
import type { Pathname } from "$app/types";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface RouteDefinition {
	method: HttpMethod;
	path: Pathname;
	summary?: string;
	description?: string;
	tags?: string[];
	params?: z.ZodType;
	query?: z.ZodType;
	body?: z.ZodType;
	response: z.ZodType;
	errors?: number[];
	isFormData?: boolean;
	requireAuth?: boolean; // Default: true
}

interface SchemaRegistration {
	name: string;
	schema: z.ZodType;
}

/**
 * A full or partial OpenAPI 3.x document that can be merged into the registry.
 */
interface ExternalOpenAPISpec {
	paths?: Record<string, Record<string, unknown>>;
	components?: {
		schemas?: Record<string, unknown>;
		securitySchemes?: Record<string, unknown>;
		[key: string]: unknown;
	};
	tags?: Array<{ name: string; description?: string }>;
	[key: string]: unknown;
}

const ERROR_DESCRIPTIONS: Record<number, string> = {
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	409: "Conflict",
	422: "Unprocessable Entity",
	429: "Too Many Requests",
	500: "Internal Server Error",
};

/** Convert a Zod schema to JSON Schema, stripping the top-level $schema key */
function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
	const result = z.toJSONSchema(schema, { unrepresentable: "any" }) as Record<
		string,
		unknown
	>;
	// Remove $schema key — not needed inside OpenAPI component schemas
	const { $schema: _, ...rest } = result;
	return rest;
}

class OpenAPIRegistry {
	private routes: RouteDefinition[] = [];
	private schemas: SchemaRegistration[] = [];

	registerRoute(route: RouteDefinition): void {
		this.routes.push(route);
	}

	registerSchema(name: string, schema: z.ZodType): void {
		this.schemas.push({ name, schema });
	}

	/**
	 * Build the final OpenAPI spec, optionally merging one or more external specs.
	 *
	 * External specs (e.g. from better-auth's openAPI plugin) are deep-merged:
	 *   - paths are prefixed with `pathPrefix` and merged per-method (no duplicates)
	 *   - components/schemas are merged (external wins on conflict)
	 *   - tags are unioned by name
	 *   - securitySchemes are merged (ours win on conflict)
	 */
	toOpenAPISpec(
		externalSpecs: Array<{
			spec: ExternalOpenAPISpec;
			/** Prefix prepended to every path key, e.g. "/api/v1/auth" */
			pathPrefix?: string;
			/** Tag applied to every operation that has no tags */
			defaultTag?: string;
			/**
			 * Rename or remove tags from the external spec.
			 * Map original tag name → new name, or `null` to drop it entirely.
			 * e.g. `{ "Default": "Auth" }` or `{ "Default": null }`
			 */
			tagOverrides?: Record<string, string | null>;
		}> = [],
	): Record<string, unknown> {
		// ── 1. Build our own schemas ────────────────────────────────────
		const schemaComponents: Record<string, unknown> = {};

		for (const { name, schema } of this.schemas) {
			schemaComponents[name] = toJsonSchema(schema);
		}

		schemaComponents.StandardizedResponse = {
			type: "object",
			properties: {
				message: { type: "string" },
				data: {},
				context: {},
			},
		};

		schemaComponents.ErrorResponse = {
			type: "object",
			properties: {
				message: { type: "string" },
				context: {},
			},
		};

		const securitySchemes: Record<string, unknown> = {
			cookieAuth: {
				type: "apiKey",
				in: "cookie",
				name: "better-auth.session_token",
				description: "Session cookie set by better-auth",
			},
		};

		const tags: Array<{ name: string; description?: string }> = [];
		const tagNames = new Set<string>();

		// ── 2. Build paths from registered routes ───────────────────────
		const paths: Record<string, Record<string, unknown>> = {};

		for (const route of this.routes) {
			const pathEntry: Record<string, unknown> = {};
			const parameters: Record<string, unknown>[] = [];
			const responses: Record<string, unknown> = {};

			if (route.params) {
				const paramSchema = toJsonSchema(route.params);
				const properties = paramSchema.properties as
					| Record<string, unknown>
					| undefined;
				const required = (paramSchema.required as string[]) ?? [];

				if (properties) {
					for (const [name, schema] of Object.entries(properties)) {
						parameters.push({
							name,
							in: "path",
							required: required.includes(name) || true,
							schema,
						});
					}
				}
			}

			if (route.query) {
				const querySchema = toJsonSchema(route.query);
				const properties = querySchema.properties as
					| Record<string, unknown>
					| undefined;
				const required = (querySchema.required as string[]) ?? [];

				if (properties) {
					for (const [name, schema] of Object.entries(properties)) {
						parameters.push({
							name,
							in: "query",
							required: required.includes(name),
							schema,
						});
					}
				}
			}

			const responseSchema = toJsonSchema(route.response);
			responses["200"] = {
				description: "Successful response",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: { data: responseSchema },
						},
					},
				},
			};

			const errorCodes = route.errors ?? [401, 500];
			if (!errorCodes.includes(401)) errorCodes.push(401);
			if (!errorCodes.includes(500)) errorCodes.push(500);

			for (const code of errorCodes) {
				responses[String(code)] = {
					description: ERROR_DESCRIPTIONS[code] ?? `Error ${code}`,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/ErrorResponse" },
						},
					},
				};
			}

			pathEntry.summary = route.summary;
			if (route.description) pathEntry.description = route.description;
			if (route.tags?.length) pathEntry.tags = route.tags;
			if (parameters.length) pathEntry.parameters = parameters;
			pathEntry.responses = responses;

			const requireAuth = route.requireAuth !== false;
			if (requireAuth) {
				pathEntry.security = [{ cookieAuth: [] }];
			}

			if (route.body) {
				const contentType = route.isFormData
					? "multipart/form-data"
					: "application/json";
				pathEntry.requestBody = {
					required: true,
					content: { [contentType]: { schema: toJsonSchema(route.body) } },
				};
			}

			if (!paths[route.path]) {
				paths[route.path] = {};
			}
			const pathObj = paths[route.path];
			if (pathObj) {
				pathObj[route.method] = pathEntry;
			}
		}

		// ── 3. Merge external specs ─────────────────────────────────────
		for (const {
			spec,
			pathPrefix = "",
			defaultTag,
			tagOverrides = {},
		} of externalSpecs) {
			/** Apply tag overrides: rename or drop tags from an array */
			const remapTags = (operationTags: string[]): string[] => {
				if (!operationTags || Object.keys(tagOverrides).length === 0)
					return operationTags;
				return operationTags
					.map((t) => (t in tagOverrides ? tagOverrides[t] : t))
					.filter((t): t is string => t !== null);
			};
			// 3a. Merge schemas (external schemas first, ours win on conflict)
			if (spec.components?.schemas) {
				for (const [name, schema] of Object.entries(spec.components.schemas)) {
					if (!(name in schemaComponents)) {
						schemaComponents[name] = schema;
					}
				}
			}

			// 3b. Merge security schemes (ours win on conflict)
			if (spec.components?.securitySchemes) {
				for (const [name, scheme] of Object.entries(
					spec.components.securitySchemes,
				)) {
					if (!(name in securitySchemes)) {
						securitySchemes[name] = scheme;
					}
				}
			}

			// 3c. Merge tags (deduplicate by name, apply overrides)
			if (spec.tags) {
				for (const tag of spec.tags) {
					const mapped =
						tag.name in tagOverrides ? tagOverrides[tag.name] : tag.name;
					if (mapped === null || mapped === undefined) continue; // drop tag
					if (!tagNames.has(mapped)) {
						tagNames.add(mapped);
						tags.push({ ...tag, name: mapped });
					}
				}
			}

			// 3d. Merge paths with prefix, per-method (no overwrite)
			if (spec.paths) {
				for (const [rawPath, methods] of Object.entries(spec.paths)) {
					const fullPath = `${pathPrefix}${rawPath}`;

					if (!paths[fullPath]) {
						paths[fullPath] = {};
					}

					for (const [method, operation] of Object.entries(
						methods as Record<string, unknown>,
					)) {
						const pathObj = paths[fullPath];
						// Don't overwrite methods already defined by our routes
						if (pathObj && !(method in pathObj)) {
							if (typeof operation === "object" && operation !== null) {
								const op = operation as Record<string, unknown>;
								// Remap tags on the operation
								if (Array.isArray(op.tags)) {
									op.tags = remapTags(op.tags as string[]);
								}
								// Inject default tag if operation has no tags after remapping
								if (
									defaultTag &&
									(!op.tags || (Array.isArray(op.tags) && op.tags.length === 0))
								) {
									op.tags = [defaultTag];
								}
							}
							pathObj[method] = operation;
						}
					}
				}
			}
		}

		return {
			openapi: "3.1.0",
			info: {
				title: "Penombre API",
				version: "1.0.0",
				description: "Penombre file storage API",
			},
			servers: [{ url: "/", description: "Current server" }],
			paths,
			components: {
				schemas: schemaComponents,
				securitySchemes,
			},
			...(tags.length > 0 ? { tags } : {}),
			security: [{ cookieAuth: [] }],
		};
	}
}

export const registry = new OpenAPIRegistry();
export type { ExternalOpenAPISpec, HttpMethod, RouteDefinition };
