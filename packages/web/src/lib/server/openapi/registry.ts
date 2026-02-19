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
}

interface SchemaRegistration {
	name: string;
	schema: z.ZodType;
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

	toOpenAPISpec(): Record<string, unknown> {
		const components: Record<string, unknown> = {};
		const schemaComponents: Record<string, unknown> = {};

		// Register named schemas as components
		for (const { name, schema } of this.schemas) {
			schemaComponents[name] = toJsonSchema(schema);
		}

		// StandardizedResponse wrapper
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

		components.schemas = schemaComponents;
		components.securitySchemes = {
			cookieAuth: {
				type: "apiKey",
				in: "cookie",
				name: "better-auth.session_token",
				description: "Session cookie set by better-auth",
			},
		};

		const paths: Record<string, Record<string, unknown>> = {};

		for (const route of this.routes) {
			const pathEntry: Record<string, unknown> = {};
			const parameters: Record<string, unknown>[] = [];
			const responses: Record<string, unknown> = {};

			// Path parameters
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
							required: required.includes(name) || true, // path params always required
							schema,
						});
					}
				}
			}

			// Query parameters
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

			// 200 response with StandardizedResponse envelope
			const responseSchema = toJsonSchema(route.response);

			responses["200"] = {
				description: "Successful response",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								data: responseSchema,
							},
						},
					},
				},
			};

			// Error responses
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
			pathEntry.security = [{ cookieAuth: [] }];

			// Request body (JSON or FormData)
			if (route.body) {
				if (route.isFormData) {
					pathEntry.requestBody = {
						required: true,
						content: {
							"multipart/form-data": {
								schema: toJsonSchema(route.body),
							},
						},
					};
				} else {
					pathEntry.requestBody = {
						required: true,
						content: {
							"application/json": {
								schema: toJsonSchema(route.body),
							},
						},
					};
				}
			}

			if (!paths[route.path]) {
				paths[route.path] = {};
			}
			const pathObj = paths[route.path];
			if (pathObj) {
				pathObj[route.method] = pathEntry;
			}
		}

		return {
			openapi: "3.1.0",
			info: {
				title: "OpenDrive API",
				version: "1.0.0",
				description: "OpenDrive file storage API",
			},
			servers: [{ url: "/", description: "Current server" }],
			paths,
			components,
			security: [{ cookieAuth: [] }],
		};
	}
}

export const registry = new OpenAPIRegistry();
export type { RouteDefinition, HttpMethod };
