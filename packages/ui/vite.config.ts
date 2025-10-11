import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { kitRoutes, type Options } from 'vite-plugin-kit-routes';

/** @type {import('vite').UserConfig} */
export default defineConfig({
	server: {
		host: '0.0.0.0'
	},
	plugins: [tailwindcss(), sveltekit(), kitRoutes()]
});

import type { KIT_ROUTES } from '$lib/ROUTES';

export const _kitRoutesConfig: Options<KIT_ROUTES> = {};
