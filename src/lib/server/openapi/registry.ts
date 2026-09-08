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

export interface ExternalSpec {
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

/** Path and query parameters, flattened into OpenAPI `parameters` entries */
function buildParameters(route: RouteDefinition): Record<string, unknown>[] {
	const parameters: Record<string, unknown>[] = [];

	if (route.params) {
		const paramSchema = toJsonSchema(route.params);
		const properties = paramSchema.properties as
			| Record<string, unknown>
			| undefined;
		for (const [name, schema] of Object.entries(properties ?? {})) {
			parameters.push({ name, in: "path", required: true, schema });
		}
	}

	if (route.query) {
		const querySchema = toJsonSchema(route.query);
		const properties = querySchema.properties as
			| Record<string, unknown>
			| undefined;
		const required = (querySchema.required as string[] | undefined) ?? [];
		for (const [name, schema] of Object.entries(properties ?? {})) {
			parameters.push({
				name,
				in: "query",
				required: required.includes(name),
				schema,
			});
		}
	}

	return parameters;
}

/** The 200 response plus every declared error code (401 and 500 are always present) */
function buildResponses(route: RouteDefinition): Record<string, unknown> {
	const responses: Record<string, unknown> = {
		"200": {
			description: "Successful response",
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: { data: toJsonSchema(route.response) },
					},
				},
			},
		},
	};

	for (const code of new Set([...(route.errors ?? [401, 500]), 401, 500])) {
		responses[String(code)] = {
			description: ERROR_DESCRIPTIONS[code] ?? `Error ${code}`,
			content: {
				"application/json": {
					schema: { $ref: "#/components/schemas/ErrorResponse" },
				},
			},
		};
	}

	return responses;
}

/** The OpenAPI operation object for a single registered route */
function buildPathEntry(route: RouteDefinition): Record<string, unknown> {
	const pathEntry: Record<string, unknown> = { summary: route.summary };

	if (route.description) {
		pathEntry.description = route.description;
	}
	if (route.tags?.length) {
		pathEntry.tags = route.tags;
	}

	const parameters = buildParameters(route);
	if (parameters.length) {
		pathEntry.parameters = parameters;
	}

	pathEntry.responses = buildResponses(route);

	if (route.requireAuth !== false) {
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

	return pathEntry;
}

/** Apply tag overrides: rename or drop tags from an array */
function remapTags(
	operationTags: string[],
	tagOverrides: Record<string, string | null>,
): string[] {
	if (Object.keys(tagOverrides).length === 0) {
		return operationTags;
	}
	return operationTags
		.map((t) => (t in tagOverrides ? tagOverrides[t] : t))
		.filter((t): t is string => t !== null);
}

/** Merge external schemas and security schemes; ours win on conflict */
function mergeExternalComponents(
	spec: ExternalOpenAPISpec,
	schemaComponents: Record<string, unknown>,
	securitySchemes: Record<string, unknown>,
): void {
	for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
		if (!(name in schemaComponents)) {
			schemaComponents[name] = schema;
		}
	}
	for (const [name, scheme] of Object.entries(
		spec.components?.securitySchemes ?? {},
	)) {
		if (!(name in securitySchemes)) {
			securitySchemes[name] = scheme;
		}
	}
}

/** Merge external tags, deduplicating by name and applying overrides */
function mergeExternalTags(
	spec: ExternalOpenAPISpec,
	tagOverrides: Record<string, string | null>,
	tags: Array<{ name: string; description?: string }>,
	tagNames: Set<string>,
): void {
	for (const tag of spec.tags ?? []) {
		const mapped = tag.name in tagOverrides ? tagOverrides[tag.name] : tag.name;
		if (mapped === null || mapped === undefined) {
			continue; // drop tag
		}
		if (!tagNames.has(mapped)) {
			tagNames.add(mapped);
			tags.push({ ...tag, name: mapped });
		}
	}
}

/** Retag an external operation in place, falling back to `defaultTag` */
function retagOperation(
	operation: unknown,
	tagOverrides: Record<string, string | null>,
	defaultTag?: string,
): void {
	if (typeof operation !== "object" || operation === null) {
		return;
	}
	const op = operation as Record<string, unknown>;
	if (Array.isArray(op.tags)) {
		op.tags = remapTags(op.tags as string[], tagOverrides);
	}
	if (defaultTag && (!Array.isArray(op.tags) || op.tags.length === 0)) {
		op.tags = [defaultTag];
	}
}

/** Merge external paths under `pathPrefix`, never overwriting our own routes */
function mergeExternalPaths(
	{ spec, pathPrefix = "", defaultTag, tagOverrides = {} }: ExternalSpec,
	paths: Record<string, Record<string, unknown>>,
): void {
	for (const [rawPath, methods] of Object.entries(spec.paths ?? {})) {
		const fullPath = `${pathPrefix}${rawPath}`;
		const pathObj = paths[fullPath] ?? {};
		paths[fullPath] = pathObj;

		for (const [method, operation] of Object.entries(
			methods as Record<string, unknown>,
		)) {
			// Don't overwrite methods already defined by our routes
			if (method in pathObj) {
				continue;
			}
			retagOperation(operation, tagOverrides, defaultTag);
			pathObj[method] = operation;
		}
	}
}

class OpenAPIRegistry {
	private readonly routes: RouteDefinition[] = [];
	private readonly schemas: SchemaRegistration[] = [];

	registerRoute(route: RouteDefinition): void {
		this.routes.push(route);
	}

	registerSchema(name: string, schema: z.ZodType): void {
		this.schemas.push({ name, schema });
	}

	/** Component schemas for every registered Zod schema, plus the shared envelopes */
	private buildSchemaComponents(): Record<string, unknown> {
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

		return schemaComponents;
	}

	/** Paths keyed by route path, each holding one entry per HTTP method */
	private buildPaths(): Record<string, Record<string, unknown>> {
		const paths: Record<string, Record<string, unknown>> = {};

		for (const route of this.routes) {
			const pathObj = paths[route.path] ?? {};
			pathObj[route.method] = buildPathEntry(route);
			paths[route.path] = pathObj;
		}

		return paths;
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
	toOpenAPISpec(externalSpecs: ExternalSpec[] = []): Record<string, unknown> {
		const schemaComponents = this.buildSchemaComponents();
		const securitySchemes: Record<string, unknown> = {
			cookieAuth: {
				type: "apiKey",
				in: "cookie",
				name: "better-auth.session_token",
				description: "Session cookie set by better-auth",
			},
		};
		const paths = this.buildPaths();
		const tags: Array<{ name: string; description?: string }> = [];
		const tagNames = new Set<string>();

		for (const externalSpec of externalSpecs) {
			mergeExternalComponents(
				externalSpec.spec,
				schemaComponents,
				securitySchemes,
			);
			mergeExternalTags(
				externalSpec.spec,
				externalSpec.tagOverrides ?? {},
				tags,
				tagNames,
			);
			mergeExternalPaths(externalSpec, paths);
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
