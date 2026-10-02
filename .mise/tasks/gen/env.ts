#!/usr/bin/env bun
//MISE description="Regenerate .example.env from config.defaults.ts"
/**
 * Generates a .example.env file with all available configuration options.
 * Run with: bun run gen:env
 */

import { generateExampleDotenvFile } from "#lib/server/config.defaults.js";

const outputPath = new URL("../../../.example.env", import.meta.url).pathname;
await Bun.write(outputPath, generateExampleDotenvFile());
console.log(`✓ Generated ${outputPath}`);
