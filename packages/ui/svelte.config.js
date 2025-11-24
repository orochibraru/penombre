import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import packageJson from "./package.json" with { type: "json" };

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: "index.html",
			pages: "./build",
			precompress: false,
		}),
		prerender: {
			concurrency: 10,
			crawl: true,
			handleHttpError: "warn",
			handleUnseenRoutes: "warn",
		},
		version: {
			name: packageJson.version,
		},
	},
};
