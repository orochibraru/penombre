/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
    '*': ['pnpm run lint:fix', 'pnpm run check', 'pnpm run circular', 'pnpm run format']
};
