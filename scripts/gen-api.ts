import { $ } from "bun";

try {
	const baseApiDoc = await $`bun run --filter @penombre/web gen:api`;
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

try {
	const mobileClientApiDoc = await $`bun run --filter @penombre/mobile gen:api`;
	if (mobileClientApiDoc.exitCode !== 0) {
		console.error("Failed to generate mobile client API documentation:");
		console.error(mobileClientApiDoc.stderr);
		process.exit(1);
	}
} catch (e) {
	console.error("Failed to generate mobile client API documentation:");
	console.error(e);
	process.exit(1);
}
