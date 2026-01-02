# Opendrive Development Guide

This is a self-hosted cloud storage platform with a modern monorepo architecture using Bun, Koritsu (API), and SvelteKit (UI).

## Architecture Overview

**Monorepo Structure**: Bun workspace with two packages (`packages/api`, `packages/web`)

-   **API**: [Koritsu](https://koritsu.dev) file-based routing framework with auto-generated OpenAPI docs
    -   **Database**: PostgreSQL via Bun's native SQL driver + Drizzle ORM
    -   **Auth**: [better-auth](https://www.better-auth.com/) library handles OAuth providers and session management
-   **UI**: SvelteKit with [Svelte 5 Runes](https://svelte.dev/blog/runes) + Shadcn/Svelte components, deployed with svelte-adapter-bun
-   **Storage Service**: User-specific Directories managed by `StorageService` class (`packages/api/lib/storage.ts`)

**Key Design Patterns**:

-   **API Routes**: Follow [Koritsu conventions](https://koritsu.dev) - file-based routing with `route.ts` files exporting `createRoute()` handlers
    -   Routes auto-discovered from `packages/api/routes/**` directory structure
    -   OpenAPI spec defined inline with Zod schemas (see `packages/api/routes/storage/objects/route.ts`)
    -   Uses Bun's native File I/O client (`File` from `"bun"`) and standard Node operations for directories
-   **Auth**: better-auth handles all authentication logic - don't reinvent auth patterns (see `packages/api/lib/auth.ts`)
-   **Database**: Bun SQL client wrapped by Drizzle ORM - schema in `packages/api/lib/db/schema.ts`
-   **Type Generation**: UI consumes typed API client from OpenAPI spec via `openapi-typescript` → `packages/web/src/lib/api/schema.d.ts`
-   **Storage Architecture**:
    -   Per-user directories created on-demand, named `user-{sanitized-username}` (see `StorageService` constructor)
    -   File metadata stored as JSON in files within user directories, not database (see `getFileMetadata` method)

## Development Workflow

### Start Development Environment

```bash
bun run dev  # Runs concurrently: Docker (DB), API with hot reload, UI with Vite
```

This uses `concurrently.config.mjs` to orchestrate:

1. `docker compose up db` (PostgreSQL on :5432)
2. API server on :8080 (waits for containers via `wait-on`)
3. UI dev server on :5173

### Database Changes

```bash
cd packages/api
bun run db:generate  # Generate migration from schema changes
bun run db:migrate   # Apply migrations
```

Migrations run automatically in production (see `packages/api/index.ts` - calls `runMigrations()` before server start).

### API Schema Updates

When adding/modifying API routes:

1. Update route in `packages/api/routes/**` with inline OpenAPI spec
2. Dev server auto-generates `packages/api/openapi.json` (see `writeRealTimeSpec()` in `index.ts`)
3. Run `bun run gen:api` in `packages/web` to regenerate TypeScript client types
4. UI automatically gets type-safe API calls via `openapi-fetch` client (see `packages/web/src/lib/api/index.ts`)

### Testing Strategy

Uses **Bun's native test runner** with Happy DOM (no Playwright). See `tests/README.md`.

```bash
bun test tests/smoke.test.ts      # Fast smoke tests
bun test:api                       # API tests with docker (requires Docker)
bun test:integration               # Full-stack tests with docker
```

**Critical**: API/integration tests spin up real PostgreSQL via docker. Set `BASE_URL` env var to skip container setup in CI.

## Code Conventions

### Formatting & Linting

-   **Biome**: All linting handled by Biome for both API and UI (`bun run lint` / `bun run lint:fix`)
-   Double quotes for JavaScript (see `biome.json`)
-   Pre-commit hook runs Biome checks via Husky

### API Route Pattern

Follow [Koritsu's file-based routing](https://koritsu.dev). Every `route.ts` exports HTTP methods using `createRoute`:

```typescript
export const GET = createRoute({
  method: "GET",
  handler: async ({ headers, query }) => {
    // Auth via better-auth
    const session = await auth.api.getSession({ headers });
    if (!session) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    // ... handler logic
  },
  spec: {
    parameters: { query: z.object({ ... }) },
    responses: { 200: { schema: ... } },
    summary: "...",
  },
});
```

**Critical**: Use Bun's native clients (`File` from `"bun"`, Drizzle with Bun SQL) - not Node.js alternatives

### Storage Service Usage

Always instantiate per-request with user context:

```typescript
const session = await auth.api.getSession({ headers });
const storageService = new StorageService(session.user);
// Automatically manages user-specific bucket
```

### UI API Client Pattern

-   **Browser**: `getApiClient()` - reads auth cookie from SvelteKit page data
-   **Server**: `getServerSideApi(cookie)` - pass cookie explicitly from `event.cookies`
-   Both return typed `openapi-fetch` client with automatic auth middleware

## Deployment & Production

**Docker Build**: Multi-stage Dockerfile compiles UI + API, runs with nginx + supervisor

-   UI served via nginx reverse proxy
-   API runs on internal port, proxied through nginx
-   Both services managed by supervisord

**Environment Variables**:

-   `DATABASE_URL`: PostgreSQL connection (defaults to `postgres://postgres:postgres@db:5432/opendrive`)
-   OAuth config: `OAUTH_PROVIDERS`, `OAUTH_POCKETID_CLIENT_ID`, etc.

## Common Gotchas

1. **File metadata is in files ending with .meta.json, not DB**: Don't look for file tables in Drizzle schema - metadata is JSON in objects
2. **Folder representation**: Folders end with `/` and contain `.keep` files with metadata JSON
3. **Presigned URL proxying**: URLs are returned without endpoint prefix for `/p` proxy endpoint (see `presign()` method)
4. **Bun-specific types**: Some AWS SDK types mismatch - see `@ts-expect-error` in `presign()` for Smithy types
5. **OpenAPI spec merging**: API combines Koritsu routes + better-auth schema (see `externalSpecs` in `index.ts`)
6. **Auth cookie name**: `better-auth.session_token` - used consistently across API/UI
7. **Circular dependency check**: Both packages have `circular.ts` scripts using Madge - run before major refactors

## Quick Reference

-   **API Docs**: http://localhost:8080/ (Swagger UI in dev, auto-generated by Koritsu)
-   **Framework Docs**: [Koritsu](https://koritsu.dev), [better-auth](https://www.better-auth.com/)
-   **Main configs**: `compose.yaml`, `concurrently.config.mjs`, `packages/*/package.json`
-   **Route registration**: Auto-scanned from `packages/api/routes/**` (Koritsu file-based routing)
-   **Package manager**: Bun only - enforced via `preinstall` scripts
-   **Native Bun features used**: File client, SQL driver (via Drizzle), hot reload (`--hot` flag)
