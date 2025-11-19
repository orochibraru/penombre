import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "svelte-adapter-bun";
import packageJson from "./package.json" with { type: "json" };

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		version: {
			name: packageJson.version,
		},
	},
};

export default config;
