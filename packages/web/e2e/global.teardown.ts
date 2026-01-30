import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalTeardown() {
	// Clean up e2e storage directory
	const storagePath = path.resolve(__dirname, "..", "tmp", "e2e-storage");
	if (fs.existsSync(storagePath)) {
		console.log("Cleaning up E2E storage directory...");
		fs.rmSync(storagePath, { recursive: true, force: true });
		console.log("E2E storage cleanup complete.");
	}
}
