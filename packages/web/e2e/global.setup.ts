import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
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
