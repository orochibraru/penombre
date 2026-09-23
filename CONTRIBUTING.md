# Contributing

## Prerequisites

- [mise](https://mise.jdx.dev), then `mise install` in the repo: it installs the
  Bun and Go versions pinned in `mise.toml` (`preinstall` blocks npm/yarn/pnpm).
  prek comes from `node_modules`, nothing to install.
- **ffmpeg built with the `libwebp` encoder**, **ffprobe** and **pdftoppm**
  (poppler), which the Go worker execs. mise can't install those; its
  postinstall hook runs `mise run doctor`, which checks them and prints the
  install command for what's missing.
- **Docker**, only for the end-to-end test stacks.

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

# Quality
bun run lint         # oxlint + biome + markdownlint + tailwint
bun run lint:fix     # ...and fix what is fixable
bun run format       # biome format --write
bun run check        # check:app && check:scripts && check:go, sequentially
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
`$app/*`/`#lib/server/*` and the Drizzle `db` object; they need no database or
Redis. `bunfig.toml` also sets `rerunEach = 3` to catch flaky tests, and
enforces coverage thresholds.

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

Edit `src/lib/server/db/schema.pg.ts` **and** `schema.sqlite.ts` (kept
structurally in sync by hand; `schema.ts` is a dialect-resolving shim that
re-exports whichever is active, and is what the rest of the app imports from),
then run `bun run db:generate`; it emits migrations for both dialects
(`drizzle/pg/` and `drizzle/sqlite/`). Migrations run automatically on boot.

## Git hooks

`bun install` runs `prek install`, which wires `.pre-commit-config.yaml` into
`.git/hooks`; prek itself comes from `node_modules` (`@j178/prek`), nothing
extra to install. The pre-commit stage (fast linters) runs on every commit and
also runs in CI over the whole repo; `check` and `test-unit` are pre-push hooks,
so a green commit does not mean green CI; those two still run on `git push` and
in CI's own type-check/test job.

```bash
prek run --all-files   # run every hook over the whole repo
prek run biome         # run a single hook
SKIP=test-unit git push ...   # skip a hook for one push
```

Commit messages follow
[Conventional Commits](https://www.conventionalcommits.org/) — the `commit-msg`
hook enforces it, and releases are cut from it by
[releaser](https://github.com/orochibraru/releaser).

## Linting gotchas

- `console.*` is an oxlint error in app code; use `Logger` from `#lib/logger`.
  Biome only formats and sorts imports here; its linter is off.
- Floating and misused promises are errors — `await` them or handle them.
- Don't hand-edit generated output: `src/lib/paraglide`, `src/lib/api/v1.d.ts`,
  `drizzle/`, `.example.env`.
