/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    "*": ["pnpm run format"],
    "packages/ui/**/*.{ts,svelte}": [
        "pnpm -C packages/ui run lint:fix",
        "pnpm -C packages/ui run check",
        "pnpm -C packages/ui run circular",
        "pnpm -C packages/ui run format",
    ],
    "packages/docs/**/*.{ts,svelte}": [
        "pnpm -C packages/docs run lint:fix",
        "pnpm -C packages/docs run check",
        "pnpm -C packages/docs run circular",
        "pnpm -C packages/docs run format",
    ],
    "**/*.go": [
        "sh -c 'cd packages/api && go fmt'",
        "sh -c 'cd packages/api && make lint'",
        "sh -c 'cd packages/api && make test'",
        "pnpm run db:diagram",
    ],
};
