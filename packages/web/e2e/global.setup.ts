import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
	// Clean up e2e storage directory before tests
	const storagePath = path.resolve(__dirname, "..", "tmp", "e2e-storage");
	if (fs.existsSync(storagePath)) {
		console.log("Cleaning up old E2E storage directory...");
		fs.rmSync(storagePath, { recursive: true, force: true });
	}

	// Run seed script via Bun with preload for SvelteKit mocks
	const seedScript = path.resolve(__dirname, "seed-e2e.ts");
	const preloadScript = path.resolve(__dirname, "..", "test.setup.ts");
	const webPackageDir = path.resolve(__dirname, "..");
	try {
		execSync(`bun --preload ${preloadScript} ${seedScript}`, {
			stdio: "inherit",
			cwd: webPackageDir,
		});
	} catch (error) {
		console.error("Failed to seed database for E2E tests:", error);
		throw error;
	}
}
