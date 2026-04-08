import type { FullConfig } from "@playwright/test";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3_000;

const E2E_EMAIL = process.env.E2E_EMAIL ?? "admin@example.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "Admin1234!";

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

/**
 * Authenticates against the REST API and deletes all leftover `e2e-*` folders
 * (both active and trashed) from a previous interrupted run.
 */
async function cleanupTestData(baseURL: string): Promise<void> {
	// Sign in with the default admin credentials.
	// Better Auth requires the Origin header to match the app's configured origin.
	const signInResp = await fetch(`${baseURL}/api/v1/auth/sign-in/email`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: baseURL,
		},
		body: JSON.stringify({ email: E2E_EMAIL, password: E2E_PASSWORD }),
	});
	if (!signInResp.ok) {
		const body = await signInResp.text().catch(() => "");
		console.warn(
			`[global-setup] Could not authenticate for cleanup (HTTP ${signInResp.status}): ${body.slice(0, 200)} — skipping`,
		);
		return;
	}
	const { token } = (await signInResp.json()) as { token: string };
	const headers = { Authorization: `Bearer ${token}` };

	// Delete active e2e-* folders in the drive root
	const listResp = await fetch(`${baseURL}/api/v1/storage/folder`, { headers });
	const listData = (await listResp.json()) as {
		data: Array<{ id: string; name: string }>;
	};
	const activeFolders = (listData.data ?? []).filter((f) =>
		f.name?.startsWith("e2e-"),
	);
	for (const folder of activeFolders) {
		await fetch(`${baseURL}/api/v1/storage/folder/${folder.id}`, {
			method: "DELETE",
			headers: { ...headers, "Content-Type": "application/json" },
			body: "{}",
		});
	}

	// Delete trashed e2e-* folders (trash list returns full folder objects)
	const trashResp = await fetch(`${baseURL}/api/v1/storage/folder/trash`, {
		headers,
	});
	const trashData = (await trashResp.json()) as {
		data: Array<{ id: string; name: string }>;
	};
	const trashedFolders = (trashData.data ?? []).filter((f) =>
		f.name?.startsWith("e2e-"),
	);
	for (const folder of trashedFolders) {
		await fetch(`${baseURL}/api/v1/storage/folder/${folder.id}`, {
			method: "DELETE",
			headers: { ...headers, "Content-Type": "application/json" },
			body: "{}",
		});
	}

	const total = activeFolders.length + trashedFolders.length;
	if (total > 0) {
		console.log(
			`[global-setup] Cleaned up ${activeFolders.length} active + ${trashedFolders.length} trashed e2e-* folders`,
		);
	}
}

export default async function globalSetup(config: FullConfig): Promise<void> {
	// Prefer the configured baseURL from the first project, then fall back to env vars.
	// This ensures consistency between the health check and the cleanup requests.
	const baseURL =
		config.projects[0]?.use?.baseURL ??
		process.env.PLAYWRIGHT_BASE_URL_LOCAL ??
		process.env.PLAYWRIGHT_BASE_URL ??
		"http://localhost:3000";

	await waitForApp(baseURL);
	await cleanupTestData(baseURL);
}
