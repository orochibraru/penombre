import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { kitRoutes } from 'vite-plugin-kit-routes';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
	plugins: [
		sentryVitePlugin({
			telemetry: false
		}),
		tailwindcss(),
		sveltekit(),
		kitRoutes()
	],
	test: {
		hookTimeout: 30000,
		setupFiles: ['./tests/setup.ts'],
		globals: true,
		name: 'server',
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
	}
});
