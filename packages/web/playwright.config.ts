import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for Opendrive
 *
 * Tests run against a dev server started before tests.
 * Auth state is stored in e2e/.auth to reuse logged-in sessions.
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["html", { open: "never" }], ["list"]],
	globalSetup: "./e2e/global.setup.ts",

	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	projects: [
		// Setup project for auth - runs first and stores state
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: "e2e/.auth/user.json",
			},
			dependencies: ["setup"],
		},
	],

	// Start dev server before running tests
	webServer: {
		env: {
			ORIGIN: "http://localhost:3000",
			LOG_LEVEL: "DEBUG",
			PORT: "3000",
		},
		command: "bun run ./build/index.js",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
