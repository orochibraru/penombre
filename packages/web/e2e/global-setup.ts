import type { FullConfig } from "@playwright/test";
import { $ } from "bun";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3_000;

/**
 * Polls the app health endpoint until the server is up and has finished
 * database migrations. The app's SvelteKit init() hook runs waitForDatabase()
 * and migrate() before serving traffic, so a 200 from /api/health guarantees
 * the DB is ready.
 */
async function waitForApp(baseURL: string): Promise<void> {
	const healthUrl = `${baseURL}/api/health`;
	console.log(`\n[global-setup] Waiting for app at ${healthUrl}…`);

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(healthUrl, {
				signal: AbortSignal.timeout(5_000),
			});
			if (res.ok) {
				console.log(
					`[global-setup] ✅ App is ready (attempt ${attempt}/${MAX_ATTEMPTS})\n`,
				);
				return;
			}
			console.log(
				`[global-setup] App responded ${res.status}, retrying… (${attempt}/${MAX_ATTEMPTS})`,
			);
		} catch {
			console.log(
				`[global-setup] App not reachable yet, retrying… (${attempt}/${MAX_ATTEMPTS})`,
			);
		}

		await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
	}

	throw new Error(
		`[global-setup] App at ${healthUrl} did not become healthy within ${(MAX_ATTEMPTS * RETRY_DELAY_MS) / 1000}s. ` +
			"Check that the database is running and migrations completed.",
	);
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
	const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

	const composeFile = "../../compose.e2e.yaml";
	const composeProjectName = "penombre-e2e";

	// Run docker compose PS before waiting for the app, to ensure the containers are up and running.
	// This is necessary because the web server command in the Playwright config starts the containers,
	// but they may not be fully up by the time we start polling the health endpoint.
	console.log(
		`[global-setup] Checking Docker containers with docker compose ps on ${composeFile} (${composeProjectName})…`,
	);
	const cmd =
		await $`docker compose -f ${composeFile} -p ${composeProjectName} ps`;

	if (cmd.exitCode !== 0) {
		console.error("[global-setup] Failed to start Docker containers:");
		console.error(cmd.stderr);
		throw new Error("Failed to start Docker containers");
	}

	console.log(
		`[global-setup] Starting Docker containers with docker compose on ${composeFile} (${composeProjectName})…`,
	);

	await waitForApp(baseURL);
}
