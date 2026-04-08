import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the S3 storage backend.
 *
 * Starts a self-contained E2E stack with Garage via `compose.e2e.yaml --profile s3`,
 * with its own isolated database (penombre_e2e) on port 3002.
 * S3-dependent tests (tagged @s3) are included in this suite.
 *
 * Usage:
 *   bun run test:e2e:s3
 *   bun run test:e2e         (alias)
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
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3002",
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
		// Self-contained S3 E2E stack on port 3002 — isolated from the dev stack.
		// Playwright waits for the URL to respond before running any tests.
		// The globalSetup further confirms the DB is healthy before tests begin.
		command:
			"docker compose -f ../../compose.e2e.yaml --profile s3 -p penombre-e2e-s3 up",
		cwd: "./",
		url: "http://localhost:3002",
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			E2E_PORT: "3002",
			STORAGE_BACKEND: "s3",
		},
	},
});
