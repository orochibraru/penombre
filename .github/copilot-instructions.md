# Project Guidelines

Penombre is a self-hosted cloud storage platform with web, mobile, and docs packages.

## Architecture

Bun monorepo with three packages:

- **`packages/web`** — SvelteKit full-stack app (frontend + REST API). Svelte 5, TailwindCSS 4, shadcn-svelte (bits-ui), Drizzle ORM on PostgreSQL, Better Auth (email/password, OAuth, passkeys, API keys), Paraglide-JS i18n (en/fr).
- **`packages/mobile`** — Expo + React Native app. NativeWind styling, Expo Router, openapi-fetch client.
- **`packages/docs`** — Next.js 16 + Fumadocs documentation site. Static export.

### Web backend patterns

- **OpenAPI-first**: Route handlers are thin wrappers importing from `src/lib/server/openapi/`. API schemas defined with Zod, auto-generated OpenAPI spec.
- **Service layer**: Business logic lives in `src/lib/server/services/` (storage, activity, preferences, user). Route handlers delegate to services.
- **Database**: Drizzle ORM with PostgreSQL. Schema at `src/lib/server/db/schema.ts`. Migrations in `drizzle/` via `drizzle-kit generate`.
- **Auth**: Better Auth with Drizzle adapter. Rate-limited in production. Hooks in `hooks.server.ts` handle DB polling, migrations, and auth middleware.
- **Config**: Centralized in `src/lib/server/config.ts` with defaults in `config.defaults.ts`.

### Web frontend patterns

- **Svelte 5** runes (`$state`, `$derived`, `$effect`) — no legacy `let` reactivity.
- **shadcn-svelte** components in `src/lib/components/ui/`. Import from `$lib/components/ui/`.
- **File views**: Grid, list, and table layouts in `src/lib/components/`.
- **Stores**: Svelte stores in `src/lib/store/`.
- **Utilities**: `cn()` for class merging at `$lib/utils`. Path aliases: `$lib` → `src/lib`.

## Code Style

- **Formatter/linter**: Biome. Run `bun run lint` to check, `bun run lint:fix` to auto-fix, `bun run format` to format.
- **Quotes**: Double quotes.
- **Strict rules**: `useConst`, `noParameterAssign`, `useSelfClosingElements`, `useSingleVarDeclarator`, `useMaxParams`.
- **TypeScript**: Strict mode, ESNext target. Use `const` over `let` where possible.

## Build and Test

```bash
bun install                  # Install all dependencies
bun run dev                  # Start PostgreSQL (Docker) + Vite dev server
bun run build                # Build web package
bun run check                # Type-check all workspaces
bun run lint                 # Lint with Biome
bun run format               # Format with Biome
bun test                     # Run tests with Bun (coverage enabled)
bun run gen:api              # Regenerate OpenAPI types for web + mobile
bun run db:diagram           # Generate DB diagram SVG
bun run circular             # Check for circular dependencies
```

### Package-specific commands

```bash
# Web
cd packages/web
bun run gen:routes            # Regenerate kit-routes
bun run db:generate           # Generate Drizzle migrations
bun run machine-translate     # Machine-translate i18n messages

# Mobile
cd packages/mobile
bun run dev                   # Start Expo dev server
bun run ios                   # Run on iOS
bun run android               # Run on Android

# Docs
cd packages/docs
bun run dev                   # Start Next.js dev server
```

## Conventions

- **i18n**: All user-facing strings go through Paraglide-JS. Message files at `packages/web/messages/{en,fr}.json`. Import messages from `$lib/paraglide/messages.js`.
- **API client**: Web uses openapi-fetch with types generated from `src/lib/api/v1.d.ts`. Mobile uses the same pattern from `lib/api.v1.d.ts`.
- **Form validation**: sveltekit-superforms with Valibot or Zod schemas (in `src/lib/schemas/`).
- **Errors**: Custom error classes in `src/lib/server/errors.ts`. HTTP responses via `src/lib/server/http.ts`.
- **Docker**: Production uses multi-stage Dockerfile with `svelte-adapter-bun`. Storage volume at `/data`.
- **File categories**: `FileCategoryEnum` in `src/lib/file-helpers.ts` — MUSIC, DOCUMENTS, IMAGES, 3D, VIDEO, CODE, ARCHIVES, UNKNOWN, RECENT.
