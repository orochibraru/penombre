/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*': ['prettier --write --log-level warn', 'tsx ./circular.ts'],
	'**/*.{ts,svelte}': ['biome check --fix', 'pnpm run check'],
	'**/*.go': ['gofmt -w']
};
