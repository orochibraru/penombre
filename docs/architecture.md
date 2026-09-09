# Project architecture

Overview of the Penombre project architecture.

## Overview

Penombre is structured as a **Bun monorepo** with two packages:

- **Web** — SvelteKit full-stack app (frontend + REST API).
- **Docs** — SvelteKit static documentation site.

```text
penombre/
├── packages/
│   ├── web/       # SvelteKit — frontend + REST API + database
│   └── docs/      # SvelteKit — documentation
├── scripts/       # Shared tooling (API codegen, circular checks)
├── Dockerfile     # Multi-stage production build
└── compose.yaml   # Docker Compose (single app container)
```

## Web package

The web package is the core of Penombre — a SvelteKit application that serves
both the frontend UI and the backend REST API.

### Tech stack

| Layer     | Technology                                              |
| --------- | ------------------------------------------------------- |
| Framework | SvelteKit + Svelte 5                                    |
| Runtime   | Bun (via `svelte-adapter-bun`)                          |
| Styling   | TailwindCSS 4, shadcn-svelte (bits-ui)                  |
| ORM       | Drizzle ORM on SQLite (PostgreSQL optional)             |
| Auth      | Better Auth (email/password, OAuth, passkeys, API keys) |
| i18n      | Paraglide-JS (English + French)                         |
| Forms     | sveltekit-superforms + Valibot                          |
| API       | OpenAPI-first with Zod schemas                          |

### Backend architecture

```text
src/lib/server/
├── openapi/v1/    # API schema definitions (Zod + defineRoute)
├── services/      # Business logic
│   ├── storage/   # File/folder CRUD, caching, thumbnails
│   ├── activity.ts
│   ├── preferences.ts
│   └── user.ts
├── auth/          # Better Auth setup & seeding
├── db/            # Drizzle schema & connection
├── config.ts      # Runtime configuration (Zod-validated)
├── errors.ts      # Custom error classes
└── http.ts        # Standardized HTTP response helpers
```

#### OpenAPI-first API

API routes follow the **thin handler** pattern. Schemas are defined in
`src/lib/server/openapi/v1/` using `defineRoute()` with Zod, and route handlers
in `src/routes/api/v1/` delegate all business logic to the service layer.

```ts
// Route handler — thin wrapper
export const POST = createFile.handler(async ({ body, query, service }) => {
  const res = await service.createFile(body, query.folder);
  return Http.Ok(res);
});
```

All API responses use a standardized format via `Http.*` helpers:

```json
{ "data": { ... }, "message": "..." }
```

#### Service layer

Services encapsulate business logic and are instantiated per-request with the
authenticated user context. The main services are:

- **StorageService** — file/folder CRUD, uploads, downloads, sharing, metadata
  caching
- **ActivityService** — audit logging (create, update, delete, share, rename
  actions)
- **PreferencesService** — user layout and sorting settings
- **UserService** — profile management

#### Authentication

Better Auth handles authentication with the following plugins:

- **Email/password** — traditional sign-in with optional email verification via
  SMTP
- **OAuth** — any OIDC-compliant provider (Google, GitHub, Pocket ID, etc.)
- **Passkeys** — WebAuthn/FIDO2 passwordless authentication
- **API keys** — rate-limited keys for programmatic access

On startup, the server hook (`hooks.server.ts`) waits for the database, runs
Drizzle migrations, and seeds the initial admin account if no users exist.

#### Caching

The storage service uses a per-user cache to avoid repeated database and
filesystem queries for file listings, metadata, and folder sizes. The cache
layer is pluggable — the backend is selected automatically based on the
environment:

| Environment            | Backend    | Behavior                                                |
| ---------------------- | ---------- | ------------------------------------------------------- |
| Development (no Redis) | **Null**   | Caching disabled to avoid stale data during development |
| Production (no Redis)  | **Memory** | In-process `Map` with TTL (default 30 s)                |
| Any (with `REDIS_URL`) | **Redis**  | Distributed cache shared across instances               |

All three backends implement the same async `CacheBackend` interface, so the
rest of the codebase is backend-agnostic. See
[Environment variables](env.md#redis-optional) for configuration.

#### Configuration

Runtime configuration is loaded from environment variables and validated with
Zod at startup. Defaults are defined in `config.defaults.ts`. See
[Environment variables](env.md) for the full reference.

### Frontend architecture

```text
src/lib/
├── components/
│   ├── ui/           # 40+ shadcn-svelte components
│   └── ...           # File views (grid, list, table), dialogs, etc.
├── store/            # Svelte stores
│   ├── actions.ts    # File/folder action state
│   ├── music.ts      # Audio player state
│   ├── sorting.ts    # Layout & sorting preferences
│   ├── title.ts      # Page title
│   └── upload.ts     # Upload progress tracking
├── schemas/          # Form validation (sveltekit-superforms)
├── paraglide/        # Generated i18n (en/fr)
└── hooks/            # Client-side hooks
```

The frontend uses **Svelte 5 runes** (`$state`, `$derived`, `$effect`) for
reactivity and **shadcn-svelte** for the component library. All user-facing
strings go through Paraglide-JS for internationalization.

## Docs package

A static documentation site built with **SvelteKit** and
[@orochibraru/docs](https://github.com/orochibraru/docs), prerendered to plain
HTML for deployment anywhere.

Content lives in plain markdown files under `docs/`, one file per guide.
Everything else — site name, sidebar order, landing page copy — is
`src/lib/config.ts`. Full-text search runs client-side over the bundled content,
with no index file and no search dependency.

## Database

Penombre uses **Drizzle ORM** on **SQLite** by default, with **PostgreSQL** as
an optional alternative for multi-instance deployments. The dialect is picked
from the `DATABASE_URL` scheme; migrations for both live under `drizzle/` and
are auto-generated via `drizzle-kit generate` and applied on startup.

## Infrastructure

### Docker

The production Docker image uses a multi-stage build:

1. **base** — Alpine + Bun runtime
2. **deps** — Install dependencies with a frozen lockfile
3. **builder** — Shared source layer both build targets start from
4. **app-builder** / **docs-builder** — Build the app, and the docs site
5. **app** / **docs** — The two runtime images: the app on Bun with `ffmpeg` and
   `poppler-utils` for media thumbnails, the docs site on nginx

The app image runs as a non-root `bun` user, with a health check built by the
SvelteKit adapter.

### Docker Compose

The default `compose.yaml` defines a single service:

- **app** — the Penombre web server on port `3000`, with a persistent `/data`
  volume holding both the SQLite database and file storage

Optional **db** (PostgreSQL) and **redis** services can be added — see
[Deployment](deployment.md).

### Shared scripts

| Script        | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| `gen-api.ts`  | Generate OpenAPI types for the web app from the API spec |
| `circular.ts` | Detect circular dependencies via madge                   |
