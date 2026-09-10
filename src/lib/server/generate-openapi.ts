import { Logger } from "$lib/logger";
import { auth } from "./auth";
// Side-effect: registers every v1 route definition and shared schema
import "./openapi/routes";
import { registry } from "./openapi";
import type { ExternalOpenAPISpec, ExternalSpec } from "./openapi/registry";

const logger = new Logger("OpenAPI");

function sortKeysDeep(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortKeysDeep);
	}
	if (value !== null && typeof value === "object") {
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(value).sort()) {
			sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
		}
		return sorted;
	}
	return value;
}

/**
 * The one OpenAPI document: served by GET /api/v1/openapi.json and written to
 * disk by scripts/generate-openapi.ts, so the served spec and the committed
 * one can't drift. Keys are sorted to keep regenerations diff-stable.
 */
export async function genOpenApiSpec(): Promise<Record<string, unknown>> {
	const externalSpecs: ExternalSpec[] = [];

	try {
		const authSpec = (await auth.api.generateOpenAPISchema()) as unknown as
			| ExternalOpenAPISpec
			| undefined;
		if (
			authSpec &&
			typeof authSpec === "object" &&
			"paths" in authSpec &&
			authSpec.paths
		) {
			externalSpecs.push({
				spec: authSpec,
				pathPrefix: "/api/v1/auth",
				defaultTag: "Auth",
				tagOverrides: { Default: "Auth" },
			});
		}
	} catch (error) {
		logger.warn("Failed to generate the auth OpenAPI schema:", error);
	}

	return sortKeysDeep(registry.toOpenAPISpec(externalSpecs)) as Record<
		string,
		unknown
	>;
}
