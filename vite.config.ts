// @ts-nocheck
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import adapter from "@sveltejs/adapter-bun";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig, loadEnv, type UserConfig } from "vite";

// SvelteKit's own unsupported-plugin warning (vite-plugin-pwa's
// transformIndexHtml hook, which adapter-bun's output doesn't call)
// goes straight to console.warn from its internal logger, bypassing Vite's
// `customLogger`; so it has to be filtered here instead. The plugin itself
// still works (see the webmanifest link tag in +layout.svelte).
// ponytail: patches console.warn for the process; fine for a short-lived CLI
// invocation (dev/build/sync), revisit if SvelteKit ever exposes a real hook.
const unsupportedPluginWarning = "transform_index_html_unsupported";
const rawWarn = console.warn;
console.warn = (...args) => {
	if (
		typeof args[0] === "string" &&
		args[0].includes(unsupportedPluginWarning)
	) {
		return;
	}
	rawWarn(...args);
};

// `config.ts` reads `process.env`, and `bun run dev` hands vite neither
// `.env` nor a runtime that loads it. The shell still wins.
for (const [key, value] of Object.entries(
	loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), ""),
)) {
	process.env[key] ??= value;
}

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
			strategy: ["localStorage", "cookie", "baseLocale"],
		}),
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
			},
			adapter: adapter({
				buildOptions: {
					compile: true,
				},
			}),
			// Checked by `csrfHandler` in hooks.server.ts instead.
			csrf: { trustedOrigins: ["*"] },
		}),
		// Kit's relative base made the manifest link `./manifest.webmanifest`,
		// a 404 on every nested route (`/auth/…`, `/edit/…`).
		SvelteKitPWA({ base: "/" }),
	],
}) satisfies UserConfig;
