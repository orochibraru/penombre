import process from "node:process";
import { $ } from "bun";

try {
	const baseApiDoc = await $`bun run gen:openapi`;
	if (baseApiDoc.exitCode !== 0) {
		console.error("Failed to generate API documentation:");
		console.error(baseApiDoc.stderr);
		process.exit(1);
	}
} catch (e) {
	console.error("Failed to generate API documentation:");
	console.error(e);
	process.exit(1);
}
