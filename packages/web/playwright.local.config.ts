import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the LOCAL storage backend.
 *
 * Starts a self-contained E2E stack via `compose.e2e.yaml` — no Garage/S3,
 * filesystem-only, with its own isolated database (penombre_e2e).
 * S3-dependent tests are excluded via `--grep-invert`.
 *
 * Usage:
 *   bun run test:e2e:local
 *   PLAYWRIGHT_BASE_URL=http://localhost:3001 bunx playwright test --config=playwright.local.config.ts
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [["html", { outputFolder: "playwright-report-local" }], ["list"]],
	globalSetup: "./e2e/global-setup.ts",
	use: {
		baseURL:
			process.env.PLAYWRIGHT_BASE_URL_LOCAL ??
			process.env.PLAYWRIGHT_BASE_URL ??
			"http://localhost:3001",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	// S3-dependent tests are tagged @s3 and excluded from the local run.
	grepInvert: /@s3/,

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
		command: process.env.CI
			? "docker compose -f ../../compose.e2e.yaml -p penombre-e2e up"
			: "docker compose -f ../../compose.e2e.yaml -p penombre-e2e up --build",
		cwd: "./",
		url: process.env.PLAYWRIGHT_BASE_URL_LOCAL ?? "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 3_000,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			E2E_PORT: "3001",
			STORAGE_BACKEND: "local",
		},
	},
});
