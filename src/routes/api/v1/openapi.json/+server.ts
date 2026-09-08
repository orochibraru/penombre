import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Side-effect: registers all route definitions + shared schemas
import "$lib/server/openapi/routes";
import { Logger } from "$lib/logger";
import { auth } from "$lib/server/auth";
import { registry } from "$lib/server/openapi";
import type { ExternalOpenAPISpec } from "$lib/server/openapi/registry";

const logger = new Logger("openapi+server");

export const GET: RequestHandler = async () => {
	try {
		const externalSpecs: Array<{
			spec: ExternalOpenAPISpec;
			pathPrefix?: string;
			defaultTag?: string;
			tagOverrides?: Record<string, string | null>;
		}> = [];

		// Fetch better-auth's OpenAPI spec and merge it as an external spec
		try {
			const authSpec =
				(await auth.api.generateOpenAPISchema()) as unknown as ExternalOpenAPISpec;
			if (authSpec && typeof authSpec === "object" && authSpec.paths) {
				externalSpecs.push({
					spec: authSpec,
					pathPrefix: "/api/v1/auth",
					defaultTag: "Auth",
					tagOverrides: { Default: "Auth" },
				});
			}
		} catch (error) {
			logger.warn("Failed to fetch better-auth OpenAPI spec:", error);
		}

		const spec = registry.toOpenAPISpec(externalSpecs);
		return json(spec, {
			headers: {
				"Cache-Control": "public, max-age=60",
			},
		});
	} catch (error) {
		logger.error("Error generating OpenAPI spec:", error);
		return json(
			{ message: "Failed to generate OpenAPI spec" },
			{ status: 500 },
		);
	}
};
