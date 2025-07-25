/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	'src/**/*.{ts,svelte}': ['pnpm run lint:fix', 'pnpm run check', 'pnpm run circular'],
	'**/*.go': ['gofmt -w']
};
