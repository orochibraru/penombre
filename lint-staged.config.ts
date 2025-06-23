/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*': ['pnpm run format'],
	'*.{ts,svelte}': ['pnpm run lint:fix', 'pnpm run check'],
	'package.json': ['pnpm run circular'],
	'drizzle/*': ['pnpm db:diagram']
};
