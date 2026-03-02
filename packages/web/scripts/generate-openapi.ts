#!/usr/bin/env bun
/**
 * Generates a static OpenAPI spec JSON file from the runtime registry.
 * This file is consumed by openapi-typescript to generate typed client types.
 *
 * Run with: bun run gen:api
 */

import { plugin } from "bun";

// Mock SvelteKit virtual modules that aren't available outside the dev server
plugin({
	name: "sveltekit-mocks",
	setup(build) {
		build.module("$app/environment", () => ({
			exports: { dev: false, building: true, version: "0" },
			loader: "object",
		}));
		build.module("$env/dynamic/private", () => ({
			exports: { env: process.env },
			loader: "object",
		}));
		build.module("$env/dynamic/public", () => ({
			exports: { env: {} },
			loader: "object",
		}));
		build.module("$app/server", () => ({
			exports: { getRequestEvent: () => undefined },
			loader: "object",
		}));
	},
});

// Use dynamic imports so the plugin is registered before module resolution
// Side-effect: register all route definitions with the OpenAPI registry
await import("$lib/server/openapi/routes");

const { registry } = await import("$lib/server/openapi");

// Merge better-auth's OpenAPI spec
// biome-ignore lint/suspicious/noExplicitAny: build script, ExternalOpenAPISpec is a type-only export
const externalSpecs: any[] = [];

try {
	const { auth } = await import("$lib/server/auth");
	const authSpec = await auth.api.generateOpenAPISchema();
	if (
		authSpec &&
		typeof authSpec === "object" &&
		"paths" in authSpec &&
		authSpec.paths
	) {
		externalSpecs.push({
			spec: authSpec as { paths: Record<string, unknown> },
			pathPrefix: "/api/v1/auth",
			defaultTag: "Auth",
			tagOverrides: { Default: "Auth" },
		});
	}
} catch (error) {
	console.warn("⚠ Could not merge better-auth OpenAPI spec:", error);
}

const spec = registry.toOpenAPISpec(externalSpecs);
const outputPath = new URL("../src/lib/api/v1.json", import.meta.url).pathname;
const copyPath = new URL("../../mobile/assets/api.v1.json", import.meta.url)
	.pathname;

await Bun.write(outputPath, JSON.stringify(spec, null, "\t"));
await Bun.write(copyPath, JSON.stringify(spec, null, "\t"));
console.log(`✓ Generated OpenAPI spec → ${outputPath}`);
console.log(`✓ Copied OpenAPI spec → ${copyPath}`);
