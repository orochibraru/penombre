import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsx } from 'mdsx';
import { mdsxConfig } from './mdsx.config.js';
import packageJson from './package.json' with { type: 'json' };

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [mdsx(mdsxConfig), vitePreprocess()],
	extensions: ['.svelte', '.md'],

	kit: {
		adapter: adapter({
			fallback: 'index.html',
			pages: './dist',
			error: 'error.html'
		}),
		alias: {
			'$docs/*': '.velite/*'
		}
	},
	precompress: true,
	prerender: {
		handleHttpError: ({ status, message }) => {
			if (status > 300 && status < 307) {
				return;
			}

			if (status === 404) {
				return;
			}

			throw new Error(message);
		}
	},
	version: {
		name: packageJson.version
	}
};

export default config;
