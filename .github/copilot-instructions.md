# Copilot Instructions for Opendrive

## Overview
- Monorepo with `packages/web` (SvelteKit + Bun) and `packages/mobile` (Expo). Backend APIs are implemented inside the web app using Hono routers and SvelteKit server code.
- Primary runtime is Bun (1.3.x). Use Bun for scripts, testing, and dev servers.
- Storage is local filesystem under `STORAGE_PATH` (default `/data`), per-user in `user-<id>` folders. Metadata is JSON alongside content.

## Architecture & Data Flow
- UI (SvelteKit) calls internal API routes; typed client in `$lib/api-client` is used from components like [packages/web/src/lib/components/file/wrapper.svelte](packages/web/src/lib/components/file/wrapper.svelte).
- Server (Hono routers within SvelteKit):
  - Folders: [packages/web/src/lib/server/routes/storage/folders.ts](packages/web/src/lib/server/routes/storage/folders.ts)
  - Files/Objects: [packages/web/src/lib/server/routes/storage/objects.ts](packages/web/src/lib/server/routes/storage/objects.ts)
- Services (business logic):
  - Storage: [packages/web/src/lib/server/dto/storage.ts](packages/web/src/lib/server/dto/storage.ts)
  - Activity: `$lib/server/dto/activity` (used for logging user actions)
- Database: PostgreSQL (compose file). Drizzle ORM present in web package; DB usage is primarily user accounts and activity.

## Authentication
- Web uses Better Auth. `User` types are imported from `better-auth` and injected into Hono context (see routers using `c.get("user")`). Route guards reject if missing, and `StorageService.permissionsCheck()` enforces `metadata.owner === user.id`.
- Build-time requirement: Dockerfile sets `ORIGIN=http://localhost` during `vite build` for Better Auth import validation. Keep `ORIGIN` aligned with your deployment host.

## Storage Model & Conventions
- Files live under `STORAGE_PATH/user-<userId>/...` with adjacent metadata in `filename.ext.meta.json`.
- Folder metadata lives inside the folder in `.keep.meta.json`. A `.keep` file may exist; older folders may store JSON there.
- Soft-trash: set `metadata.isTrashed = true`.
  - Files: PUT on `/storage/objects/item/:item` sets `isTrashed`.
  - Folders: PUT on `/storage/folders/folder/:folder` sets `isTrashed` in `.keep.meta.json`.
- Listing behavior:
  - Objects: `abstractListFiles()` excludes trashed items unless `includeTrashed` is true (see [storage.ts](packages/web/src/lib/server/dto/storage.ts#L554-L599)).
  - Folders: `listFolders()` excludes trashed by default, or lists only trashed via router `/storage/folders/trash`.
- Renaming: `updateFile()` preserves subdirectory when `data.key` is a basename; it copies+deletes both file and its `.meta.json`.

## Developer Workflows
- Dev (root):
  - `bun run dev` → starts Postgres via Docker Compose and the web dev server via Vite (see [concurrently.config.ts](concurrently.config.ts)).
  - Access web UI: verify port at runtime. README references `8080`; Vite default is `5173`; Docker `app` exposes `3000` with `ORIGIN` set accordingly.
- Web package:
  - `bun run dev` → Vite dev server.
  - `bun run build` → SvelteKit sync + Vite build; Dockerfile uses this to produce `/app/build`.
  - `bun run check` → SvelteKit sync + `svelte-check`.
- Testing/Linting (root):
  - `bun run test` → Bun test runner.
  - `bun run lint` / `bun run lint:fix` → Biome lints/formatting.

## Environment & Deployment
- Docker Compose defines `db` and `app` services (see [compose.yaml](compose.yaml)). App uses envs like `DATABASE_URL`, `ORIGIN`, `ENV`, `LOG_LEVEL`.
- Dockerfile builds only the web package; runtime is Bun. `STORAGE_PATH` defaults to `/data` inside container.
- Admin storage info: `AdminStorageService.getAvailableStorageSize()` uses `statfs` or `df -k` to compute free bytes.

## Mobile App (Expo)
- Location: [packages/mobile](packages/mobile)
- Start:
  - `npm install` then `npx expo start` (see [packages/mobile/README.md](packages/mobile/README.md)).
- Routing: file-based under `packages/mobile/app/`.
- Backend integration: when calling web APIs from device/emulator, avoid `localhost`.
  - iOS Simulator: use host machine IP (e.g., `http://192.168.x.x:3000`).
  - Android Emulator: use `http://10.0.2.2:3000` or `adb reverse` to map ports.
- Auth: Better Auth runs server-side in web; mobile should call the same Hono endpoints. If you want typed clients on mobile, mirror web’s OpenAPI generation (e.g., `openapi-typescript`) or share a minimal fetch wrapper.

## Patterns & Gotchas
- Always pass folder prefixes carefully; use empty `""` for storage root in `listFolders()` to avoid `join()` resetting to OS root.
- When creating folders, write both `.keep` and `.keep.meta.json` so downstream filters work.
- For partial content, range requests are supported via `generateRangeHeaders()`.
- Prefer service methods for mutations; routers are thin wrappers that decode params and call `StorageService`.
- Better Auth build-time check: ensure `ORIGIN` is set in any environment running `vite build` (Dockerfile already handles this).
- Mobile networking: never hardcode `localhost`; parameterize API base URL per platform.

## Useful File References
- Listing/trash filtering: [storage listing](packages/web/src/lib/server/dto/storage.ts#L554-L599), [folder listing](packages/web/src/lib/server/dto/storage.ts#L176-L219)
- Folder routes: [folders router](packages/web/src/lib/server/routes/storage/folders.ts)
- Object routes: [objects router](packages/web/src/lib/server/routes/storage/objects.ts)
- UI actions using API client: [wrapper.svelte](packages/web/src/lib/components/file/wrapper.svelte)

## How to Integrate New Features
- Add server logic in `StorageService` and expose via Hono routers under `packages/web/src/lib/server/routes/...`.
- Respect `isTrashed` semantics and metadata locations.
- Keep file moves/renames atomic where possible; for local FS, `fs.promises.rename` is acceptable if cross-device moves aren’t needed.
- Remember to add unit/integration tests when addind a new feature and to adapt them if modifying something. If you don't see any and it would seem relevant to you to add some, ask the user if they want to add some. 
- DO NOT leave any typescript errors or warnings in the code. If you see any, fix them.
- DO NOT leave any linting issues in the code. If you see any, fix them (the tool is Biome)
- If your task comes from a TODO.md item, make sure to mark it as complete when done.

---
If anything above is unclear (e.g., dev port vs Docker port, DB usage boundaries, or missing API generation flow), tell me what you’re trying to do and I’ll refine these instructions.
