/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  "packages/ui/src/**/*.{ts,svelte}": [
    "pnpm -C packages/ui run lint:fix",
    "pnpm -C packages/ui run check",
    "pnpm -C packages/ui run circular",
  ],
  "**/*.go": ["gofmt -w"],
};
