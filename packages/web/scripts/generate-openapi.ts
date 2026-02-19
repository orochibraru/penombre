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
	},
});

// Use dynamic imports so the plugin is registered before module resolution
// Side-effect: register all route definitions with the OpenAPI registry
await import("$lib/server/openapi/routes");

const { registry } = await import("$lib/server/openapi");

const spec = registry.toOpenAPISpec();
const outputPath = new URL("../src/lib/api/v1.json", import.meta.url).pathname;
await Bun.write(outputPath, JSON.stringify(spec, null, "\t"));
console.log(`✓ Generated OpenAPI spec → ${outputPath}`);
