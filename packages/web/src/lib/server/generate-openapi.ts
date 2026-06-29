import { auth } from "./auth";
import { registry } from "./openapi";
import type { ExternalSpec } from "./openapi/registry";

export async function genOpenApiSpec() {
	const externalSpecs: ExternalSpec[] = [];

	try {
		const authSpec = await auth.api.generateOpenAPISchema();
		if (
			authSpec &&
			typeof authSpec === "object" &&
			"paths" in authSpec &&
			authSpec.paths
		) {
			externalSpecs.push({
				spec: authSpec as unknown as {
					paths?: Record<string, Record<string, unknown>>;
				},
				pathPrefix: "/api/v1/auth",
				defaultTag: "Auth",
				tagOverrides: { Default: "Auth" },
			});
		}
	} catch (error) {
		console.warn("⚠ Could not merge better-auth OpenAPI spec:", error);
	}

	const spec = registry.toOpenAPISpec(externalSpecs);
	return spec;
}
