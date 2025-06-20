/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*': ['bun run format'],
	'*.{ts,svelte}': ['bun run lint:fix', 'bun run check'],
	'package.json': ['bun run circular'],
	'drizzle/*': ['bun db:diagram']
};
