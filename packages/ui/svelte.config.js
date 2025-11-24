import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import packageJson from "./package.json" with { type: "json" };

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			fallback: "index.html",
			pages: "./dist",
			error: "error.html",
		}),
		prerender: {
			handleHttpError: ({ status, message }) => {
				if (status > 300 && status < 307) {
					return;
				}

				if (status === 404) {
					return;
				}

				throw new Error(message);
			},
		},
		version: {
			name: packageJson.version,
		},
	},
};

export default config;
