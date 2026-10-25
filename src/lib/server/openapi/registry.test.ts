import { describe, expect, test } from "bun:test";

import type { ResolvedPathname } from "$app/types";
import { z } from "zod";

import { type ExternalSpec, registry } from "./registry";

const base = "/api/v1/test/registry";

function path(suffix: string): ResolvedPathname {
	return `${base}${suffix}` as ResolvedPathname;
}

registry.registerSchema("RegistryTestFile", z.object({ name: z.string() }));

registry.registerRoute({
	method: "get",
	path: path("/files/{id}"),
	summary: "Read a file",
	description: "Reads one file",
	tags: ["Registry"],
	params: z.object({ id: z.string() }),
	query: z.object({ limit: z.number(), cursor: z.string().optional() }),
	response: z.object({ name: z.string() }),
	errors: [404, 418],
});

registry.registerRoute({
	method: "post",
	path: path("/files/{id}"),
	summary: "Upload a file",
	body: z.object({ file: z.string() }),
	isFormData: true,
	response: z.object({}),
});

registry.registerRoute({
	method: "post",
	path: path("/public"),
	summary: "Public",
	body: z.object({ name: z.string() }),
	response: z.object({}),
	requireAuth: false,
});

type Operation = Record<string, unknown> & {
	parameters?: Record<string, unknown>[];
	responses: Record<string, { description: string }>;
};

function spec(externals: ExternalSpec[] = []) {
	return registry.toOpenAPISpec(externals) as {
		openapi: string;
		paths: Record<string, Record<string, Operation>>;
		components: {
			schemas: Record<string, Record<string, unknown>>;
			securitySchemes: Record<string, Record<string, unknown>>;
		};
		tags?: { name: string; description?: string }[];
	};
}

describe("registered routes", () => {
	test("an operation carries its parameters, auth and summary", () => {
		const read = spec().paths[path("/files/{id}")]?.get;
		expect(read?.summary).toBe("Read a file");
		expect(read?.description).toBe("Reads one file");
		expect(read?.tags).toEqual(["Registry"]);
		expect(read?.security).toEqual([{ cookieAuth: [] }]);
		expect(read?.parameters).toEqual([
			{ name: "id", in: "path", required: true, schema: { type: "string" } },
			{
				name: "limit",
				in: "query",
				required: true,
				schema: { type: "number" },
			},
			{
				name: "cursor",
				in: "query",
				required: false,
				schema: { type: "string" },
			},
		]);
	});

	test("the response wraps the schema in data, with every declared error", () => {
		const read = spec().paths[path("/files/{id}")]?.get as Operation;
		const { responses } = read;
		expect(responses["200"]).toEqual({
			description: "Successful response",
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							data: {
								type: "object",
								properties: { name: { type: "string" } },
								required: ["name"],
								additionalProperties: false,
							},
						},
					},
				},
			},
		});
		expect(
			Object.fromEntries(
				Object.entries(responses).map(([code, value]) => [
					code,
					value.description,
				]),
			),
		).toEqual({
			"200": "Successful response",
			"401": "Unauthorized",
			"404": "Not Found",
			"418": "Error 418",
			"500": "Internal Server Error",
		});
	});

	test("methods on one path sit side by side, form data as multipart", () => {
		const methods = spec().paths[path("/files/{id}")];
		expect(Object.keys(methods ?? {}).toSorted()).toEqual(["get", "post"]);
		const upload = methods?.post as Operation;
		expect(upload.parameters).toBeUndefined();
		expect(upload.tags).toBeUndefined();
		expect(upload.requestBody).toEqual({
			required: true,
			content: {
				"multipart/form-data": {
					schema: {
						type: "object",
						properties: { file: { type: "string" } },
						required: ["file"],
						additionalProperties: false,
					},
				},
			},
		});
		expect(Object.keys(upload.responses).toSorted()).toEqual([
			"200",
			"401",
			"500",
		]);
	});

	test("a public route has no security and a JSON body", () => {
		const open = spec().paths[path("/public")]?.post as Operation;
		expect(open.security).toBeUndefined();
		expect(Object.keys(open.requestBody as object)).toEqual([
			"required",
			"content",
		]);
		expect(
			(open.requestBody as { content: Record<string, unknown> }).content,
		).toHaveProperty("application/json");
	});

	test("registered schemas and the envelopes are components", () => {
		const { components, openapi } = spec();
		expect(openapi).toBe("3.1.0");
		expect(components.schemas.RegistryTestFile).toEqual({
			type: "object",
			properties: { name: { type: "string" } },
			required: ["name"],
			additionalProperties: false,
		});
		expect(components.schemas.RegistryTestFile).not.toHaveProperty("$schema");
		expect(components.schemas.ErrorResponse).toBeDefined();
		expect(components.schemas.StandardizedResponse).toBeDefined();
		expect(components.securitySchemes.cookieAuth?.in).toBe("cookie");
	});

	test("with no external spec there is no tag list", () => {
		expect(spec().tags).toBeUndefined();
	});
});

describe("merging an external spec", () => {
	const external: ExternalSpec = {
		pathPrefix: base,
		defaultTag: "Auth",
		tagOverrides: { Default: null, Session: "Sessions" },
		spec: {
			paths: {
				"/files/{id}": {
					get: { summary: "Theirs" },
					delete: { summary: "Delete", tags: ["Default"] },
				},
				"/sign-in": {
					post: { summary: "Sign in", tags: ["Session", "Default"] },
					get: "not an operation",
				},
			},
			components: {
				schemas: {
					RegistryTestFile: { type: "string" },
					Session: { type: "object" },
				},
				securitySchemes: {
					cookieAuth: { type: "http" },
					bearerAuth: { type: "http", scheme: "bearer" },
				},
			},
			tags: [
				{ name: "Default" },
				{ name: "Session", description: "Sessions" },
				{ name: "Session" },
				{ name: "Admin" },
			],
		},
	};

	test("adds their paths under the prefix without replacing ours", () => {
		const { paths } = spec([structuredClone(external)]);
		const files = paths[path("/files/{id}")];
		expect(files?.get?.summary).toBe("Read a file");
		// Dropping their only tag leaves the default one.
		expect(files?.delete).toEqual({ summary: "Delete", tags: ["Auth"] });
		expect(paths[path("/sign-in")]?.post).toEqual({
			summary: "Sign in",
			tags: ["Sessions"],
		});
		expect(paths[path("/sign-in")]?.get).toBe("not an operation" as never);
	});

	test("our schemas and security schemes win a name collision", () => {
		const { components } = spec([structuredClone(external)]);
		expect(components.schemas.RegistryTestFile?.type).toBe("object");
		expect(components.schemas.Session).toEqual({ type: "object" });
		expect(components.securitySchemes.cookieAuth?.type).toBe("apiKey");
		expect(components.securitySchemes.bearerAuth).toEqual({
			type: "http",
			scheme: "bearer",
		});
	});

	test("tags are renamed, dropped and deduplicated", () => {
		expect(spec([structuredClone(external)]).tags).toEqual([
			{ name: "Sessions", description: "Sessions" },
			{ name: "Admin" },
		]);
	});

	test("without overrides or prefix their spec is taken as is", () => {
		const { paths, tags } = spec([
			{
				spec: {
					paths: {
						[path("/plain")]: { get: { summary: "Plain", tags: ["Plain"] } },
					},
					tags: [{ name: "Plain" }],
				},
			},
		]);
		expect(paths[path("/plain")]?.get).toEqual({
			summary: "Plain",
			tags: ["Plain"],
		});
		expect(tags).toEqual([{ name: "Plain" }]);
	});
});
