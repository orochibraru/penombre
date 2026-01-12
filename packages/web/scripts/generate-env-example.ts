#!/usr/bin/env bun
/**
 * Generates a .example.env file with all available configuration options.
 * Run with: bun run gen:env
 */

import { generateExampleDotenvFile } from "../src/lib/server/config.defaults";

const outputPath = new URL("../../../.example.env", import.meta.url).pathname;
await Bun.write(outputPath, generateExampleDotenvFile());
console.log(`✓ Generated ${outputPath}`);
