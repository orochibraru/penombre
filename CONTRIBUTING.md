# Contributing

## Prerequisites

- **Bun 1.4+** — the only required runtime (`preinstall` blocks npm/yarn/pnpm)
- **Docker** — only for the end-to-end test stacks

## Setup

```bash
git clone https://github.com/orochibraru/penombre.git
cd penombre
bun install
bun run dev
```

`bun run dev` starts the Vite dev server on <http://localhost:5173>. It runs on
SQLite by default (`./data/penombre.sqlite`), so no database server is needed;
point `DATABASE_URL` at a Postgres instance to develop against Postgres instead
— it stays supported, it's just no longer the default.

## Commands

```bash
# App
bun run dev          # Vite dev server
bun run build        # Build for production
bun run preview      # Preview the production build
bun run db:generate  # Generate Drizzle migrations (Postgres + SQLite)
bun run db:studio    # Open Drizzle Studio

# Docs site
bun run docs:dev     # Run the documentation site
bun run docs:build   # Build it

# Quality
bun run lint         # biome + markdownlint + tailwint
bun run lint:fix     # ...and fix what is fixable
bun run format       # biome format --write
bun run check        # Type-check app, scripts and docs
bun run check:app    # svelte-check on the app alone
bun run circular     # Report circular imports

# Tests
bun test                # Unit tests (fully mocked, no services needed)
bun test path/to.test.ts        # A single file
bun test -t "some test name"    # Filter by test name
bun run test:docker     # Unit tests in Docker (mirrors CI, adds real Redis)
bun run test:e2e        # E2E on SQLite (the default stack)
bun run test:e2e:pg     # E2E on PostgreSQL
bun run test:e2e:ui     # Playwright UI mode

# Codegen
bun run gen:api      # OpenAPI spec + typed API client
bun run gen:env      # Regenerate .example.env
```

Unit tests preload `test.setup.ts` (see `bunfig.toml`), which mocks
`$app/*`/`$env/*`/`$lib/server/*` and the Drizzle `db` object — they need no
database or Redis. `bunfig.toml` also sets `rerunEach = 3` to catch flaky tests,
and enforces coverage thresholds.

## Adding an API endpoint

Every `/api/v1/...` endpoint lives in two places:

1. **Contract** — a `defineRoute()` call in
   `src/lib/server/openapi/v1/<resource>.ts` declaring method, path, Zod schemas
   and auth requirements. Import the module from
   `src/lib/server/openapi/routes.ts` so it registers with the OpenAPI registry.
2. **Handler** — `src/routes/api/v1/.../+server.ts` imports the contract and
   calls `.handler(...)`. Auth and validation already ran; the callback just
   returns `Http.Ok(...)` and friends.

Skipping the contract means no validation, no OpenAPI spec entry, and no
generated client. Run `bun run gen:api` after changing either half.

## Database changes

Edit `src/lib/server/db/schema.ts`, then run `bun run db:generate` — it emits
migrations for both dialects (`drizzle/pg/` and `drizzle/sqlite/`). Migrations
run automatically on boot.

## Git hooks

`bun install` runs `prek install`, which wires `.pre-commit-config.yaml` into
`.git/hooks`. The same config runs in CI, so a green local commit means a green
CI lint job. Install prek with `brew install prek` (or see its
[README](https://github.com/j178/prek)); the `prepare` script is a no-op without
it.

```bash
prek run --all-files   # run every hook over the whole repo
prek run biome         # run a single hook
SKIP=test-unit git commit ...   # skip a hook for one commit
```

Commit messages follow
[Conventional Commits](https://www.conventionalcommits.org/) — the `commit-msg`
hook enforces it, and releases are cut from it by semantic-release.

## Linting gotchas

- `console.*` is a Biome error in app code — use `Logger` from `$lib/logger`.
- Floating and misused promises are errors — `await` them or handle them.
- Don't hand-edit generated output: `src/lib/paraglide`, `src/paraglide`,
  `src/lib/api/v1.d.ts`, `drizzle/`, `.example.env`.
