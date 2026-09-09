import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

/**
 * Default E2E config: SQLite, local filesystem storage — the stack a homelab
 * install actually runs. Starts everything itself via `tools/compose.e2e.yaml`.
 *
 * Usage:
 *   bun run test:e2e
 *
 * `playwright.pg.config.ts` runs the same suite against PostgreSQL.
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
	globalSetup: "./e2e/global-setup.ts",
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
		trace: "on",
		screenshot: "on",
		contextOptions: {
			reducedMotion: "reduce",
		},
	},
	projects: [
		{
			name: "setup",
			testMatch: /e2e\/setup\/.*\.ts/,
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
	],
	webServer: {
		// Self-contained E2E stack on port 3001 — isolated from the dev stack.
		// Playwright waits for the URL to respond before running any tests.
		command:
			"docker compose -f tools/compose.e2e.yaml -p penombre-e2e up --wait",
		cwd: "./",
		url: "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			E2E_PORT: "3001",
		},
	},
});
