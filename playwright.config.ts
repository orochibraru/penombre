import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

/**
 * Default E2E config: SQLite, local filesystem storage — the stack a homelab
 * install actually runs. Starts everything itself via `compose.e2e.yaml`.
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
	// A retry that passes still means the test is not deterministic. Left
	// unflagged, a flake goes green on the pull request and then fails the
	// push to `main`, where the only difference was luck — which is exactly
	// how a release pipeline breaks on a change its own PR had approved.
	// Retries stay, so a flake is still reported rather than merely red, but
	// the run fails where the flake was introduced.
	failOnFlakyTests: !!process.env.CI,
	workers: 1,
	reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
	globalSetup: "./e2e/global-setup.ts",
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
		// Not "on". Recording a trace for all ~85 tests is enough I/O that
		// Playwright has finished a run and then failed to close its own zip
		// — "End of central directory record signature not found" — which
		// reads as a broken test and, with `failOnFlakyTests`, fails the run.
		// A retry is exactly when a trace is worth having, and that is the
		// case `failOnFlakyTests` now makes fatal, so nothing is lost.
		trace: "on-first-retry",
		screenshot: "only-on-failure",
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
		command: "docker compose -f compose.e2e.yaml -p penombre-e2e up --wait",
		cwd: "./",
		url: "http://localhost:3001",
		// Always reuse: `test:e2e` (and `:pg`) bring the stack up themselves
		// with `up --build --wait`, so whatever is on this port is by
		// construction the current build. Refusing to reuse — which is what
		// `!process.env.CI` did — made CI fail with "port is already used"
		// against the very server the script had just started.
		reuseExistingServer: true,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			E2E_PORT: "3001",
		},
	},
});
