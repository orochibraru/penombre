#!/usr/bin/env bun

/**
 * Writes the OpenAPI spec to disk from the same genOpenApiSpec() the live
 * /api/v1/openapi.json route serves, so the served and committed specs can't
 * drift. Consumed by openapi-typescript (see `gen:openapi`) and the docs
 * site.
 */

import process from "node:process";
import { plugin } from "bun";

// $lib/server/auth pulls in SvelteKit virtual modules that only exist inside
// the dev server; stub them so the spec can be built from a plain bun run.
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

// Dynamic import so the plugin above is registered before module resolution.
const { genOpenApiSpec } = await import("$lib/server/generate-openapi");

const doc = await genOpenApiSpec();

// These three files are tracked; refuse to overwrite them with an empty spec
// (a missing `await` here once wrote "{}" over all of them).
if (!doc.paths || Object.keys(doc.paths).length === 0) {
	throw new Error("Refusing to write an OpenAPI spec with no paths");
}

const spec = `${JSON.stringify(doc, null, "\t")}\n`;

// Every consumer of the spec. `gen:openapi` runs openapi-typescript against
// this file.
const outputs = ["openapi.json"];

for (const output of outputs) {
	await Bun.write(output, spec);
	console.log(`✓ Wrote ${output}`);
}
