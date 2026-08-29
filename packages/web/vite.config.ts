// @ts-nocheck
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig, type UserConfig } from "vite";
import adapter from "@orochibraru/svelte-smol";

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
			// compile: false → plain build/index.js bundle instead of a single
			// binary, because sharp ships a native (.node) addon that
			// `bun build --compile` can't embed.
			adapter: adapter({ compile: false }),
			experimental: {
				// Loads src/instrumentation.server.ts first, to force
				// reflect-metadata to initialise before @peculiar/x509's tsyringe
				// container. See that file.
				instrumentation: { server: true },
			},
		}),
		SvelteKitPWA(),
	],
}) satisfies UserConfig;
