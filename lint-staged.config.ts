/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*': ['bun run lint:fix', 'bun run check', 'bun run circular', 'bun run format', 'bun db:diagram']
};
