#!/usr/bin/env bun
/**
 * Generates a .env.example file with all available configuration options.
 * Run with: bun run gen:env
 */

import { generateExampleDotenvFile } from "../src/lib/server/config.defaults";

const outputPath = new URL("../../../.env.example", import.meta.url).pathname;
await Bun.write(outputPath, generateExampleDotenvFile());
console.log(`✓ Generated ${outputPath}`);
