import process from "node:process";
import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Same suite as `playwright.config.ts`, run against PostgreSQL instead of the
 * default SQLite — Postgres is optional for users, so it gets its own job
 * rather than being the thing everything else is tested on.
 *
 * Usage:
 *   bun run test:e2e:pg
 */
export default defineConfig({
	...base,
	reporter: [["html", { outputFolder: "playwright-report-pg" }], ["list"]],
	use: {
		...base.use,
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3002",
	},
	webServer: {
		command:
			"docker compose -f compose.e2e.yaml --profile pg -p penombre-e2e-pg up --wait",
		cwd: "./",
		url: "http://localhost:3002",
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
			E2E_PORT: "3002",
			E2E_DATABASE_URL: "postgresql://postgres:postgres@db:5432/penombre_e2e",
		},
	},
});
