# Opendrive AI Development Guide

## Architecture Overview

Opendrive is a self-hosted cloud storage solution with a **monorepo structure** using pnpm workspaces:

-   **API** (`packages/api/`): Go 1.25+ backend with Chi router, serving both API and static UI
-   **UI** (`packages/ui/`): SvelteKit 2 SPA with Shadcn/ui components, built to `packages/api/dist`
-   **Docs** (`packages/docs/`): SvelteKit-based documentation site
-   **CLI** (`packages/cli/`): Go CLI tool for health checks

**Critical**: The Go API server serves the built UI from `packages/api/dist` in production, or proxies to Vite dev server (port 5173) when `DEV_PROXY=true`.

## Development Workflow

### Starting the Dev Environment

```bash
# Root command starts EVERYTHING via concurrently:
pnpm run dev
# Launches: docker compose (PostgreSQL + MinIO) + go tool air (API hot reload) + vite (UI dev server)
```

Individual services in `concurrently.config.mjs`: containers:dev, api:dev, ui:dev.

### Code Generation (Critical)

**ALWAYS regenerate after OpenAPI changes:**

```bash
# In packages/api/ directory:
make api
# 1. Generates Go server code (services/router_service.go) from public/openapi.json
# 2. Generates TypeScript client (packages/ui/src/lib/api/schema.d.ts)
```

**SQLC for database code:**

```bash
cd packages/api && make db
# Generates type-safe Go code from db/query.sql → db/sqlc/
```

### Database Migrations

-   Migrations live in `packages/api/db/migrations/` (e.g., `001_initial.up.sql`)
-   **Auto-run on API startup** via embedded migrations in `migrate.go`
-   Use `golang-migrate` patterns: `.up.sql` and `.down.sql` files
-   Update diagram: `pnpm run db:diagram` (generates SVG from SQL)

## Project-Specific Patterns

### Go Backend Conventions

1. **Package-level logger**: Every service file uses `var l = logger.Get()` at top
2. **Handler structure**: All handlers in `packages/api/handlers/` implement generated `ServerInterface`
3. **Service injection**: `Server` struct contains `*Storage` and `*DB` services
4. **Config pattern**: Use `config.Get(config.ConfigKey)` for env vars (typed constants)
5. **Auth middleware**: Two distinct middlewares:
    - `ApiAuthMiddleware`: Requires session_token cookie + X-CSRF-Token header
    - `PageAuthMiddleware`: Redirects to /auth/sign-in, allows static assets
6. **Response helpers**: Use `RespondWithJSON()` and `RespondWithError()` from `handler.go`

### Frontend Conventions

1. **API client**: Generated TypeScript client from OpenAPI via `openapi-fetch`
    - Import from `$lib/api` (includes CSRF middleware)
    - Types exported: `UserSession`, `User`, `Bucket`, `ObjectItem`, etc.
2. **Auth**: CSRF token stored in cookie, automatically added to requests via middleware
3. **SvelteKit setup**: Static adapter with fallback to `index.html`, version from `package.json`
4. **Styling**: TailwindCSS 4 + Shadcn/ui components in `$lib/components/ui/`
5. \*SvelteKit version\*\*: This is mandatory: Svelte 5 is required, not 4. This means we HAVE to use runes.

### Testing

**Playwright e2e tests** with Testcontainers:

-   `tests/global-setup.ts` spins up PostgreSQL + MinIO + Go server before tests
-   Run: `pnpm test` (uses `playwright.config.ts`)
-   Environment: `DEV_PROXY=false` forced in test config
-   Tests in `tests/`: `api/`, `e2e/`, `auth.spec.ts`
-   At the root of the repo, `pnpm test` can be run to start the whole suite.

### Linting & Formatting

**Go:**

-   Lint: `cd packages/api && make lint` (uses `golangci-lint`)
-   Format: `go fmt` (auto-run in pre-commit)

**TypeScript/Svelte:**

-   Lint: `pnpm -C packages/ui run lint` (Biome) + `pnpm -C packages/ui run check` (svelte-check)
-   Fix: `pnpm -C packages/ui run lint:fix`
-   Format: `pnpm format` (Prettier, root level)
-   Pre-commit hook: `lint-staged.config.mjs` runs checks + circular dependency detection

**Critical**: Biome config excludes generated files (`src/lib/ROUTES.ts`, `src/app.css`)

## Integration Points

### Authentication Flow

1. OAuth providers configured via env vars: `OAUTH_PROVIDERS`, `OAUTH_POCKETID_*`
2. Session flow: OAuth callback → `SetSessionCookies()` → creates DB session + sets cookies
3. Cookies: `session_token` (HttpOnly), `csrf_token` (client-accessible)
4. Auth allowlist paths hardcoded in middleware (e.g., `/api/v1/healthz`, `/p/*`)

### Storage Integration

-   MinIO (S3-compatible) via `services.StorageService`
-   Config: `STORAGE_URL`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_ACCESS_KEY_SECRET`
-   Health check: `s.Storage.ListBuckets()` in `/api/v1/healthz`

### Database

-   PostgreSQL with pgx driver (v5)
-   SQLC generates type-safe queries from `db/query.sql`
-   Example: `database.GetSessionWithUser()`, `database.CreateSession()`

## Build & Deployment

```bash
# Production build (root):
pnpm run build
# 1. Builds UI → packages/ui/dist
# 2. Moves dist → packages/api/dist
```

## Common Pitfalls

-   **API changes require `make api`** or TypeScript types will be stale
-   **DEV_PROXY** must be `true` for local development, `false` for tests/production
-   **Air (hot reload)** requires `go tool air` NOT `air` directly
-   **Session cookies** require matching CSRF header for API calls (auto-handled by UI middleware)
-   **Route protection**: Add new unprotected paths to middleware allowlists explicitly
-   **Node 24+ required** (engines field in package.json)

## Key Files Reference

-   `packages/api/main.go`: Server setup, middleware chain, proxy logic
-   `packages/api/handlers/handler.go`: Response helpers, health check
-   `packages/api/services/auth_service.go`: Auth middleware, session management
-   `packages/ui/src/lib/api/index.ts`: API client setup with CSRF middleware
-   `concurrently.config.mjs`: Dev server orchestration
-   `lint-staged.config.mjs`: Pre-commit validation rules
