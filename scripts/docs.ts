import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import process from "node:process";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "build" && mode !== "check") {
	console.error("Usage: bun run scripts/docs.ts <dev|build|check>");
	process.exit(1);
}

const repoRoot = join(import.meta.dirname, "..");
const docsDir = join(repoRoot, "packages/docs");

const rootSvelteKitTsconfig = join(repoRoot, ".svelte-kit/tsconfig.json");
if (!existsSync(rootSvelteKitTsconfig)) {
	mkdirSync(join(repoRoot, ".svelte-kit"), { recursive: true });
	writeFileSync(rootSvelteKitTsconfig, '{"compilerOptions":{}}');
}

const rootOpenapi = join(repoRoot, "openapi.json");
if (existsSync(rootOpenapi)) {
	copyFileSync(rootOpenapi, join(docsDir, "static/openapi.json"));
} else {
	console.warn(
		"scripts/docs.ts: no openapi.json at the repo root yet (run `bun run gen` first) : the docs site's API reference page will 404 fetching its spec until it exists.",
	);
}

/**
 * The showcase is built from the screenshots in `docs/images`, so the site has
 * to serve them. Copied rather than globbed: markdown carries plain `<img>`
 * srcs, and a static asset is the one thing both GitHub (reading `docs/*.md`
 * directly) and this site can resolve — see `renderer.image` in markdown.ts.
 */
const imagesSource = join(repoRoot, "docs/images");
const imagesTarget = join(docsDir, "static/docs-images");
if (existsSync(imagesSource)) {
	mkdirSync(imagesTarget, { recursive: true });
	for (const file of readdirSync(imagesSource)) {
		if (/\.(png|jpe?g|webp|gif|svg)$/i.test(file)) {
			copyFileSync(join(imagesSource, file), join(imagesTarget, file));
		}
	}
} else {
	console.warn(
		"scripts/docs.ts: no docs/images yet (run `bun run screenshots`) : the showcase page will render broken images.",
	);
}

const bin = (name: string) => join(repoRoot, "node_modules/.bin", name);

const commands: Record<typeof mode, string[][]> = {
	build: [
		[bin("svelte-kit"), "sync"],
		[bin("vite"), "build"],
	],
	check: [
		[bin("svelte-kit"), "sync"],
		[
			bin("svelte-check"),
			"--tsconfig",
			"./tsconfig.json",
			"--fail-on-warnings",
		],
	],
	dev: [[bin("vite"), "dev"]],
};

for (const cmd of commands[mode]) {
	console.log(`Running ${cmd}...`);
	const proc = Bun.spawnSync(cmd, {
		cwd: docsDir,
		stdio: ["inherit", "inherit", "inherit"],
	});
	if (!proc.success) {
		process.exit(proc.exitCode ?? 1);
	}
}
