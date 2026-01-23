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
  - `bun run test` or `bun test '.test.'` → Bun test runner. **Always run from the root of the repo.** Use the `.test.` pattern to avoid running e2e tests unintentionally.
  - `bun run lint` / `bun run lint:fix` → Biome lints/formatting.

## Environment & Deployment
- Docker Compose defines `db` and `app` services (see [compose.yaml](compose.yaml)). App uses envs like `DATABASE_URL`, `ORIGIN`, `ENV`, `LOG_LEVEL`.
- Dockerfile builds only the web package; runtime is Bun. `STORAGE_PATH` defaults to `/data` inside container.
- Admin storage info: `AdminStorageService.getAvailableStorageSize()` uses `statfs` or `df -k` to compute free bytes.
## Internationalization (i18n)
- Web app uses **Paraglide** for internationalization with localStorage/cookie-based locale storage (NO path-based routing like `/en` or `/fr`).
- Configuration:
  - Vite plugin in [vite.config.ts](packages/web/vite.config.ts): `paraglideVitePlugin` with strategy `["localStorage", "cookie", "baseLocale"]`.
  - Message files: [packages/web/messages/en.json](packages/web/messages/en.json) and [packages/web/messages/fr.json](packages/web/messages/fr.json).
  - Runtime functions: imported from `$lib/paraglide/runtime` (auto-generated).
- Usage in components:
  - Import messages: `import { m } from "$lib/paraglide/messages.js";`
  - Simple strings: `{m.sign_in()}` or `m.error_title()`
  - Parameterized messages: `{m.signing_in_with_provider({ provider })}` for messages like `"Signing in with {provider}..."`.
- Language switching:
  - Component: [language-dropdown.svelte](packages/web/src/lib/components/language-dropdown.svelte) calls `setLocale(locale)` and reloads the page.
  - Locale preference is persisted in localStorage and cookies automatically.
- **Critical**: Do NOT use path-based paraglide middleware (`paraglideMiddleware`). The project explicitly avoids URL prefixes for locales since it's a personal dashboard, not a public website.
- When adding new UI text, always add entries to both `en.json` and `fr.json` with matching keys. Use descriptive keys like `sign_in_message`, not generic ones.
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

## Upload UX Pattern
- Upload dialog ([upload-dialog.svelte](packages/web/src/lib/components/layout/dialogs/upload-dialog.svelte)) closes immediately when upload starts - no blocking.
- Progress tracked via stores: `uploadingItems` (filename → percentage) and `uploadedItems` (filename → ObjectItem).
- Background progress indicator ([upload-progress-indicator.svelte](packages/web/src/lib/components/layout/upload-progress-indicator.svelte)) appears at bottom-right:
  - Shows per-file progress bars while uploading
  - Auto-dismisses 5 seconds after completion
  - User can manually expand/collapse or dismiss
  - Positioned fixed at bottom-right, Google Drive style
- Global progress available via `globalUploadProgress` derived store (count, isUploading, progress percentage).

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
- DO NOT leave any typescript errors or warnings in the code. If you see any, fix them. If you don't see any, check anyway by cding into "packages/web" and running `bun run check`, fix them even if you don't think you created them.
- DO NOT leave any linting issues in the code. If you see any, fix them (the tool is Biome). If you don't see any, check anyway by cding into "packages/web" and running `bun run lint:fix`
- If your task comes from a TODO.md item, make sure to mark it as complete when done.
- If you think what you just did justifies an update to these instructions, don't ask and change them directly. This can include adding new sections if you think they are relevant. Same goes for the main README.md.

---
If anything above is unclear (e.g., dev port vs Docker port, DB usage boundaries, or missing API generation flow), tell me what you’re trying to do and I’ll refine these instructions.
