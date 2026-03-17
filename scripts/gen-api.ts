import { $ } from "bun";

const baseApiDoc = await $`bun run --filter @penombre/web gen:api`;
if (baseApiDoc.exitCode !== 0) {
	console.error("Failed to generate API documentation:");
	console.error(baseApiDoc.stderr);
	process.exit(1);
}

const mobileClientApiDoc = await $`bun run --filter @penombre/mobile gen:api`;
if (mobileClientApiDoc.exitCode !== 0) {
	console.error("Failed to generate mobile client API documentation:");
	console.error(mobileClientApiDoc.stderr);
	process.exit(1);
}

const docsWebsiteApiDoc = await $`bun run --filter @penombre/docs gen:api`;
if (docsWebsiteApiDoc.exitCode !== 0) {
	console.error("Failed to generate docs website API documentation:");
	console.error(docsWebsiteApiDoc.stderr);
	process.exit(1);
}

console.log("API documentation generated successfully.");
