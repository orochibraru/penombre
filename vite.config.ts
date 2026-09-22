// @ts-nocheck
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import adapter from "@orochibraru/svelte-smol";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig, type UserConfig } from "vite";

// SvelteKit's own unsupported-plugin warning (vite-plugin-pwa's
// transformIndexHtml hook, which svelte-smol's adapter output doesn't call)
// goes straight to console.log from its internal logger, bypassing Vite's
// `customLogger`; so it has to be filtered here instead. The plugin itself
// still works (see the webmanifest link tag in +layout.svelte).
// ponytail: patches console.log for the process; fine for a short-lived CLI
// invocation (dev/build/sync), revisit if SvelteKit ever exposes a real hook.
const unsupportedPluginWarning =
	"transformIndexHtml` hook which is not supported";
const rawLog = console.log;
console.log = (...args) => {
	if (
		typeof args[0] === "string" &&
		args[0].includes(unsupportedPluginWarning)
	) {
		return;
	}
	rawLog(...args);
};

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
			// Checked by `csrfHandler` in hooks.server.ts instead.
			csrf: { trustedOrigins: ["*"] },
		}),
		SvelteKitPWA(),
	],
}) satisfies UserConfig;
