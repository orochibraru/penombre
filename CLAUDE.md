# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Keeping this file current

**When you learn something non-obvious about this repo, write it here in the
same change.** Not a summary of what you did — the durable fact that would have
saved you the detour: a gotcha, an invariant, the reason a thing is shaped the
way it is. If you had to read three files or debug for ten minutes to find it,
it belongs here. Prune anything that has become wrong.

## Commands

Runtime is **Bun**; use `bun`/`bunx`, not `npm`/`node` (`preinstall` enforces
this). `mise.toml` pins Bun and Go, and `mise run doctor` checks the worker's
ffmpeg/ffprobe/pdftoppm. Those versions live in four places that must agree:
`mise.toml`, `package.json`'s `packageManager` (CI's `setup-bun` reads it),
`go.mod` (CI's `setup-go` reads it) and the Dockerfile's `FROM` lines. The
golang image sets `GOTOOLCHAIN=local`, so a `go.mod` newer than its `FROM` fails
the image build instead of downloading a toolchain.

```bash
bun run dev              # Vite dev server (SQLite by default, no services needed)
bun run build            # svelte-kit sync && vite build
bun run preview          # preview the production build
bun run check            # check:app && check:scripts && check:go, sequentially

bun run lint             # every pre-commit hook over the whole repo, fixing what it can
bun run circular         # madge circular-import check (src/, .ts only)

bun test                                    # unit tests (fully mocked, no services needed)
bun test src/lib/server/services/user.test.ts   # single file
bun test -t "some test name"                # filter by test name
bun run test:docker      # unit tests in Docker (mirrors CI, adds real Redis)
bun run test:e2e         # Playwright e2e on SQLite (the default stack)
bun run test:e2e:pg      # Playwright e2e on PostgreSQL
bun run test:e2e:ui      # Playwright UI mode
bun run test:e2e:headed  # Playwright e2e, headed browser

bun run db:generate         # generate Drizzle migrations for both dialects
bun run db:generate:pg      # ...Postgres only
bun run db:generate:sqlite  # ...SQLite only
bun run db:studio           # Drizzle Studio
bun run migrate:storage     # one-off: migrate legacy storage metadata

bun run gen              # gen:env && gen:api && format
bun run gen:api           # alias of gen:openapi
bun run gen:env           # regenerate .example.env from config.defaults.ts
bun run gen:openapi       # regenerate openapi.json + the typed client types
bun run gen:paraglide     # compile messages/*.json into src/lib/paraglide
bun run machine-translate # inlang machine translation for messages/*.json

bun run check:go            # go vet, cmd/ + internal/ + tests/{unit,integration}/go (also part of `bun run check`)
bun run test:go             # go test -race, unit + integration together
bun run test:go:unit        # go test -race, tests/unit/go only (no DB, no external binary)
bun run test:go:integration # go test -race, tests/integration/go only (SQLite/Postgres or ffmpeg/pdftoppm)
```

The Go worker needs `ffmpeg` built **with the `libwebp` encoder** — the plain
Homebrew `ffmpeg` formula ships decode-only webp
(`ffmpeg -encoders | grep libwebp` is empty), which silently produces zero-byte
thumbnails. On macOS: `brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-webp`
(after `brew uninstall ffmpeg` if the core formula is already installed).
Ubuntu/CI's `apt-get install ffmpeg` already includes it.

Unit tests preload `test.setup.ts` (see `bunfig.toml`), which mocks
`$app/*`/`#lib/server/*` modules and the Drizzle `db` object — tests don't need
a database or Redis running. `bunfig.toml` also sets `rerunEach = 3` (each test
runs 3x to catch flakiness) and coverage thresholds.

Git hooks run via [prek](https://github.com/j178/prek)
(`.pre-commit-config.yaml`, wired by `bun install`'s `prepare` script; the
installed hook types come from `default_install_hook_types`). Commits run the
fast linters on staged files; **pushes** run `bun run check`, `bun test`,
`bun run circular` and, when a `.go` file changed, `go test -race` over unit
**and** integration tests (so ffmpeg and pdftoppm must be installed). CI runs
the pre-commit stage with `--all-files`:

```bash
prek run --all-files                        # every pre-commit hook, whole repo
prek run --all-files --hook-stage pre-push  # type check + unit tests
prek run oxlint                             # a single hook
prek run markdownlint vale --all-files      # a few hooks, whole repo
SKIP=test-unit git push ...                 # skip one hook
```

A linter's command lives in `.pre-commit-config.yaml` and nowhere else: there
are no per-linter scripts, and `bun run lint` is just `prek run --all-files`.
Where a script already exists (`check`, `circular`, `test:go`), the hook calls
it instead of repeating its command.

## Architecture

The **SvelteKit app lives at the repo root** (frontend + backend API). API
routes are plain SvelteKit `+server.ts` handlers built with a custom
`defineRoute()` wrapper, not a separate framework.

### API route pattern

Every `/api/v1/...` endpoint is defined in two places:

1. **Contract** (`src/lib/server/openapi/v1/<resource>.ts`): a `defineRoute()`
   call declares method, path, Zod schemas for params/query/body/response, and
   whether auth is required. This call also registers the route with the OpenAPI
   registry as an import-time side effect — that's why
   `src/lib/server/openapi/routes.ts` exists purely to import every contract
   module before the spec is generated. `#lib/server/generate-openapi.ts` pulls
   that module in itself, so both the live spec route and
   `gen:openapi`/`gen:api` always see every contract.
2. **Handler** (`src/routes/api/v1/.../+server.ts`): imports the contract object
   and calls
   `.handler(async ({ params, query, body, user, service, event }) => ...)`. The
   wrapper already did auth checking (401 if `requireAuth` and no user) and Zod
   validation (400/422) before your callback runs — callbacks just translate
   validated input into an `Http.Ok(...)`/`Http.ServerError(...)` response
   (`#lib/server/http`).

Adding an endpoint means adding both halves; skipping the contract means it
won't validate, won't show up in the OpenAPI spec, and the docs client
(generated by `gen:api`) won't see it.

### Storage: DB metadata vs. object bytes

File/folder **metadata** (name, path, size, mimetype, trash state, owner) lives
in the database (`files`/`folders` tables); SQLite by default, Postgres
optional, picked from the `DATABASE_URL` scheme by `db/dialect.ts`. The real
table definitions live in `db/schema.pg.ts`/`db/schema.sqlite.ts`, kept
structurally in sync by hand; `db/schema.ts` is a dialect-resolving shim that
re-exports whichever one is active under one Postgres-shaped type, so the rest
of the app imports from `db/schema.ts` and compiles against a single schema
regardless of which DB is running. The actual **bytes** live behind the
`StorageDriver` interface (`#lib/server/services/storage/driver.ts`),
implemented only by `LocalStorageDriver` (filesystem under `STORAGE_PATH`); the
interface stays because every consumer and test double types against it. All
driver methods take keys relative to a user's storage root. `StorageService`
(`#lib/server/services/storage/service.ts`) is the facade on top of the driver +
DB that route handlers use; it's lazily instantiated per-request onto
`event.locals.storageService` in `hooks.server.ts`.

### Heavy work runs in the Go worker

Thumbnails, waveforms, library-scan directory walks, media-duration probing, zip
archives, and the byte-copying/byte-deleting halves of transfer and trash all
run in a separate Go process (`cmd/worker`, executors under
`internal/jobs/<name>`), not inline in the request handler. TypeScript still
decides everything about **rows** — which files exist, what belongs in a zip,
which bytes survive a delete; it only hands the worker a job spec with absolute
paths and reads back the result.

The contract is the `jobs` table (`db/schema.ts`): the app
`enqueueJob({type, spec, dedupeKey?, priority})`
(`#lib/server/services/jobs.ts`) and `awaitJob(id)`s it; the worker claims a row
(`for update skip locked` — Postgres only, SQLite serialises through a single
writer), runs the matching executor from its `registry()`
(`cmd/worker/main.go`), and writes `status`/`result`/`error` back. Timestamps
are **epoch milliseconds** in a `bigint`/`integer` on both dialects — Go writes
one representation for both. SQL in Go uses `$1`-style placeholders only, since
SQLite's driver also accepts that form.

`priority` is a name, not a number: `interactive` (someone is waiting on screen:
a tile, a zip), `mutation` (copy, delete, scan-list, probe), `background`
(warm-ups). Warm jobs used to share priority 0 with everything, so a 20k-photo
scan's backlog starved the trash and the tiles alike. A dedupe hit **raises**
the queued job it joins — a tile asking for a render that was only queued as a
warm-up would otherwise wait behind every other warm-up.

`awaitJob` cancels on the way out: a job still `queued` at the deadline is
failed atomically, so a caller treating `undefined` as "nothing happened" is
right — a copy that timed out used to run later and leave bytes no row pointed
at. Thumbnails opt out (`cancelOnTimeout: false`): their job may be a warm-up or
another tile's request, and one tile's deadline must not kill it for all. A job
already `running` at the deadline is only waited for with `settle`, which
transfer and trash pass because they write rows from the outcome; the deadline
cancel is tried once, not on every poll. That wait is bounded by liveness and by
the worker's per-type execution timeout (`timeouts` in `worker.go`), not by the
app's clock: every worker upserts its `workers` row every 5s, and with none seen
for 30s `awaitJob` fails the job (queued, or running with a lapsed lease) and
logs that no worker is running. Until the first worker checks in after boot,
that grace is 5 minutes — a cold `go build` of the dev worker takes that long.
`consume` deletes a row once read, and every terminal write drops the spec —
scan listings and big copy specs used to sit in the table for days.

**One clock.** `seen_at`, `heartbeat_at`, `started_at` and `finished_at` are
stamped and compared with the **database's** clock (`dbNow` in `jobs.ts`,
`Store.now` in Go), never a process's. An external worker on a host whose clock
lagged by 30s looked dead, and every job failed on the spot. Go store methods
take no `now` for that reason; tests age a row with SQL instead.

**Copy and delete must never run unobserved** (`CALLER_BOUND` in `jobs.ts`,
`callerBound` in `worker.go`). Their caller writes rows from the outcome, so one
that runs with nobody awaiting leaves bytes no row points at (copy) or trash
rows whose bytes are gone (delete). The rules that hold that:

- **Requesters heartbeat.** Every app process has an `INSTANCE_ID`, stamped as
  `jobs.requested_by` on what it enqueues and beaten into `app_instances` every
  5s from `init()` (before anything can be enqueued). The worker checks it
  before starting a caller-bound job and on every lease renewal; with the
  requester silent for 30s it cancels the job, which stops at the next item and
  completes with what it did — the same path as a shutdown. The heartbeat keeps
  the lease until the executor actually returns, or a second worker would
  reclaim a job still finishing its last file.
- **Results name every path**, since the spec is dropped when a job ends: copy
  reports `copied` and each failure's `dest`; delete reports `deleted` and
  `deletedDirs`. The app puts a `context` (root, owner, volume — `jobContext()`
  in `scope.ts`) in the spec and both executors echo it back, so a process that
  was not the requester can map paths back to rows. An interrupted delete
  `lstat`s what it did not reach: bytes an earlier, crashed attempt already
  removed are reported `deleted`, because they are.
- **Ownership is `requested_by`, moved by compare-and-swap.** The requester
  deletes the row only after writing its rows, and only while it still owns it
  (`finishJob`). A finished copy/delete row still present therefore means its
  outcome was never fully applied. `reconcileOrphanedJobs` (`job-reconcile.ts`,
  at boot and every minute) takes those whose requester is gone — silent 30s,
  `'disowned'`, or `null` (legacy) — never this process's own id, and never a
  job in its in-memory `applying` set (outcome read, not yet finished or
  disowned). The id alone is not enough: adopted away during a pause and
  disowned back, a job's owner returns to this id while it is still applying.
  Deleting "orphan" copy bytes under a move that then deletes its source is
  permanent loss. It adopts each job first (`adoptJob`, a CAS) so only one party
  applies it. A requester whose apply throws disowns the job. One that finds its
  job adopted meanwhile keeps only rows whose bytes exist **and reports every
  pair failed**: the adopter may still be unlinking what its check just saw, so
  losing ownership never confirms a move — the source stays, and re-running the
  move loses nothing.
- **Reconciling is checked against rows and disk.** A copy's destinations with
  no row are removed (never visible; the source still has them); a delete's
  paths lose their **trash** rows only if the bytes are still gone — on a volume
  a new file can be trashed at the same path. "Gone" is `bytesGone()`
  (`reconcile.ts`): `lstat`, ENOENT only, everywhere a row is deleted for
  missing bytes — `objectExists` (`Bun.file().exists()`) answers false on
  EACCES, and a row deleted for bytes the app merely could not read is
  resurrected untrashed by the scan. Only what the record names, never a sweep,
  and never when `context.root` is not the service's root. `Prune` never deletes
  such a row; reconciliation does. A record with no `context` (pre-reconcile
  rows) is dropped with a log.
- **A copy/delete never ends without a record.** When it is failed without
  reporting (no worker, a crash loop, the app's own stale-lease abandon), its
  **spec becomes its result** (`failed()` in `jobs.ts`, `Prune` in Go), read as
  "every path possibly touched". With no outcome, emptying the trash treats the
  disk as the record (`objectExists` per file), and a transfer runs
  `reconcileCopy` over every failed destination.
- At boot, `failOrphanedJobs()` fails queued ones whose requester is gone (the
  same predicate — a live instance's queued job is its own): they never started,
  so nothing is lost. A running one is left for a worker to stop and record.
- Attempts: the same `MaxAttempts` real runs as any job, then one claim that
  only records (cancelled context, an `lstat` per unreached delete); if even
  that crashes, `Prune` finalizes it with its spec as the record.
- An embedded worker whose app died without signalling it (OOM, SIGKILL) exits
  on its own: `WORKER_PARENT_PID` plus `WatchParent`.
- **The one window left is inherent:** a worker partitioned from the database
  keeps moving bytes until it has failed to renew its lease for a whole lease
  (60s), then cancels itself. Those bytes are covered by the same rules — the
  app abandons the job with its spec as the record, the trash checks the disk
  and a transfer removes every failed destination — except a copy landing
  _after_ the requester's cleanup, which leaves at most the files that worker
  wrote in that one lease as unreferenced bytes.

`INSTANCE_ID` lives on `globalThis`: a dev HMR reload of `jobs.ts` otherwise
minted a new id while the old beat interval kept beating the old one, and every
new job looked orphaned to the worker within 30s.

Dedupe is a partial unique index (`dedupe_key` where queued/running) plus
`on conflict do nothing`, not check-then-insert, so two tiles racing get one
job. `jobs.test.ts` runs against the real SQLite migrations, as do the Go store
tests — neither mocks the SQL.

SQLite runs in **WAL mode with a busy_timeout** (`db/index.ts`) specifically so
the app and the worker — two separate processes opening the same `.sqlite` file
— don't collide; without it a claim from one process could lock the other out
instantly instead of waiting briefly.

`WORKER_MODE` (`embedded`, default, or `external`) controls whether the app
spawns the worker itself (`#lib/server/services/worker-process.ts`, restarted
with backoff on exit — a missing binary throws synchronously from `Bun.spawn`,
which is retried the same way rather than failing `init()`) or expects a
separate `penombre-worker` container pointed at the same `DATABASE_URL` and the
same storage/volume mount paths — see `docs/worker.md`.

### Request lifecycle (`hooks.server.ts`)

`handle = sequence(generalHandler, authHandler)`. `authHandler` resolves the
session two ways: a better-auth cookie session, or an API key fallback
(`x-api-key` header or `Authorization: Bearer`) for programmatic clients —
either path sets `event.locals.user`, `.storageOwner` and `.storageService`.
Non-auth paths are then handed to `svelteKitHandler` (better-auth's SvelteKit
adapter). `init()` (SvelteKit's app-init hook) waits for the DB, runs Drizzle
migrations, seeds the default admin user, and migrates legacy storage metadata
on every boot.

### Config

`#lib/server/config.ts` builds a single Zod-validated `AppConfig` from
`process.env` (see `config.defaults.ts` for defaults, and `.example.env`,
regenerated by `bun run gen:env`, for the full var list). OAuth providers are
declared dynamically via `OAUTH_<NAME>_<FIELD>` env vars rather than a fixed
list — `parseOAuthProviders()` discovers provider names by scanning env keys.

### Cache

`#lib/server/cache` (`CacheBackend`: Memory, Redis with `REDIS_URL`, Null) now
serves only the rate limiter. Storage listings used to be cached per user for
30s behind a wholesale invalidation called from 28 places; a page is ~2.5ms of
indexed SQL on a 20k-file folder, hits were rare, and every new listing or
counter was one missed prefix away from a stale badge. It was removed. Do not
bring a listing cache back without a measurement that needs it.

### i18n

Messages live in `messages/*.json`, compiled by `gen:paraglide` into
`src/lib/paraglide` only. Don't hand-edit generated paraglide output.

## Documentation (required)

**Every user-facing feature or env var ships with its docs in the same change.**
The guides live in `docs/*.md` at the repo root. The docs site is built from
those exact files by a separate repository
([@orochibraru/docs](https://github.com/orochibraru/docs)), so there is nowhere
else to write them and nothing in this repo renders them.

- New/changed env var → add it to the relevant table in `docs/env.md` **and**
  the guide that explains the feature (`authentication.md`, `storage.md`,
  `simple-mode.md`, …).
- New behaviour with no env var → the guide it belongs to, or a new
  `docs/<slug>.md` **plus an entry in `docs/config.json`**, which sets the docs
  site's categories, order, titles and icons (schema:
  `https://orochibraru.com/docs-config.schema.json`).
- Also regenerate `.example.env` (`bun run gen:env`) when you touch
  `config.defaults.ts`.
- `markdownlint` and `vale` must pass
  (`prek run markdownlint vale --all-files`): 80-column prose, aligned table
  pipes. Relative links between guides (`simple-mode.md#anchor`) are rewritten
  by the docs site — use them instead of absolute URLs.

A feature that isn't in `docs/` isn't finished.

## Linting gotchas (oxlint)

Linting is **oxlint** (`--type-aware`, `.oxlintrc.json`); Biome's linter is off
and it only formats and sorts imports. Suppress a rule with
`// oxlint-disable-next-line <rule> -- <reason>`, never a `biome-ignore`.

- `no-console` is an **error** in app code — use `Logger` from `#lib/logger`,
  not `console.*`. Console is only allowed in `logger.ts` itself, tests and
  scripts.
- `typescript/no-floating-promises`/`no-misused-promises` are errors — always
  `await` or explicitly handle promises.
- Test/script/config files relax size, complexity, `no-explicit-any` and
  `no-console`. `no-await-in-loop` is off everywhere: most loops here are
  deliberately sequential.

## Comments

**Only when absolutely necessary, and few words.** Code that reads clearly needs
no narration. A comment earns its place when it records something the code
cannot say: a non-obvious constraint, a why-not, a bug it exists to prevent.
Never restate what the next line does, never explain a design in paragraphs,
never leave a changelog in a comment.

## Layout rules

**Do not reach for `max-w-*` by default.** Most things must fill their container
— the page shell and the tab strip already bound the content. A width cap is a
deliberate choice for a specific reason (a single-column reading measure, a form
that would look absurd at 2000px), not a reflex to add to every wrapper. Panes
inside tabs are full width. When a wide screen leaves a layout looking sparse,
add columns (`xl:grid-cols-2`, `2xl:grid-cols-3`) rather than capping the width.

## Gotchas learned the hard way

### `app.css` layering

Surface overrides (`[data-slot="card"]`, `[data-slot="sidebar-inner"]`, …) live
**unlayered** at the bottom of `app.css`, not in `@layer base`. Tailwind's own
utilities sit in `@layer utilities`, which outranks `@layer base` — a rule there
loses to the `bg-sidebar` / `shadow-sm` classes already on those components.
Unlayered CSS beats every layer, so that is where those rules actually land.

### `backdrop-filter` breaks `position: fixed`

An element with `backdrop-filter` becomes a containing block for fixed-position
descendants. Putting it on `[data-slot="sidebar-inset"]` tore any fixed child
off the viewport. Glass on that panel is applied via a `::before` pseudo-element
instead — a pseudo has no element descendants, so it carries the frost safely.

### Theming

Appearance is three `data-*` attributes on `<html>` (`data-font`,
`data-corners`, `data-accent`), written by `applyTheme()` in `#lib/theme.ts`
from the user's saved preferences and read by the theme block at the bottom of
`app.css`. Everything downstream already reads `--radius`, `--app-font` and
`--primary`, so switching an attribute re-themes the whole app — never hard-code
a colour or radius in a component.

### Shipped UI defaults

System theme, bordeaux accent, standard (sans) typeface, rounded corners, list
layout, sorted by last modified descending. The accent default lives in
`defaultPreferences` (`services/preferences.ts`), `applyTheme()`'s fallback,
onboarding's seed and `themeHandler` in `hooks.server.ts`, which stamps
`data-accent` into every page's HTML, signed in or not. The unstyled `:root` in
`app.css` is purple and only shows under `data-accent="purple"`. A saved accent
wins over the default, so an account that kept purple through onboarding stays
purple.

The logo is inline SVG (`components/logo.svelte`) filled with `--primary`; an
`<img src="/logo.svg">` cannot read page CSS and stayed purple under every
accent. The static `favicon.svg`/`logo.*` carry the default's colour.

### Shiki output is not styled by its wrapper

`Code.Root` renders highlighted HTML through `{@html}`, so Shiki's own `<pre>`
does not inherit the wrapper's wrapping classes. A long line pushed it to tens
of thousands of pixels wide and scrolled the content out of view. The `.shiki`
rule at the bottom of `app.css` wraps it. Beware viewport-relative caps
(`max-w-[60vw]`) on anything that can appear inside a dialog — it sizes against
the window, not the dialog.

### Invitations have no credential

An invited account is one with **no `account` row of
`providerId: "credential"`** — that absence is the marker, not a flag column.
`createUser` requires a password, so the invite action creates one and deletes
the credential row immediately after.

Onboarding then writes the credential itself via
`(await auth.$context).internalAdapter.createAccount()` with
`ctx.password.hash()`. It cannot use `changePassword` (no current password) or
`setUserPassword` (needs an admin session the invitee does not have).

**The missing credential is not the proof; the invite token is.** Onboarding
used to accept any address with no credential row, which is also every OAuth-,
passkey- and magic-link-only account, and sign-in's `lookup` pointed at exactly
those: anyone could set a password on them. `setPassword` now consumes a
single-use token from `invites` (`services/invites.ts`, atomic
`update ... returning`), and `lookup` never offers onboarding to an account
holding any `account` row or passkey (`hasAnyIdentity()`).

### A form action is not behind its layout's `load`

SvelteKit runs a form action before any `load`, layout loads included, and
`hooks.server.ts` has no auth gate. The admin check in `admin/+layout.server.ts`
therefore protected navigation only: a bare POST to `/admin/settings?/save`
rewrote SMTP and OAuth with no session at all. Every admin action calls
`requireAdmin(locals)` (`auth/require-admin.ts`) itself, and any new action
anywhere checks its own caller.

### Raw bytes are served sandboxed, except PDFs

A stored HTML or SVG file opened from its raw URL ran script on the instance
origin with the viewer's session. `rawFileSecurityHeaders()`
(`storage/mappers.ts`) puts `Content-Security-Policy: sandbox` and `nosniff` on
every raw response, and active types (`isActiveContentType`: HTML, XHTML, SVG,
XML) are always served as `attachment`. PDFs get `nosniff` only: Chrome refuses
to display a sandboxed PDF at all, which blanked every `<embed>` preview. Every
route serving file bytes must spread those headers.

### A periodic job must never reject

Bun exits the process on an unhandled promise rejection. A `void sweep()` from a
`setInterval` that let one database or filesystem error escape took the whole
app down on the hour. Every scheduled job in `hooks.server.ts` catches and logs,
like `sweepStaleZips`.

### Rate limits need the real client address

`#lib/server/rate-limit.ts` keys on `getClientAddress()`, which behind a reverse
proxy is the proxy's IP unless `ADDRESS_HEADER` (and `XFF_DEPTH`) are set, which
svelte-smol reads like adapter-node. Without them the sign-in `lookup` limit is
one bucket for the whole instance and 30 requests lock everyone out. See
`docs/reverse-proxy.md`. A limiter keyed on caller-chosen values (share tokens)
counts only once the value is known to exist, or each fake one is a cache entry
that is never read again.

### Shares and grants have no foreign key

`shares.resource_id` and `sharings.resource_id` point at a file **or** a folder,
so no constraint can cascade them. Every place a file or folder row is
permanently deleted calls `purgeGrantsFor()` (`storage/grants.ts`), which chunks
its ids: an `inArray` over a 70k-item trash is past Postgres's 65535 bind
parameters and throws after the bytes are already gone.

### A hidden `required` input blocks form submission

The two-step sign-in hides the password field until the address is known. Its
`required` must be bound to the same flag — a hidden required control fails HTML
validation with "An invalid form control is not focusable" and the submit
silently does nothing.

### Instance settings vs. environment

`app_settings` (one row, `services/app-settings.ts`) is the runtime half of the
configuration. The rule is **env wins when it is set, otherwise the database
governs** — see `envProvided()` in `config.ts`, which reports which vars are
actually present rather than inferring from a resolved value.

That distinction matters: a default is indistinguishable from a deliberate env
value, so treating "env always wins" left `ENABLE_EMAIL_SIGNIN` pinned to its
default with no way to change it once the var was removed from `.env`. The admin
UI renders a setting read-only only when `envProvided()` says the environment
claims it.

Sign-in settings need no restart; see "Sign-in settings apply on the next
request".

### OAuth providers come from two places

Env-declared (`OAUTH_<NAME>_*`, owned by `config.ts`) and stored (`app_settings`
`oauthProviders`, written by **Admin → Settings**). `auth/index.ts` merges them
with env winning a name collision, and `loadedOAuthProviders()` is what the
sign-in page and `/api/v1/auth/providers` must read: it refreshes first, so it
never offers a provider the running instance has not registered.

Three more things that bite:

- The callback is better-auth's core `callback/:id` under our basePath —
  `/api/v1/auth/callback/<id>` — because `genericOAuth` registers providers as
  ordinary social providers. Not `/oauth2/callback/...`, which older versions
  used.
- A provider id is stored on every `account` row, so the admin UI shows it
  read-only once saved, and the client secret is never sent back to the page (a
  blank secret field means "keep the stored one").
- `resolveAuthConfig()` used to return the defaults unless one of three env vars
  was set, which dropped every `OAUTH_<NAME>_*` block in a deployment that set
  nothing else. Declaring a provider now counts as configuration, and with
  `ENABLE_OAUTH_SIGNIN` absent, having an enabled provider is what turns OAuth
  sign-in on (`isOAuthSignInEnabled()`). The config schema no longer demands an
  env provider when OAuth is on — they can all live in the database.

### Sign-in methods cannot be turned off blindly

`services/auth-methods.ts` gates every save of the sign-in settings on two
rules: at least one method must survive, and a method may not be removed while
accounts depend on it (`strandedAccounts(method, surviving)` counts users of
that method holding none of the methods left enabled). Magic link and emailed
codes are exempt from the second rule — they authenticate an address, not a
stored credential, so no `account` row depends on them.

**Passkeys are not `account` rows**: better-auth's plugin keeps them in the
`passkey` table. Counting `account.providerId = 'passkey'` returned 0 forever;
count `passkey.userId`.

`validateSignInMethods` takes the stranded-count lookup as its third argument so
the rules can be tested without a database; the default is the real query.

### Sign-in settings apply on the next request

Every plugin is always loaded (password, passkey, magic link, email OTP). The
toggles are enforced by `METHOD_GATES` in `hooks.before` (`auth/index.ts`),
which reads the live setting and answers 403 on that method's sign-in, reset and
enrolment endpoints. Building the plugin list from the settings at init used to
leave a disabled method signing people in until the next restart.

OAuth providers cannot be gated that way: they are better-auth configuration.
`auth` is therefore a proxy over an instance that `refreshAuth()` rebuilds when
the resolved provider list changes. The admin actions call it after a save, and
`hooks.server.ts` calls it before any OAuth request (`OAUTH_PATH`), so another
app process catches up on first use. Importers keep `auth.api.*` unchanged.
Adding a new gated endpoint means adding its path to `METHOD_GATES`; the
endpoint paths come from the plugins' `createAuthEndpoint` calls.

### A preferred sign-in method is a hint, never a gate

`preferredSignInMethod` (user preference) goes through `effectivePreferred()`
everywhere it is read: a method the instance disabled or the account can no
longer use (last passkey deleted) reads as `null`. The sign-in page's `lookup`
returns `methods` + `preferred`; the last signed-in address lives in
`localStorage` (`penombre:sign-in-email`), so the page can auto-run the lookup.

### Two-factor

The `twoFactor` plugin is loaded unconditionally — enrolling and answering a
challenge must work whether or not an admin has made it mandatory. Only
`requireTwoFactor` (app settings) decides who is _forced_ to enrol, enforced by
a redirect in `(app)/+layout.server.ts` that exempts `/account/security` or it
would loop.

Its schema is better-auth's, not ours: the `two_factor` table's column
properties (`secret`, `backupCodes`, `verified`, `failedVerificationCount`,
`lockedUntil`) and `user.twoFactorEnabled` are looked up by name through the
Drizzle adapter, so renaming one breaks enrolment silently.

`twoFactor.enable()` returns a union — pass `method: "totp"` and narrow on it,
or `totpURI`/`backupCodes` are not on the type.

Note `requirePasskey` in app settings is stored but **not enforced anywhere**.

### A passwordless send failure is reported two different wrong ways

The two plugins call their sender differently, and neither reports a throw
usefully on its own:

- `magicLink` does `await options.sendMagicLink(...)` **inline**, so a
  nodemailer rejection became a 500 with an **empty body**. The sign-in page
  fell back to its generic "there was an error" and the admin had nothing to act
  on.
- `emailOTP` runs its send through `runInBackgroundOrAwait`, which swallows the
  failure and still answers `{ success: true }` — a code that was never sent.

`sendSignInEmail()` in `auth/index.ts` wraps both: it logs the real reason and
rethrows as an `APIError`, whose message reaches the client wherever the plugin
awaits. Do not go back to calling `Email.create(...).send()` directly there.

### `Email` must not pass an empty `auth` block

nodemailer sees an `auth` key and tries to log in, so a relay that merely
_advertises_ AUTH rejected the message with `Missing credentials for "PLAIN"` —
which is exactly how an unauthenticated internal relay is reached. The block is
spread in only when a user or password is actually set.

### The sign-in page offers what is on right now

The page reads `instanceSignInMethods()` (`auth/index.ts`), which is live for
every method, so it never shows a button whose endpoint `METHOD_GATES` refuses.
`test.setup.ts` mocks that export, `loadedOAuthProviders` and `refreshAuth`.

### Notifications are structured rows, not sentences

`services/notifications.ts` stores `type` + `actorName` + `resourceName` and the
client renders through paraglide. Storing a finished sentence would freeze it in
the _writer's_ locale, which is the wrong person.

Note the inversion of the activity rule: a notification **may** carry a real
file or folder name, because it is addressed to someone who already has access
to that item — an activity row may not, because admins read those.

`notify()` never throws; it is a side effect of an action that already
succeeded, and a broken mail server must not turn a saved note into a 500.
`SharingService.share()` takes an `onShared` callback rather than a richer
return value, so the boolean contract its five tests rely on stays put, and so
only _newly_ granted recipients are told.

Its `db` is a `private get`, so tests shadow it with `Object.defineProperty`
rather than assigning.

### Passwordless methods are gated on SMTP

Both are gated on SMTP in `getPasswordlessSettings()` rather than only in the
UI, so removing mail afterwards disables them rather than leaving a method that
silently fails.

### Adding a user preference

Four places, all required: `UserPreferencesData` (`schema.pg.ts`),
`defaultPreferences` (`services/preferences.ts`), the Zod schema in
`openapi/v1/preferences.ts`, then `bun run gen:api`.

The PUT handler passes the **already-validated** body straight to
`updateUserPreferences`. It used to re-filter by a hand-written list of three
keys, which silently dropped every new field — saving as `200 OK` and never
persisting. Do not reintroduce that filter; the route's Zod schema is the
validation.

### Storage queries are scoped by volume, not just owner

Never write `eq(files.ownerId, ctx.user.id)` directly. Use `ownedFiles(ctx)` /
`ownedFolders(ctx)` from `services/storage/scope.ts`, which also match the
context's `volumeId`. Paths are only unique _within_ a volume, so an owner-only
query can match a row on the wrong mount. New rows must stamp
`volumeId: this.ctx.volumeId`. The main drive stores `null`. See
`docs/volumes.md`.

### One live row per path, and a listing key is not an identity

`files_live_path_idx` / `folders_live_path_idx` are unique on
`(owner_id, coalesce(volume_id, ''), path)` for live rows. Two scan passes
racing (before the in-flight registry, or two app processes) inserted the same
mounted file twice, and the listing, keyed by `key`, died hydrating on
`each_key_duplicate` inside Svelte's own boundary, which masked the real error.
The scan inserts with `onConflictDoNothing()` (a folder then reads back the
winner's id for its children); what the app creates claims its name first (see
"On disk, a name is claimed"). A restore over a path that came back live is a
unique violation, which `Http.ServerError` answers as 409 (`isUniqueViolation`,
SQLite `SQLITE_CONSTRAINT_UNIQUE` or Postgres `23505`, through Drizzle's
`cause`).

Listings key rows by `metadata.id`, and raw/thumbnail/peaks URLs pass `fileId`
to `getObjectUrl`, which `GET /storage/file/{id}` resolves like `PUT` does.
`key` is the last path segment: a category, starred or search view has no folder
in its URL to rebuild the path from, so every nested file 404'd there.

**drizzle-kit mangles an index expression containing a comma** in the SQLite
dialect (`coalesce("volume_id"`, `'')` became two backticked "columns"). Check
generated SQLite SQL for expression indexes and hand-fix it; the snapshot, not
the SQL, is what the next diff compares. `live-path.test.ts` migrates to the
version before, seeds duplicates, then applies the rest; copy that shape for any
migration that rewrites data.

### The trash is a subtree, and its keys are full paths

Three rules hold together here, and breaking any one of them loses files:

- **Trash state cascades.** `updateFolderMeta` — the route the UI actually uses
  — marks the folder _and_ everything under it, via `setTrashedRecursively`. It
  used to flip the folder row alone, so a trashed folder's files stayed
  untrashed: hidden from the drive (their parent had left the listing) and
  absent from the trash, so nothing could restore or delete them and the trash
  priced itself at the folder's 0 bytes.
- **The trash lists top-level entries only** (`listTrashFiles` drops anything
  under another trashed folder) and gives each folder the size of the trashed
  files beneath it. Otherwise one subtree is listed, priced and deleted many
  times over. Both are SQL now (see "Listings are keyset-paginated"): "top
  level" is a `NOT EXISTS` over trashed folders whose path is a proper prefix,
  tested with `substr(...) = ancestor.path || '/'`, never `LIKE` (a volume
  folder named `a_b` is a wildcard, and SQLite's `LIKE` ignores case).
- **Trash keys are full paths**, unlike a folder listing, whose keys are one
  segment to be re-joined with the folder on screen. The trash is flat and has
  no such context, so a nested row could address nothing: its delete 404'd, or
  worse, `deleteFolder` matched no row and answered 200 having done nothing. It
  now refuses an unknown folder (`FileOrFolderNotFoundError` → 404).

### Never delete a row whose bytes are still there

The library scan re-imports any object with no matching row, so a half-finished
delete does not lose a file — it **resurrects** it, scattered at whatever path
the bytes sit at. `emptyTrash` (`services/storage/trash.ts`) sends every trashed
file's and folder's **absolute** path in one `"delete"` job to the Go worker
(`internal/jobs/deletefiles`), awaits it, and only then removes rows: a file in
the job's `failedFiles` keeps its row (and its ancestor folders', via
`ancestorFolders`), a folder's byte failure (`failedDirs`) is only logged. Bytes
already gone are not a failure — Go treats `os.ErrNotExist` as success, the same
ENOENT rule. The Go side has its own invariant worth knowing: `deletefiles.Run`
removes files before `os.RemoveAll`ing directories, and skips (reports failed)
any directory that still holds a file which failed to delete — reversing that
order would let a directory sweep away bytes TS just decided to keep. A folder's
row is safe to remove regardless of that job's outcome: one in `failedDirs` can
outlive its row, and the next scan re-creates the row only if a file is still
under it, with nothing lost.

**Every folder row has a directory.** `createFolder` and `moveFolder` `mkdir`
it, because the scan (`removeVanishedFolders`) drops any folder row whose
directory is gone. Before that, an empty folder made in the UI of a scanned root
(simple mode, a volume) vanished within a minute.

Emptying is one request for the same reason the bulk actions are pooled
(`MAX_PARALLEL_REQUESTS` in `wrapper-bulk.svelte.ts`): a request per row over a
large selection is where the partial failures came from. The trash pages, so the
client prices the whole of it from the response's `total` and `totalSize`.

### The sidebar counts come from the layout load

`(app)/+layout.server.ts` fetches `/storage/file/counts`, so it must
`depends("app:files")` — a mutation invalidates that key, and without the
dependency the badges keep the numbers they were booted with.

### A dialog is a grid, so its body needs `min-w-0`

`Dialog.Content` is `display: grid`, and a grid item's automatic minimum size is
its min-content width — one long unbroken filename in the body widened the whole
dialog and left it scrolling sideways, `truncate` notwithstanding.
`responsive-dialog.svelte` carries `min-w-0` on the form, fieldset and scroll
body (the header always had it). Anything wide belongs in its own
`overflow-x-auto` box.

### A storage service is built from the owner, never the session user

`locals.storageOwner` is whose drive a request acts on: the signed-in user in
full mode, the shared owner (the first account ever created) in simple mode.
`hooks.server.ts` resolves it once per request; everything that constructs a
`StorageService` or queries storage by user id reads it, never `locals.user`.

That distinction is the whole of simple mode. Every `/api/v1/storage/**`
contract carries its own `service: (user) => new StorageService(user)`, and
`define-route.ts` used to call it with `locals.user` — so the shared drive was
shared with nobody but the first account, while the three routes that happened
to use `locals.storageService` worked. Same trap in the volume page and the
storage-usage page.

`locals.user` stays the session user, and that is what authorship (activity
rows, note authors, share owners) must keep using.

### Uploads run in a worker, off a persisted queue

`#lib/upload/` is three pieces: `queue.ts` (IndexedDB, holds the `File`
handles), `worker.ts` (a module Worker doing the XHRs, four at a time, three
attempts each) and `manager.ts` (main-thread wiring between the two and the
`#lib/store/upload` stores).

The metadata row is created **before** the bytes are sent, so a job persisted in
IndexedDB already knows its destination and can resume without the dialog.
`resumeUploads()` runs from `(app)/+layout.svelte` on mount and treats anything
still marked `pending`/`uploading` as interrupted: recorded as failed first,
then retried. That ordering is the guarantee — the `pagehide` handler that also
marks them is best-effort, since a killed tab may never flush the write.

Two constraints on anything added here:

- `#lib/logger` imports `#lib/server/config`, so it **cannot** be used from this
  module or anything else the client bundles — the SvelteKit guard fails the
  build. Use a toast.
- Rows are keyed by `rowKey` (the path relative to the folder that was on
  screen), stored on the job rather than recomputed, so a resumed upload does
  not depend on where the user has navigated since.

### Listings are keyset-paginated

A category of a big library (a Reaper media folder) used to load every row and
render them all, which hung the tab. Categories, folders (browse, shared drives,
volumes, shared-with-me) and starred now all go through `mixedPage` in
`listings.ts`: SQL pages on `(sortKey, id)` with an opaque cursor
(`mappers.ts`), `id` as the tiebreaker so a tie never skips or repeats a row.
Folders and files are two tables in one order, folders first, so there is no
UNION: folders are read first and files fill what is left of the page. The
cursor names the last row's segment (`k: "folder"`), so the next page resumes in
folders (and falls through to files) or in files only. A folder has no size, so
a size sort lists folders by name.

Names sort on `lower(name)`, with matching expression indexes
(`files_folder_name_idx`, `folders_name_idx`, `files_category_name_idx`). The
cursor stores the raw name and SQL lowers both sides: lowering it in JS would
disagree with SQLite's ASCII-only `lower` and skip rows. Starred rows are few,
so they get only `(owner, is_starred, is_trashed)` indexes.

`total` is a count beside the pages; the trash's is also its badge. Recent does
not page.

The trash pages through the same `mixedPage`, with two extras. Its ancestor
probe and the folder sizes are prefix ranges on `path` (`folders_trash_idx`,
`files_trash_idx` on owner, volume, trash state, path): an ancestor sorts
between the path's first segment and the path, a descendant between `p/` and
`p0`. Postgres builds those indexes on `path collate "C"` and the queries
compare the same way (`bytewise()`): a linguistic collation may skip `/`, which
puts `p/x` after `p0` and prices a folder at nothing. Sizes are computed for the
page's folders only, and a drizzle select field renders a column unqualified, so
the correlated subquery names `"folders"."path"` itself or binds to its own
table. **Empty Trash** still deletes every trashed row server-side; its dialog
counts and prices from `total` and `totalSize`, not from what is loaded.
`listings.pg.test.ts` runs the same queries when `DATABASE_URL` names Postgres.

The server caps a page at `LISTING_MAX_PAGE_SIZE`, so a refresh that must keep a
deep scroll uses `fetchWindow` (`#lib/pagination.ts`), which pages until the
loaded count is covered. The wrapper pages whenever the response carries
`nextCursor`, fetching the next page from whichever endpoint the route is
(`fetchListingPage`), and tells a navigation from a refresh by
`page.url.pathname`; a page that lands after the pathname changed is dropped.
First pages come from `firstPageQuery(preferences)`, so the server's order is
the one the wrapper shows. The server sorts, so `preSorted` tells
list/table/grid not to re-sort a partial window, and a sort change re-fetches
page one.

Rendering is bounded separately and everywhere: `#lib/virtual-window.svelte.ts`
mounts only the rows near the viewport (fixed row height plus spacers, the
sheet-editor trick, but driven by the window's scroll because listings scroll
with the page). The grid's column count mirrors its `grid-cols-*` breakpoints in
JS; change one and change the other. The row height is set on each row or tile
in CSS, not just assumed: an estimate that drifts by a few pixels is thousands
off at 20k rows. `listingLoadMode` picks infinite scroll or page controls.
"Select all" selects what is loaded, and says so.

`service.listFiles` still returns a whole folder: the public share page and the
old tests use it. Listing routes call `listFolderPage`.

### Waveforms are data, not pictures

Audio "thumbnails" return **JSON peak data**, not an image: the endpoint answers
`application/json` for audio and caches `<key>_peaks.json`. `waveform.svelte`
draws inline `<svg fill="currentColor">` from it.

The peaks themselves are computed by the Go worker (`internal/jobs/thumbnail`):
ffmpeg decodes to raw PCM, and `BucketPeaks` (a 1:1 port of the old TS
`bucketPeaks`) buckets it into ≤400 values in `0..1`. `ThumbnailService` only
enqueues the job and serves the cache file the worker wrote.

The reason is themeability. `showwavespic` bakes a colour into a bitmap, so a
waveform generated under one accent kept that colour forever, and an `<img>` is
isolated from page CSS so it could never inherit one either. Only inline SVG
re-colours when the accent changes.

For the same reason, anything representing a Penombre object — folder icons
above all — uses `text-primary`, never a fixed palette colour. Fixed colours are
fine for the _context-menu_ action icons, which are a deliberate multi-colour
set rather than object identity, and for the three editable document kinds (blue
/ green / orange, from `DOCUMENT_KINDS[kind].color`), which identify a kind
rather than an object.

### Thumbnails

The API takes **named** sizes (`small` | `medium` | `large`), not pixels — three
discrete values keep the on-disk cache bounded. `getObjectUrl` once sent
`size=300` and every thumbnail request 400'd.

Its ETag is the cache file's `stat` (mtime + size), compared before the render
is read or opened, so a revalidation (`private, no-cache`) is a 304 without a
decrypt. An ETag built from `Date.now()` never matched and every tile refetched.

A thumbnail request must **never** fall back to serving the original file. It
did, so a grid of audio tiles pulled ~100 MB per WAV. It now 404s and the client
renders its own icon.

Generation is warmed at write time (`ThumbnailService.warm`) from upload and
scan, not lazily on first view — it enqueues a `"thumbnail"` job and does not
await it; an interactive view (`getThumbnail`) awaits the same job type with a
higher priority. The rendering itself — `ffmpeg` for video frames/audio
waveforms, `pdftoppm` for PDFs — runs in the Go worker
(`internal/jobs/thumbnail`), not in the app process; `sharp` is gone. Both
binaries are installed in the Dockerfile's `app` stage, and the image build
fails if ffmpeg's build lacks the `libwebp` encoder.

### The waveform is also the scrubber

`waveform.svelte` takes an optional `progress` (0–1) and `onseek`. With
`progress` it draws the bars twice — muted underneath, `--primary` on top,
clipped to the playhead — because one pass would mean rebuilding every rect per
frame. The clipPath id is per-instance (`crypto.randomUUID()`): two waveforms
sharing one id means the second one's playhead drives the first.

The `<audio>` element lives in `music-player.svelte`, so anything else that
needs to seek or pause it (the notes panel) goes through `commandPlayback()` in
`#lib/store/music`. Commands carry an incrementing `id` so two identical seeks
in a row both fire.

Timestamped notes are drawn on it as markers. The note list therefore lives in
`#lib/store/notes.ts`, not in `notes-panel.svelte`: the players mark the
waveform while that panel is unmounted, and the panel writes back to the same
store so a note appears on the waveform the moment it is saved. The tooltip is
the portalled `Tooltip` — the bottom player wraps its content in
`overflow-x-auto`, which clips anything drawn in place.

`music-player.svelte` also renders the thread itself, under the transport row,
because a track playing while you browse is exactly when you have something to
say about it and the file listing may be three pages away.

### A tooltip is a popover surface, not a primary one

`app.css` forces `--popover` onto `[data-slot="tooltip-content"]` along with
every other floating surface, but shadcn's tooltip ships
`bg-primary text-primary-foreground` — so every tooltip in the app was white
text on a white surface, and hovering appeared to do nothing at all.
`tooltip-content.svelte` uses the popover tokens now (arrow included). Anything
added to that unlayered block in `app.css` has to have its foreground checked
the same way.

A click on it is a **seek and nothing else** unless the notes thread is already
open. Pausing and taking the caret is the note-taking gesture; firing it unasked
meant a click meant to skip forward stopped the track and threw a panel over it.
The preview dialog follows the same rule — the thread is opt-in there, and only
right-click → **Notes** opens the dialog with it showing.

### Never write a store you read inside an effect

`music-player.svelte`'s command effect read `$playableMusic` and then set
`$playableMusic.isPlaying = false`. A `writable` holding an object notifies on
every `set` (`safe_not_equal` never considers two objects equal), so the effect
retriggered itself: `effect_update_depth_exceeded`, and the tab hung the moment
anyone scrubbed from the notes panel. The shape that is safe is the one there
now — track only the command, `untrack()` the rest, and write through
`store.update()` rather than `$store.field = x`.

The same file's _event handlers_ mutate freely; that is fine, they are not
effects. `setPlaying()` exists so the unsafe spelling is nowhere in the file to
be copied back into one.

An effect guarded on a `bind:this` element needs that element in `$state`. The
player's `<audio>` only exists while a track is open, so a tuning effect that
returned early on a plain `let player` tracked nothing and never ran again:
speed and pitch selects that changed their label and nothing else. And a dialog
effect that wrote `items` then read it back to build a name crashed the page the
moment it opened; derive what can be derived.

A bits-ui trigger's `child` snippet `props` replace a `class` set before the
spread, so a `lg:hidden` there never applies; wrap the trigger instead.

Commands are also one object, not one action per call: two `commandPlayback()`
calls in a tick collapse to the last write before the effect runs, so "seek then
pause" as two commands silently dropped the seek.

### `crypto.randomUUID` needs a secure context

It is `undefined` over plain HTTP at anything but `localhost` — which is how a
self-hosted instance is reached before TLS. Calling it threw at component init
and no waveform rendered anywhere. Use `$props.id()` for a DOM id (and note it
must be the direct initializer of a `const`, not interpolated inline), and
`randomId()` from `#lib/utils` for anything else.

### The media viewer is outside `(app)`

`/view/[fileId]` is where "Open full screen" lands for an image, video or track
— `fullscreenUrl()` in `components/file/file-links.ts` decides. It is a
top-level route on purpose: the sidebar, header and bottom bar are exactly what
a full-screen viewer must not have. Everything else still opens the raw file,
which the browser handles better than we would.

Nothing opens in a new tab any more: `handleOpenItemFullscreen()` is a `goto()`,
so the back button returns to the folder.

The playhead crosses with it, in both directions and by two different means.
Going in, `withResume()` puts `?t=&playing=1` on the link and the viewer applies
them on `loadedmetadata` — the URL rather than a store, so a reload or a pasted
link resumes too. Coming back, `beforeNavigate` in the viewer writes `startAt`
onto `playableMusic`, which the player applies on its next `canplay` and clears.
Both are needed: the two players are different elements in different layouts,
and each starts a fresh load at zero.

The viewer's **Minimize** is the reverse trip, and it goes somewhere different
per kind. A track is written whole — source, peaks, `startAt`, play state — into
`playableMusic`, because the file may never have been in the bottom player at
all (the viewer opens straight from the context menu). A video has no small
player of its own: the preview dialog is it, and only `wrapper.svelte` owns one,
so the viewer leaves a `pendingPreview` request (`preview-handover.ts`) and the
browse page picks it up on its next render.

**`playableMusic.source` must be absolute.** The player compares it against
`player.src`, which the DOM always resolves, so a relative source never matches
— and since every write to the store re-runs that effect, the track reloaded on
each one: audible stutter, playback dropping, a flickering play button. The
player resolves the source now, and writers use `rawUrl()`/`getObjectUrl()`,
which already do.

Browser full screen is separate and additional — `toggleFullscreen()` in
`#lib/utils`, given the element wrapping the video _and its controls_, or the
custom controls vanish with it. iOS Safari implements none of the API outside
`<video>` and only under `webkitEnterFullscreen`, which is why the helper takes
the video as a second argument.

### Mobile has no sidebar

`Sidebar.Trigger` is `hidden md:flex`, so the sidebar's mobile Sheet is
unreachable. The whole navigation lives in the bottom bar's drawer in
`(app)/+layout.svelte`, built from the same `nav` groups the desktop sidebar
uses, with a **New** button on top that opens the create/upload actions in a
nested drawer. Adding a nav entry therefore reaches both automatically —
_except_ that `hideOnMobile` is a desktop-sidebar hint only (those rows are
duplicated in the bottom bar); the drawer shows everything.

The bar is Home, Recent and Starred (both full mode only), Menu — Menu last, not
a raised circle in the middle, and Settings reached through the drawer rather
than duplicated in the bar. Simple mode drops so many entries that a floating
centre button sat between only two links. Upload progress shows on the Menu
item, the one thing in the bar that is not a link.

It is opaque, not frosted: the bar sits over a grid of thumbnails, and blurring
whatever happened to be beneath it read as a smear rather than a surface. It
also hides on scroll down and returns on scroll up, from `<svelte:window>` —
nothing between the header and the bar scrolls, so `window.scrollY` is the
page's position. The 8px threshold is not cosmetic: momentum scrolling reverses
by a pixel constantly and the bar flickered on every reversal.

The header carries the logo below `md`. The sidebar is what brands the app, and
it is not rendered on a phone.

The account is the header's avatar dropdown at every width, not a bar tab. Admin
still lives in the `help` nav group rather than in that dropdown.

### Passkeys: no conditional mediation

`useAutoRegister: true` / `autoFill: true` ask the browser for _conditional_
WebAuthn, which is the silent password-upgrade and autofill flow. Neither shows
a prompt when a button is clicked, so both the register and the sign-in buttons
did nothing at all. Both are now the plain modal ceremony.

`passkey({ registration: { requireSession: false } })` is not a loosening of who
may register: without a session the plugin still refuses (no `resolveUser` is
configured) and the challenge is bound to the user who requested it. What it
drops is better-auth's `freshSessionMiddleware`, which 403s a session older than
24h — on a drive people stay signed into for weeks that rejected everyone.

### The library scan needs an owner

`services/library-scan.ts` (not `hooks.server.ts` any more, so the setup action
can reach it) scans as the shared owner — the first account ever created. A
fresh instance has none until setup runs, so the boot scan finds nothing. The
setup action calls `requestLibraryScan()`, and a short poller (`awaitOwner`) is
the fallback for any other path that creates the first account. Without those, a
new simple-mode install showed an empty drive for up to a minute with every file
already on the volume.

### `.ts` is TypeScript, not a transport stream

`file-types.json` filed `ts` under `VIDEO` (MPEG-TS), so a source file opened in
the video player while the client's own `determineCodeFileLanguage` already
called it TypeScript. It is `CODE` now, along with `mts`/`cts`/`mjs`/`cjs`.
Anything added to that map has to agree with `#lib/file-utils`, because
`handleOpenItem` branches on the server's category and the preview then picks a
language from the extension.

### i18n keys

Every key must exist in **every** locale listed in
`project.inlang/settings.json` (thirteen: en, fr, de, es, it, nl, sv, fi, pl,
ru, ja, ko, zh), so a new key ships with a real translation in each; the
language picker lists whatever that file declares. Paraglide itself never
complains: a key missing from a locale silently falls back to `en`, and
`bun run check` passes. The `i18n` prek hook (`scripts/check-i18n.ts`, on
`messages/`) is what fails on a missing or extra key, or on a message whose
placeholders differ from `en`'s.

Counts use paraglide's real plural-variant messages (`@inlang/paraglide-js`
^2.25, plugin-message-format's JSON schema), not flat `_one`/`_other` keys.
CLAUDE.md once said plurals did not work here; nobody had checked the installed
version. A pluralized message is a one-element array:
`declarations: ["input count", "local countPlural = count: plural"]`,
`selectors: ["countPlural"]`,
`match: {"countPlural=one": "...", "countPlural=other": "..."}`. `countPlural`'s
value comes from `new Intl.PluralRules(locale, options).select(Number(count))`
(paraglide's `plural()` in the compiled `registry.js`), so write a `match` arm
for every category that locale's `Intl.PluralRules` can produce for an
**integer** input: `one`/`other` for most locales, `one`/`few`/`many`/`other`
for ru and pl (`2`→few, `5`→many, `21`→one again: real CLDR paucal rules, not
approximated), and just `one`/`other` for fr (fr's `many` category exists in
CLDR but only fires for non-integers, which count messages never are). A locale
that only ever produces `other` (ja, ko, zh) or where every category renders
identical text needs no array at all; a plain string works, since paraglide
falls back to that locale's own text regardless of which category was selected.
Different locales for the same key can use different shapes (array vs plain
string); the compiler handles each locale's message independently.

Call sites pass `{count: String(n), ...}` same as before; paraglide picks the
branch. The old `filesCountLabel`/`usersCountLabel`/`downloadsCountLabel`/
`trashHoldsLabel` wrappers in `utils.ts` that branched on `count === 1` are
gone, so call `m.<key>({count: String(n), ...})` directly.

### Test isolation

`mock.module` in Bun is **global and permanent** — a module mock in one test
file leaks into every file that runs after it. Two consequences:

- Every local `#lib/server/config` mock must return the _same_ shape, or a suite
  that runs later reads a config missing the fields it needs.
- A suite that calls `mockReturnValue` (not `...Once`) on a shared mock must
  restore it in `afterAll`, or it reconfigures everything downstream.

Prefer stubbing a method on the instance under test over mocking a module.

Module-level state bites the same way without mocking. `jobs.ts` remembers, per
process, that a worker was seen after boot, which ends the boot grace for every
later test. A test that needs a job to be waited on seeds a live worker row
itself (`workerSeen()` in `jobs.test.ts`) or passes its own `bootedAt` to
`awaitJob`; leaning on the default grace failed only under `rerunEach`.

### Go tests live under `tests/`, split unit vs integration

Every `*_test.go` for `cmd/` and `internal/` lives under
`tests/unit/go/<same path>` or `tests/integration/go/<same path>` — never beside
the source. Unit needs neither a database nor an external binary (a temp dir is
fine); integration is anything that opens SQLite/Postgres or execs
`ffmpeg`/`ffprobe`/`pdftoppm` (a file mixing both gets split in two). Tests are
external packages (`package worker_test`, importing
`github.com/orochibraru/penombre/internal/worker`), so they can't reach
unexported identifiers — `internal/worker`'s job types (`Spec`, `Result`, …) are
exported for this reason, and `Config.ShutdownGrace` exists so a shutdown test
can shorten the grace period without calling an unexported `runWithGrace`. A
test needing the raw DB (seeding rows, reading internal state) opens a second
`*sql.DB` on the same SQLite file rather than reaching into `Store`'s private
field. No `export_test.go` shims in `internal/`.

### Card layout conventions

Cards carry their heading through `Card.Header` + `Card.Title` +
`Card.Description`, with any top-right button in `Card.Action` — never a
hand-rolled `<h2>` inside `Card.Content`. The account pages drifted into the
latter and the headings came out a different size from every other page.

Page-level card grids must **not** carry `items-start`: it defeats the grid's
default stretch, so cards in a row end at different heights and the column
bottoms come out ragged. Let them stretch.

### Activity is one component

`#lib/components/activity-log.svelte` renders both the account and admin
activity views — mono log lines, not cards or a table — differing only by
`showUser`. `ActivityService.audit()` must keep selecting `message`, which the
admin table used to omit entirely. File and folder names are never written into
these rows, which is what makes the message safe to show an admin.

### A folder path is a chain of segments, and a file key is not an id

`folders.path` is the folder's own disk segment appended to its parent's path:
`uuid/uuid/uuid` on a personal drive in full mode, real names elsewhere (see "On
disk, a name is claimed"). The browse URL is that same chain
(`page.params.path`). Taking `.split("/").pop()` of it gives a segment that
matches no row: `getFolderIdByPath` returns null while the caller still prefixes
the file's path with it, producing a row filed in the root that claims to live
in a folder and is unreachable by its own key. `resolveDestination()` in
`services/storage/files.ts` now refuses an unresolvable folder outright (400),
so a create either lands where it says or fails.

A folder's id is its path only on a personal drive at the root.
`POST /api/v1/storage/folder` returns `path`; address the new folder by that.
The folder-upload dialog and four E2E specs joined ids into paths, which broke
on every drive and volume the day those got real names.

`fileDbToObjectItem` sets `key` to the **last path segment** only, so an item
from a listing cannot address its own file unless the caller re-attaches the
folder (`query.folder`), which is why every mutation in `wrapper.svelte.ts`
carries `currentFolder`. Views that list across folders (starred, recent,
search, the editor) have no such folder, so `PUT /api/v1/storage/file/{id}`
falls back to `findFileById` when the path misses. Prefer passing `metadata.id`.

### On disk, a name is claimed

Where the tree is browsed outside Penombre (`ctx.namedPaths`: simple mode, any
volume or shared drive), a new or moved file or folder is named after itself on
disk, not `<uuid>.<ext>` — a Syncthing peer saw a folder of UUIDs. `diskName()`
(`lookups.ts`) picks the name and **claims it** before returning: an exclusive
create (`open` with `wx`, or a non-recursive `mkdir`), after checking rows
case-insensitively (a macOS peer cannot hold `a` beside `A`), trashed ones
included since they keep their bytes. The claim is not optional: a transfer
inserts its row only after the worker copied the bytes, so two copies of `a.wav`
racing into one folder both found it free, and the loser's `reconcileCopy`
deleted the winner's bytes. Every writer renames over the empty placeholder.
`safeSegment` turns a leading dot into `_`: a user folder named `.versions`
would otherwise be the app's own, and a dot-name is invisible to the scan.

A rename in the UI renames on disk too (`renameOnDisk` in `uuid-names.ts`, from
`updateFile` and `updateFolderMeta`), then updates the row **by id**: its path
just moved. `diskName` treats a case-only change as the item's own path, or
`Take.wav` would come out `Take (1).wav`. Because Penombre now moves bytes the
scan's listing never saw, the scan re-checks the disk before deleting a vanished
row (`bytesGone`) and before following a rename: a listing minutes old on a big
mount would otherwise drop a freshly renamed file with its versions.

Rows made before this keep UUID names on disk until the scan renames them
(`nameUuidPaths`, at the start of every pass of a named tree): inside the pass,
so the scan never sees a renamed path with no row, which it would import twice
while dropping the old row and its notes. A rename is a filesystem `rename`,
never copy+delete, and a failure puts the bytes back or removes the claim.
Shared drives are not scanned, so theirs stay UUIDs.

### Documents are ordinary files

`#lib/documents.ts` owns the three editable kinds and their formats: HTML for a
document, CSV for a sheet, Markdown (`---` separated) for a deck. **No private
format** — creating and saving go through the existing `createFile` +
`uploadFile` endpoints, so a document is a file like any other and inherits
trash, sharing, search and thumbnails for free. Adding a kind means adding it to
`DOCUMENT_KINDS`, `kindForName` and the editor route's branch.

`handleOpenItem` routes an editable file to `/edit/[fileId]` before anything
else, so extensions handled there never reach the preview dialog.

### Office files are edited in place, not imported

`#lib/server/office` opens a `.docx`/`.xlsx`/`.pptx`, converts the one part that
holds text into HTML/CSV/Markdown for the existing editors, and on save splices
the edit back into the **original archive**. Nothing is converted on disk and
there is no export step.

The whole design rests on one property: both directions derive their maps
(images, numbering, styles) from the package alone, so the map built when the
file is opened and the one built when it is saved agree with **no state carried
between the two requests**. Do not introduce a cache or a session value here —
the moment the two sides disagree, images and list numbering are silently
dropped.

Consequences worth knowing before touching it:

- `zip.ts` is a real ZIP reader/writer (`node:zlib` has `crc32`, so no
  dependency). Entry **order is preserved** — a `.docx` whose first entry is not
  `[Content_Types].xml` is refused by older Word.
- `xml.ts` only re-serialises the parts we actually change, which is why the
  prolog, comments and CDATA survive as `raw` nodes. `XmlElement.attrs` is
  `Record<string, string | undefined>` deliberately: with
  `Record<string, string>` the linter flags every `?? ""` as unnecessary while
  the value really is undefined at runtime.
- Writing is **surgical**, not regenerative. A spreadsheet cell whose text did
  not change keeps its original XML node, so its formula, style and
  shared-string reference are untouched; only changed cells are rewritten, and
  as `t="inlineStr"` so `sharedStrings.xml` and its counts are never edited.
- Saving does **not** go through the upload endpoint.
  `POST /api/v1/storage/file/{id}/office` takes the text and re-reads the
  original bytes server-side, so the browser never assembles a `.docx`.

Three traps that cost real time:

- **A Word list is not always on the paragraph.** python-docx (and Word's own
  `List Bullet`) put `w:numPr` on the _style_, not on the `w:p` — reading only
  the paragraph turned every bullet into a plain paragraph. `styleNumbering()`
  resolves both.
- **ProseKit serialises an image as a sibling of the paragraphs**, not inside
  one, and lists as `div.prosemirror-flat-list[data-list-kind]` rather than
  `ul`/`li`. Treating a top-level `<img>` as an unknown block wrapped _its
  children_ in a paragraph — an `<img>` has none, so every picture in a document
  was dropped on the first save. `INLINE` in `docx-write.ts` exists for that.
- **A pptx content placeholder usually has no `type`.** It is written
  `<p:ph idx="1"/>`, so `placeholderType()` returns undefined for it; use
  `isPlaceholder()`. Getting this wrong made every slide added by cloning lose
  its body placeholder and grow a stray text box.

`kindForName` stays "is this one of ours" — the listing icon and the kind colour
hang off it, and an Office file must keep its Word/Excel/PowerPoint icon.
`editorKindForName` is the "does this open in an editor" question.

### A cell per row is a page that never loads

`sheet-editor.svelte` renders only the rows in view. A 20k-row CSV — an ordinary
export — is 200k `<input>` elements: SSR alone emitted **58 MB** of HTML and the
tab died before first paint. Two things hold it together:

- Row height is fixed (`ROW_HEIGHT`) so the real scrollbar can measure the whole
  sheet, and the rows that are not rendered are stood in for by two spacer rows.
  Each spacer **must carry a `td` with a `colspan`**: a `<tr>` with no cell in
  it is laid out at zero height however tall it is told to be, so without one
  the container simply does not scroll.
- `columnCount` is a `reduce`, never `Math.max(1, ...rows.map(…))` — that many
  spread arguments is a `RangeError` in V8 (it survives in Bun, so a unit test
  will not catch it).

Its sticky header is `bg-surface-base`, not `bg-muted`. **Every panel token in
this theme carries alpha** so the aurora washes through — `--background`,
`--card` and `--muted` are all translucent, and `--muted` is only 10% — so a
header that has to hide thousands of scrolling rows cannot be built from them.
`--surface-base` is the opaque one, and it is what the auth card and the
floating surfaces already composite against.

### A cached thumbnail must appear whole or not at all

The staging-then-`os.Rename` that guarantees this now lives in Go
(`internal/jobs/thumbnail`): the executor always writes to
`<output>.<jobID>.tmp` beside the destination and renames it in on success, so
`existsSync(thumbPath)` (the cache check in `ThumbnailService.plan`/
`generateThumbnail`) never observes a partially-written file — a rename is
atomic, so the path is either absent or complete.

The concurrent-caller race this used to guard against — two requests for the
same missing thumbnail both starting a render — is now closed by the job queue's
`dedupeKey` (set to the output path): both callers' `enqueueJob` calls resolve
to the **same** job id while one is `queued`/`running` — enforced by a partial
unique index, not a check — so they converge on one render instead of two.

This was also the E2E flake that failed a release: `waveform.spec.ts` uploads a
file and clicks it, which used to race the old in-process write every time.

### A flaky test is a failed test in CI

`failOnFlakyTests` is on whenever `CI` is set, in `playwright.config.ts` (the
Postgres config spreads it). Retries stay — a flake should be _reported_ as one
rather than just red — but the run fails.

Without it, a test that passes on retry is green, and the PR merges; the same
non-determinism then lands on `main`, where the release pipeline runs the very
same suite and rolls the dice again. That is precisely how a release broke on a
change its own PR had approved. There is no other asymmetry to look for: both
pipelines call `e2e.yaml` with the same inputs, and the `main` ruleset already
sets `strict_required_status_checks_policy`, so a PR cannot merge stale.

So a flake is now a bug to fix where it appears, not noise to re-run.
`chooseMenuItem` in `e2e/helpers.ts` takes a `confirm` callback for this reason:
a dispatched click reports success as soon as it is sent, but a menu being torn
down by a settling listing never runs its handler, so "the click worked" and
"the thing happened" are different questions.

### E2E has a five-minute budget

Each E2E job has `timeout-minutes: 5`, deliberately tight: the app is fast, so a
slow suite is a bug. The suite is split `--shard=N/4` per dialect, each shard on
its own fresh stack. A spec that pushes a shard over budget gets faster or
moves, the budget does not grow. The same split works locally:
`bun run test:e2e --shard=1/4` (the script passes its arguments through).

A container left from an earlier run keeps its drive, and `up --build` does not
reset its volumes: after a few local runs `test-audio.wav` is
`test-audio (10).wav` and specs fail on each other's leftovers. Reset with
`docker compose -f compose.e2e.yaml -p penombre-e2e down -v` before trusting a
local failure.

`workers: 1` is not a choice about speed: every spec shares one instance and one
drive, so several upload the same fixture names and only the shard split keeps
them apart. Run the whole suite in one shard and specs fail on each other's
leftovers (`test-upload.txt` becomes `test-upload (1).txt`). Until each spec
owns its own user or folder, sharding is the only lever, and parallel workers
would be a flake machine.

Browsers are cached per Playwright version (`actions/cache` on
`~/.cache/ms-playwright`), which is 30s a job over 8 jobs; a cache hit still
runs `playwright install-deps`, since the system libraries are not in it.

A broken build is the other way to blow it: every test times out three times,
and 103 × 3 × 30s kept a job red for 2.5h. CI stops at `maxFailures: 10`.
Playwright already runs on Bun (`[run] bun = true` in `bunfig.toml`); there is
nothing to switch on.

### A type-only import can still look circular

`bun run circular` (`scripts/circular.ts`, madge) reported a cycle between
`storage/driver.ts` and `storage/drivers/local.ts` that wasn't one: `local.ts`
only imports `StorageDriver` as `import type`, but madge's TypeScript detective
counts a type-only import as a real edge unless told otherwise
(`detectiveOptions: { ts: { skipTypeImports: true } }`). madge also has no
`.svelte` support at all (no svelte detective in `precinct`), so the check only
ever covers `src/**/*.ts`.

### SvelteKit's own warnings bypass Vite's `customLogger`

The "plugins ... use the `transformIndexHtml` hook which is not supported"
warning (vite-plugin-pwa, printed by every `svelte-kit sync`) comes from
SvelteKit's own internal `logger()` util (`@sveltejs/kit/src/core/utils.js`),
which calls `console.log` directly; setting Vite's `customLogger` in
`vite.config.ts` does nothing for it. Silencing just that one message means
patching `console.log` in `vite.config.ts` itself (scoped to the exact
substring); the plugin is still live (see the webmanifest link tag in
`+layout.svelte`), only the noise is gone.

### Actions are pinned by SHA, by pinact

Every `uses:` is a commit SHA plus a `# vX.Y.Z` comment, enforced by the
`pinact` prek hook. It is `language: golang`, so prek `go install`s it; nothing
to install locally or in CI. `pinact run --update` bumps everything (export
`GITHUB_TOKEN=$(gh auth token)` or the API rate limit bites). Write a new action
as `owner/repo@vX` and let the hook pin it.

### Workflows pass `zizmor`

The `zizmor` prek hook audits `.github/workflows`. Three rules follow from it:

- **No `${{ }}` inside `run:`.** Put the expression in the step's `env:` and
  read `$VAR`; use `$RUNNER_TEMP`, `$GITHUB_REPOSITORY`, `$GITHUB_SHA` rather
  than their expressions.
- **Checkouts set `persist-credentials: false`.** The release checkout is the
  exception: releaser pushes over the deploy key it persists, so it carries an
  inline `# zizmor: ignore[artipacked]`.
- **Permissions are per job, and no `secrets: inherit`.** A called workflow gets
  only the secrets it names.

`self-repository` is off (`.github/zizmor.yml`): actionlint does not parse
`uses: $/...` yet.

### `bun install` on checkout

`.pre-commit-config.yaml` has a `post-checkout` hook, installed by `prepare`
(`post-checkout` is in `default_install_hook_types`). `node_modules` is not part
of a checkout, so without it the first command after a branch switch runs
against the previous branch's dependencies.

### Hooks live in `.git/hooks`, never in the tree

prek comes from `node_modules` (`@j178/prek`), and the hook scripts it writes
bake in that binary's **absolute** path, so they are per machine and must never
be tracked. They used to sit in `.husky/_` via `core.hooksPath`; every
`prek install` rewrote tracked files, which made a plain `bun install` in the
post-checkout hook abort the checkout. `prepare` unsets `core.hooksPath` so old
clones move over on their next `bun install`. CI pins `prek-action` to the
version in `node_modules` so both run the same prek.

### CI builds the image once

`docker.yaml` pushes by digest only; `e2e.yaml` pulls that digest instead of
rebuilding; `docker-manifest.yaml` creates the tag afterwards. So a tag only
ever names an image that passed e2e, and a PR costs two builds (one per
platform) rather than four. `pr-cleanup.yaml` deletes `pr-<n>` when the PR
closes.

Forks get no secrets, so nothing is pushed: `pulled: false` makes e2e build
locally and the publish job is skipped.

A merge to `main` does not rebuild either. `docker.yaml` labels every image with
its source tree (`dev.penombre.tree`); `publish.yaml`'s `tested` job finds the
merged PR's `pr-<n>`, and when the tree matches `promote` re-tags it with a
one-line `FROM` + `ENV PENOMBRE_RELEASE_VERSION` build, since the image was
built before the version was picked and `config.ts` reads that override. A
mismatch (direct push, stale PR run) takes the full path. The PR image of a
merged PR is deleted by `publish.yaml`, not `pr-cleanup.yaml`, which would race
the promotion.

### Every merge is a canary; merging the release PR is the release

[releaser](https://github.com/orochibraru/releaser) (`publish.yaml`) tags each
push to `main` `vX.Y.Z-canary.N`, publishes the image as that and `:canary`, and
keeps a `chore(release): X.Y.Z` PR open on `releaser/release`. Merging it
re-tags that version's last canary as `:X.Y.Z` and `:latest` (`stable-images`),
after refusing if the tree differs from the canary's beyond docs and the
version. `latest` is never built, only promoted.

- **Every commit type bumps** (`RELEASE_RULES`, `breaking` stays major). A push
  with nothing release-worthy makes no canary but still rebuilds the release PR,
  which would then carry code no image was built from, and the release would
  refuse.
- **The release branch is pushed over a deploy key** (`RELEASE_DEPLOY_KEY`).
  Anything `github.token` pushes triggers no workflow, so the PR never got its
  `CI Gate`. That is also why `pull_request.yaml` runs on pushes to
  `releaser/release`: the first push lands before the PR exists.
- **The release PR builds nothing.** `pull_request.yaml`'s `changes` job fails
  it if it touches more than `CHANGELOG.md` and the version.
- `version` dry-runs releaser for the tag the images get; `release` fails if the
  real run disagrees. The `publish` concurrency group is what keeps them equal.
- Old canary GitHub releases are pruned; their tags are not, releaser numbers
  from them.

### TypeScript is held at 6 on purpose

`svelte-check` refuses TypeScript 7 outright — it wants _both_ TS 6 and TS 7
installed plus a `--tsgo` flag, and dies before checking a single file. A
`renovate.json` rule caps `typescript` at `<7` so the bump stops being
reproposed. Lift it when svelte-check ships tsgo support, not before.

`nodemailer` 10 cut `Transporter`'s second type argument (the options type); it
takes only `SentMessageInfo` now.

### Vale runs the built-in style only

`docs/` and `README.md` go through Vale's own `Vale` style: spelling and
repeated words. Google and write-good were tried and dropped: they flag the
house style itself (em dashes, British spelling, no Oxford comma, passive) on
nearly every line. No package means no `vale sync` and no network in the hook;
prek builds Vale from its repo (`language: golang`), so nothing to install.

A real word Vale does not know goes in
`.vale/styles/config/vocabularies/Penombre/accept.txt`. Entries are
case-sensitive regexes that also reject other casings (`Vale.Terms`), so write
`[Nn]ginx` when both appear. The dictionary lacks possessives of words it
otherwise knows (`admin's`), hence the `(?i)…'s` line. Keep regexes free of
fragments `typos` reads as misspellings: spell alternatives out whole.

### agnix needs its binary fetched

`agnix` (a prek hook on Markdown and `.claude/`) is a wrapper that downloads a
native binary in its postinstall. Bun skips install scripts for packages not in
`trustedDependencies`, where it is now; CI installs with `--ignore-scripts`, so
`code_quality.yaml` runs `bun node_modules/agnix/install.js` before prek.
`.agnix.toml` disables four rules that score CLAUDE.md as a short prompt
(length, keyword placement, every "never"); each is commented there.
`bun pm trust` rewrote `package.json` with spaces: run Biome over it after.

### Type checks run on push, not commit

`bun run check` and `bun test` are `pre-push` hooks, so a commit stays fast.
CI's prek step runs only the pre-commit stage, which is why `code_quality.yaml`
runs `bun run check` and the "Codegen is current" step itself.

### Never cache a missing shared owner

`loadSharedOwner()` memoises, but only a hit. A fresh instance has no account
until setup runs, so the boot scan finds none — caching that `undefined` pinned
it for the process's life and simple mode never scanned again, even after the
admin was created. Restarting the container "fixed" it, which is what made it
look like a scanner bug rather than a cache one.

### No seeded admin

There are no `ADMIN_EMAIL`/`ADMIN_PASSWORD` variables. An empty database means
`needsSetup()` is true and `generalHandler` funnels every path to `/auth/setup`,
which creates the first administrator and then refuses forever after. Auth
bypass is the exception: nobody signs in, so `seedAuth` creates one
credential-less owner to attribute files to. The e2e auth setup runs the
onboarding flow when it lands on that screen.

### Self-deletion and admin removal are two different code paths

Better-auth's own `/delete-user` endpoint (`user.deleteUser` in `auth/index.ts`,
`beforeDelete: assertCanDeleteAccount`) is what the account page's self-service
**Delete account** calls; it password-or-freshness-checks the caller and is
where the "last admin" and "owns a shared drive" refusals live. The admin
plugin's own `removeUser` (Admin → Users → Delete) is a **separate** endpoint
that never runs that hook. It can't be used to strand the instance anyway, since
it already refuses removing yourself, so there is no missing check, just two
independent gates worth knowing about before "fixing" one by editing the other.

### Every E2E spec must declare its own auth

The `chromium` project in `playwright.config.ts` sets **no** `storageState` —
each spec file opts in with `test.use({ storageState: AUTH_STORAGE_STATE })`. A
file that forgets it runs signed out, and every test in it fails by landing on
the sign-in page, which reads like a broken session rather than a missing line.
The `setup` project still runs (its job is writing that file), so the failure
looks unrelated to authentication.

### ProseKit: core only, and browser only

`document-editor.svelte` uses `prosekit/core` + `prosekit/basic` and nothing
from `prosekit/svelte`. That is deliberate, and reverting it reintroduces two
separate failures:

- The `<ProseKit>` component sets the editor context **inside itself**, so any
  `use*` hook called in the parent scope throws `EditorNotFoundError` at runtime
  — after mounting, so the editor looks fine until the first edit.
  `defineDocChangeHandler` as an extension needs no context.
- `@prosekit/svelte` ships uncompiled `.svelte` sources, which Vite externalises
  for SSR and hands to Node as JavaScript; the parse error names the library's
  own file. Avoiding the package avoids needing `ssr.noExternal`.

The `{#if browser}` guard in the edit route stays regardless: `createEditor`
parses its initial HTML with `DOMParser` at construction, so it throws "Unable
to find browser Document" during SSR.

None of this appears in the Docker E2E run, which serves a production build —
check `bun run dev` explicitly when adding a DOM-dependent library, and assert
on `pageerror` in the E2E (see `documents.spec.ts`), because a mounted,
`contenteditable`, correctly-rendered editor can still throw on every keystroke.

### Nothing may be pinned to the bottom-right corner

The music player spans that corner, so the upload progress panel sitting at
`fixed bottom-4 right-4 z-50` covered the player's own notes, full-screen and
volume buttons — every click on them went to the panel for as long as an upload
was listed. It stacks above the player from `--player-height` now, the way
`selection-bar.svelte` already did. Any new floating panel down there has to do
the same. The selection bar is centred at that same offset and wide enough to
reach under the panel, so it publishes `--selection-height` and the panel stacks
on that too — widening the panel once hid the bar's **Clear**.

The symptom in E2E is a click that retries until the test times out, with
`subtree intercepts pointer events` naming the panel — read that line, it says
exactly which element is in the way.

### A listing that is still settling eats context menus

Right-clicking a row moments after an upload gives a menu that Playwright
resolves and then loses: the listing refresh detaches it mid-click, and the
click waits 30s for an element that no longer exists. On a loaded CI runner that
is every run, not one in ten.

`chooseMenuItem` in `e2e/helpers.ts` is the way in: it dispatches `click` on the
entry itself and reopens the menu on failure. Never `click({ force: true })` a
menu entry: force skips the stability check but still clicks by coordinates, and
a menu animating in slides a neighbour under them — a CI run duplicated a file
instead of opening it. It deliberately does **not** treat a vanished menu as a
successful click — a menu also closes on a stray pointer move, and that shortcut
made a test assert against a navigation that never happened. After an upload,
wait for `networkidle` before touching the row at all.

`rightClickItem` dispatches a `contextmenu` event at the row's centre instead of
right-clicking. Linux Chromium opens the menu on mousedown, and a row low on the
screen opens it shifted up under the pointer: the button's release then selected
the entry there, so Notes also opened Share (CI only; macOS never reproduced
it). Moving the mouse away after opening was too late. It surfaced when uploads
started keeping the file's own date: a fresh upload no longer sorts to the top
of a date listing. A spec that only needs rows to exist seeds them through the
API and then loads the page, as `bulk-actions.spec.ts` does. Seeding by upload
let the post-upload refresh swap the rows out from under its checkbox clicks.

### E2E runs against a container, not your working tree

`test:e2e` starts the app in Docker, and Playwright's `reuseExistingServer` is
on outside CI. If a container from an earlier run is still up, Playwright
attaches to it and your edits are simply not in the app under test — the symptom
is a failure whose page snapshot shows the _old_ UI. Both `test:e2e` scripts
therefore run `up --build --wait` themselves so the stack is rebuilt and
recreated before Playwright looks at the port. Never invoke
`bunx playwright test` directly after changing app code.

Paraglide output is gitignored and only written by the Vite plugin, so a fresh
checkout has none. CI compiles it (`bun run gen:paraglide`) before `bun test` —
anything under test that imports `#lib/paraglide/messages.js` needs that step.

### Screenshots for docs

`bun run screenshots` drives the app with Playwright and writes to
`docs/images/`. It asserts each page renders before capturing, so a broken
screen cannot be published as marketing.

Shots are WebP (q90), encoded with Bun's built-in `Bun.Image` — no `sharp`. pngs
were ~7 MB of repo per run for the same pixels; this is ~0.9 MB. That only works
because Playwright runs on Bun (`[run] bun = true`).

It first seeds one dummy of every supported kind from `e2e/fixtures/showcase-*`
(image, video, track, PDF, sheet, deck, code, 3D model, archive), so the shots
exercise every preview path rather than showing an empty drive. That seeding
runs once, not per theme.

Every shot is captured twice, light then dark, via
`page.emulateMedia({ colorScheme })`: the app follows system theme by default
(see "Shipped UI defaults" above), so emulating the media query is what drives
it, not a stored preference. The dark filename carries a `-dark` suffix; light
keeps the bare name so existing references don't move. Because the theme is
applied client-side by `mode-watcher` reacting to that media query, the spec
waits for `document.documentElement`'s `.dark` class to actually match the
requested scheme before it shoots, since asserting text is visible is not enough
to know the right theme painted.

`docs/showcase.md` publishes both variants of every shot side by side, and the
README hero is a `<picture>` with `prefers-color-scheme` sources (wrapped in
`<!-- markdownlint-disable MD033 -->` / `enable`, since raw HTML is otherwise
linted out); there is no demo instance. Markdown carries plain relative
`docs/images/…` srcs so GitHub renders them directly; the docs repo rewrites
them for the site.

It runs from `e2e/screenshots`, which `playwright test` with no path **also**
runs — so a bare full-suite run rewrites `docs/images/` with whatever state the
test instance happens to be in. Anything a spec leaves on that instance ends up
in the sidebar of every shot; that is why `drives.spec.ts` names its drives
`e2e-drive …` and deletes them in an `afterEach`.

### A shared drive is a volume the app owns

`services/drives.ts` builds a `VolumeConfig` at request time —
`volume_id = drive:<id>`, rooted at `STORAGE_PATH/drives/<id>` — so every
existing storage query, mutation and read-only check scopes to it with no
changes under `services/storage`. Three things hold it together:

- **`shared: true` on the volume.** Without it `StorageService` splits the mount
  per user in full mode (`user-<id>`), which is exactly what a shared drive must
  not do.
- **Two identities.** The service is built from the drive's **owner** (whose id
  every row carries) and handed the session user as `ctx.actor`, which is what
  activity rows record. `ctx.user` is the owner, `ctx.actor` is who did it —
  never conflate them, or every edit in a drive is logged as its creator's.
- **One service factory.** Every `/api/v1/storage/**` contract declares
  `service: storageServiceFor`, which resolves `?drive=` and checks membership
  before the handler runs. `defineRoute`'s factory is therefore async and takes
  the event, and its `catch` maps `DriveAccessError` (and `ReadOnlyVolumeError`)
  to 404/403 — a handler never sees them, so a handler that catches one must
  rethrow it (`rethrowRefusal`). A non-member gets 404, not 403: a guessed id
  must not reveal that the drive exists.

A drive has its own trash at `/drives/[drive]/trash`, because `/trash` lists the
caller's own rows and a drive's belong to the drive. `isTrashListing` in
`utils.ts` is what tells the wrapper to show the restore/delete/empty actions
there.

### The drive travels as a header, not a rewritten URL

`#lib/api`'s middleware sets `x-drive` from `page.params.drive`. It must not
rebuild the request to add `?drive=` instead: `new Request(url, request)` hands
the body over as a stream, and Chrome refuses a streaming upload over HTTP/1.1 —
every POST failed with `ERR_ALPN_NEGOTIATION_FAILED` on a plain-HTTP instance,
which is how a self-hosted box is reached. The server takes either spelling
(`storageServiceFor` reads the query first), and `?drive=` stays the documented
one for the things that have no client to carry a header: media `src` URLs
(`getObjectUrl`), the upload worker's XHR, and `/view` + `/edit`, which are
outside `/drives` and so get it from `withLocation()` on the link.

### A volume is a volume, whether it is a mount or a drive

`VOLUME_<NAME>_PATH` and a shared drive produce the same thing: a `VolumeConfig`
the storage layer roots at the mount itself, owned by one account (the shared
owner for a mount, the creator for a drive) with the session user as
`ctx.actor`. Only the main drive is split per user, and only in full mode.

It used to split a declared volume per user in full mode too, which meant an
existing library opened **empty** while Penombre created a `user-<uuid>` folder
inside it. There is no flag for that any more — `VOLUME_<NAME>_SHARED` existed
for about a day and is gone, because the split was never what anyone mounting a
directory wanted.

**Everything outside the personal drive needs a location on the request.**
`storageServiceFor` (`services/storage-for.ts`) resolves `?drive=<id>` or
`?volume=<name>` — headers `x-drive`/`x-volume` from the API client — and every
`/api/v1/storage/**` and notes contract declares it as its service factory. A
route that skips it silently acts on the caller's own drive: that is exactly how
a mounted volume listed its files and then 404'd every one of them, because the
proxy route had no idea which tree to read. The client side of the same rule is
`locationOf(page.params)` — `listingHref`, `getObjectUrl`, `withLocation` and
the upload job all carry it, so a folder row, an `<img src>` and a resumed
upload stay where the page is.

`/volumes/[volume]` mirrors `/drives/[drive]` exactly: a `[...path]` child for
folders, a `trash` child (a mount's trash is not your personal one), and one
`listing.ts` server load behind all three.

### A mount the app cannot read is a 503, not a 500

`LocalStorageDriver` wraps `EACCES`/`EPERM`/`EROFS`/`ENOTDIR` as
`StorageUnavailableError` (`rethrowUnreachable`), which the volume and drive
loads answer as **503** and `define-route` answers as `ServiceUnavailable`.
`error-page.svelte` has a 503 branch naming the actual problem, because "500,
contact your administrator" is useless advice to the administrator reading it
about a permission only their `docker run` can fix.

### `handleError` must return a plain object

It returned `new Error(error.message)`, and SvelteKit serialises that value into
the SSR payload with devalue, which refuses non-POJOs: every unexpected error
rendered as the framework's bare "500 — Cannot stringify arbitrary non-POJOs"
page instead of the app's, hiding the real failure. It returns
`{ message, errorId }` now, and logs the same id beside the cause — the error
page already had the "Error ID" line, with nothing feeding it.

SvelteKit 3 sends **every** error through it, `error()` calls and 404s included,
tagged with `kind`. Both hooks act only on `kind === "unknown"`; stamping the
rest would replace a deliberate `error(403, "…")` with a generic message.

### A load is never on `page`, and not always on `navigating.to`

A universal load runs for a route that is not `page` yet. `#lib/api`'s drive
middleware read `page.params.drive` and sent the drive's header with `/browse`'s
listing, so leaving a shared drive showed its files in My Drive. Reading
`navigating.to ?? page` fixed a click but not a **hover preload**
(`data-sveltekit-preload-data="hover"`): a preload is no navigation, so
`navigating.to` is null, and the click then reuses the preloaded, wrong
response. Automation clicks too fast to trigger a preload, which is why
`drives.spec.ts` passed while every human saw it.

The middleware now skips any request made with a caller's own `fetch`, which is
exactly the loads (`options.fetch !== defaultFetch`). Every universal load is a
personal-drive route, the server's default; a load that ever needs a location
passes `query: { drive }` itself. Anything else keyed off the current route from
outside a component has the same problem.

### Browser errors reach the server log

`hooks.client.ts` posts every unexpected client error to
`/api/v1/client-errors`, logged as `Browser error [<id>]` under the id the error
page shows. It is open to anonymous callers (sign-in can crash too), so it is
rate-limited per IP, length-capped by its Zod schema and JSON-quotes every field
so a message cannot forge log lines.

### Opening a volume must not wait for its scan

`scanOnVisit` (`services/library-scan.ts`) starts the pass and returns whether
one is running; the load reports it and the page shows _Scanning your files_ and
re-invalidates every 3s until it clears. Awaiting `scanStorage()` in the load
held the page open for as long as walking the mount took — minutes on a NAS, and
indistinguishable from a hang.

Both schedules — the minute timer and a page visit — go through **one**
in-flight registry keyed by volume. Simple mode's own drive is in it too, under
`LIBRARY_SCAN_KEY`, which is what its Rescan button and event stream
(`/api/v1/library/scan`) read; it used to be scanned outside the registry. Two
registries meant the timer's pass was invisible to the page (which then reported
"not scanning" while the mount was still being crawled) and the two crawled the
same tree at once; the badge flickering between visits was that disagreement
showing.

The 30s cooldown is load-bearing, not tuning: the poll re-runs the load, so
without it each refresh would start a fresh pass the moment the last one ended
and the banner would never go away.

### A share is a scope, not a copy

"Shared with me" browses the **owner's** tree through an ordinary
`StorageService` built by `resolveShare()` (`services/storage-for.ts`) with
`options.scope` set — `?share=<shared_with id>` / `x-share` on any storage
route. `ownedFiles`/`ownedFolders` apply the scope, so every query is narrowed
for free; do not add a storage query that bypasses them.

Two things the scope alone does not cover, both handled in `service.ts`:

- **Writes that name a destination** (create, move, duplicate) do not read a row
  there first, so `assertInScope` checks the path. `strict` refuses the shared
  folder itself: a recipient works inside it, never renames, moves or trashes
  it. A shared _file_ allows no creates at all.
- **`writeFile`/`deleteFile` touch bytes by key even when no row matched**, so a
  scoped call must find its row first (`assertFileInScope`).

A file share's scope includes its **parent folder** so that folder can be listed
(showing just the file); that is why folder mutations under a file scope must
stay refused. Share URLs keep the owner's full paths
(`/shared-with-me/[share]/[...path]`), and the listing load redirects anything
outside the share back to its root; `page.data.share.root` hides the `..` row.

### A public link reads its resource's own volume

`shares` has no volume column, so `/s/[token]` resolves the tree from the shared
row's `volume_id` (`shareLinkStorage` in `storage-for.ts`). It used to build the
owner's personal-drive service, and every link to something on a shared drive or
mounted volume 500'd on `getFolder`. `fileIsInFolder` compares volumes too:
every mount has the same owner, and a mount's paths are real names that can
repeat across mounts.

### A folder link names the folder, not a URL

A browse URL is per viewer: `/browse/<path>` is the viewer's own drive, and a
folder shared with them is under their own `/shared-with-me/<grant>/…`. **Copy
link** therefore hands out `/go/folder/<id>` (`routes/go/folder`), which sends
each viewer to their way in (own drive, drive membership, volume, or a grant on
the folder or any ancestor: a personal path is its ancestors' ids) and answers
404, never 403, otherwise. `copyText()` in `#lib/utils` falls back to
`execCommand` because `navigator.clipboard` needs a secure context.

### Copying between places is export + import

`POST /api/v1/storage/transfer` builds a second service for the destination with
the same `storageServiceFor` (from a synthetic URL), exports rows from the
source (`exportTree`) and re-creates them in the target (`importTree`).
TypeScript only plans: it resolves destinations/unique names for every file
(`importFile` returns a `PlannedImport`, no bytes touched) and creates folder
rows unconditionally; the actual byte copy is one `"copy"` job sent to the Go
worker (`internal/jobs/copyfiles`, absolute `{source, dest}` pairs, staged into
a temp file beside the destination and renamed in), awaited synchronously. Only
pairs Go didn't report failed get a row inserted. A move across places deletes
the source only when **every** file landed; within one place it is the ordinary
`moveFile`/`moveFolder` (`locationKey` decides). Folder **Duplicate** is the
same endpoint with the current folder as destination.

The move dialog lists destinations from `page.data.drives`/`volumes`, and its
folder-tree request sends `drive=&volume=&share=` **empty** on purpose: a
present query parameter is what stops `#lib/api`'s middleware attaching the
current page's location header, which would otherwise make "My Drive" show the
drive you are standing in.

### A zip download is a Go job, streamed back through Node

`ZipService` (`services/storage/zip.ts`) resolves the DB-backed entries (same
scoping/display-path logic as before) into `{source, name}` pairs, enqueues one
`"zip"` job (Go writes to `<output>.<jobID>.tmp` under `.tmp/zips/`,
`zip.Deflate`, then renames in — `internal/jobs/ziparchive`), awaits it (30 min
timeout), and streams the finished file back with `streamAndCleanUp`, which
deletes it on read-to-completion, cancel or error alike. `.tmp/zips` is a
dot-directory on purpose so `scan.ts`'s `isScannable` already skips it.

Already-compressed formats (`ziparchive.Method`, by extension) are stored, not
deflated. The account export is deduped per user (`export:<id>`): a retry joins
the running job, so it is awaited without `consume`, and each waiter streams its
own hard link of the archive, which is left for `sweepStaleZips`.

A source missing from disk (deleted outside Penombre on a volume, row not yet
scanned away) is skipped and reported in `skipped`, not a failed archive — the
old `archiver` code treated ENOENT as a warning too.

A job that times out from the app's side while the worker is still writing
leaves an orphaned file there — there is no cancellation API to stop a running
job. `sweepStaleZips()` (called once at boot and hourly from `hooks.server.ts`)
deletes anything older than an hour and never throws; it is the cleanup for
exactly that case.

### Bytes may be sealed; the disk says so

With `ENCRYPTION_KEY` set, file bytes are sealed in the envelope v1 format
(`#lib/server/crypto/envelope.ts`, `internal/envelope`, vectors both must
reproduce in `tests/fixtures/envelope-v1.json`). What holds it together:

- **Sniffing is the truth, never a flag.** Whether a file is sealed is its first
  8 bytes (`PNMBENC\x01`). There is no `files.encrypted` column: a crash between
  a rename and a row update would make it lie, and a mixed tree during the
  migration sweep just works. `ctx.encrypted` only decides whether _writes_ are
  sealed; every driver is wrapped by `EncryptedStorageDriver`, which opens
  whatever is sealed whatever the flag says.
- **The file key lives in the header**, wrapped by the instance key. So a raw
  byte copy of a sealed file is a valid sealed file: copy, move and duplicate
  stay raw, and Go needs no key lookup. A rotation rewrites only the header, via
  a staged copy (never in place: a torn 76-byte write loses the file).
- **No key material in job specs or logs.** Specs carry `encrypt: bool` only;
  the worker loads the same env vars (`envelope.LoadKeyring`). A worker without
  the key fails with `sealed with key <id>, not loaded`.
- **ffmpeg/ffprobe read sealed files over loopback HTTP** (`envelope.Input`,
  random 128-bit path token, `http.ServeContent`), because `pipe:` is not
  seekable and a moov-at-end MP4 (any phone video) needs to seek. pdftoppm takes
  stdin (a plaintext PDF goes by path, so poppler need not buffer it). Nothing
  is decrypted to a temp file, renders go to memory.
- **Sealing is pull-based.** `sealStream(kek, source)` seals one chunk per pull
  and byte arrays are fed in 1 MiB pieces, so a slow disk holds back the reads
  instead of queueing the whole sealed file in memory. Downloads (public links,
  sharings) stream through `openRawFile` with Range, never `getRawFileData`,
  which decrypts the whole file.
- **The migration sweep resumes.** Each `encrypt` pass stops at a file and a
  byte budget and returns `next`; the app passes it back as `after`, so a pass
  never re-sniffs what earlier passes sealed. A restart rewalks once.
- **Every open checks the last chunk**, which carries the flag that detects
  truncation, so a range read that never reaches the end still refuses a cut
  file.
- **Scan tolerance:** a sealed file is `sealedSize(row.size)` on disk, which
  `refreshChangedFiles` treats as unchanged. Without it every sealed file looked
  changed every pass and lost its duration and thumbnail.
- **Stage files are dot-named** (`.<name>.<uuid>.tmp`): the scan and the sweep
  both skip dot-names, and the sweep also skips `<name>.<uuid>.tmp` (thumbnail
  renders). A new writer that stages must follow one of those two forms.
- **Simple mode + key is refused** in config, and the sweep never seals a
  mounted volume (it only rewraps one while a retired key is loaded):
  `VOLUME_<NAME>_ENCRYPT` seals only what Penombre writes there.
- **Boot guard:** `app_settings.encryptionKeyId` records the key on first boot.
  Missing or wrong key later refuses the boot (`assertEncryptionKey`), before
  the worker starts.
- A plaintext file that happens to start with the magic bytes reads as a corrupt
  sealed file. That is the price of sniffing.

### A version is a hard link, so nothing writes in place

File versions (`services/storage/versions.ts`, `docs/versioning.md`) keep a
file's earlier bytes at `<root>/.versions/<fileId>/<versionId>`, made by
`driver.linkObject` — a hard link, a copy only across devices. That is only safe
because `LocalStorageDriver.writeObject` stages to `.<name>.<uuid>.tmp` and
renames over the key: a write in place would rewrite every version sharing the
inode. Never add a writer that opens the key itself.

- **Rows cascade, bytes do not.** `file_versions` cascades with `files`, so
  every place that deletes file rows calls `dropVersionBytes` beside
  `purgeGrantsFor(…, "file", …)`. A new delete path needs both. Empty-trash does
  it in Node after the rows go, not in the Go delete job, so a file whose own
  delete failed keeps its versions.
- **A placeholder is not a version.** `createBatchFiles` stores the _declared_
  size on the empty placeholder row, so "is there anything to keep" asks the
  disk (`getObjectSize`), never the row.
- **Upload-onto-same-name reuses the row** (`mode: "upload"`, `findLiveSibling`)
  and never inserts, which is why `files_live_path_idx` never sees it. It must
  not write the empty placeholder either.
- **A merge keeps the order the dialog previewed**: the client sorts
  (`mergeOrder`, by the rows' `updatedAt` or by name) and sends ids oldest
  first; `planMerge` keeps the last and never re-sorts, so the preview is the
  result. Each take is linked in and only then deleted, one at a time; notes
  move to the kept file (`file_notes` cascades). Over the folder's limit is
  refused, not pruned.
- **A file row's `updatedAt` is its file's mtime.** The scan used to stamp every
  imported row with the scan's time, so a whole library read as modified the
  minute it was found and a merge by date meant nothing. `scan-list` reports
  `mtime`; new rows take it and every pass re-dates rows more than 2s off.
  Uploads send `File.lastModified` as `?mtime=` (multipart does not carry it)
  and the server `utimes` the bytes to match. Browsers expose no creation time.
  Direction matters: a file **newer** than its row was rewritten outside
  Penombre (a same-length WAV re-render is the same size to the byte) and is
  re-read; a row newer than its file was stamped by an older scan and is only
  re-dated, or the first pass would re-render a whole library.
- **Extracting a version is a move** (`extract` in `version-ops.ts`): its bytes
  are renamed out of `.versions` over the placeholder `diskName` claimed, the
  row inserted, then the version row deleted; a failed insert renames the bytes
  back. The new file is dated by the bytes' mtime, not the version's
  `createdAt`, which for an upload's version is when it was kept.
- **A file renamed on disk keeps its row** (`renames.ts`, before the scan
  inserts anything). Without it the scan deleted the row, its versions (bytes
  included), notes, stars and shares, then imported the file as new. Matched by
  inode, else by size and date when exactly one vanished row and one new file
  share them; ambiguous pairs are left to delete-and-insert. The row keeps its
  inode, so a size-and-date match (a new inode) is relinked by the inode check
  further down.
- **Outside replaces become versions during the scan** (`shadow.ts`). Each file
  has a hard link, `.versions/<id>/shadow`, and its row the `inode` the scan
  saw. A new inode on a file newer than its row (the `rewritten` rule) is a
  temp+rename from outside: the shadow is renamed into a version via
  `snapshot`'s `place`, dated the row's old `updatedAt`, then relinked. The
  inode is stored **only when a shadow was made**, or a file scanned with
  versioning off never gets one. Never a copy fallback: a shadow would double
  the library. A key rotation's rewrap also renames the file, so it can version
  identical bytes once; accepted.
- `seq` is renumbered only by an explicit reorder (`reorderVersions`), never by
  pruning, so labels survive pruning. The renumber goes through negative seqs in
  two statements: `(file_id, seq)` is unique and checked per row. A merge into a
  file that has versions sends them as `v:<id>` among the file ids, so the whole
  history comes out in the previewed order. SQLite refuses `OFFSET` without
  `LIMIT`; the prune slices in JS.
- `migratedSqlite()` does not turn on `foreign_keys`; a test relying on a
  cascade runs the pragma itself, as `db/index.ts` does in production.
- The upload and folder-settings menu entries carry `hidden()`, read by
  `shouldDisplayAction` at render, so the admin switch needs no reload.
- **Unfolded versions are rows, not a panel.** `withVersions` splices them into
  the array each layout virtualizes, at the same fixed height, so the scroll
  math stays exact. They never enter `displayData.list`: selection, bulk actions
  and the delete dialog walk that by `key`. A version row is an `ObjectItem`
  with its own `metadata.id` (`<file>:v:<version>`) plus `version`; every URL
  goes through `file-links.ts` (`rawUrl`, `thumbnailUrl`, `downloadUrl`), which
  routes it to the versions endpoints. Calling `getObjectUrl` directly for a row
  addresses the current file. Version rows are shorter than files, so the
  virtualizer takes `heightOf` and sums offsets per change of rows;
  `rowAtOffset` is the tested search. The grid does not unfold: its pill opens
  the history modal (`historyFor`).
- **`migrate-meta.ts` walks every directory on every boot** and turned
  `.versions` into folder rows. It now skips every dot-directory, like the
  scan's `isScannable`; a new app-owned dot-directory needs nothing more, but a
  walker that does not skip them will list the app's internals as folders.

### A migration test cuts the journal, it does not filter it

`live-path.test.ts` migrates to "just before" a migration by dropping that entry
and **everything after it**. Dropping only the one entry applied newer
migrations first, and drizzle's migrator, which compares timestamps, then
skipped the older one entirely.

### Sidebar groups truncate at five

`sidebarItems()` (`#lib/sidebar.ts`) caps shared drives and shared-with-me rows
at five plus an **N more** link, always keeping the item on screen. The "more"
row points at the same page as the group's first row, so it carries
`neverActive` or both highlight. The first rows use `isRoot` for the same
reason: `Nav` highlights by `startsWith`, which is why the drives page moved to
`/drives/shared` (`/drives` lit up on every drive) and why **My links**
(`/shared`) must not light up on `/shared-with-me`.

### Scan progress lives in `library-scan.ts`, not the scanner

`ScanOperations.scan(report)` only calls a reporter; the per-volume state, the
subscriber sets behind the SSE route and the ETA (`estimateRemaining`, in
`scan.ts` so a test can import it without the config module) sit beside the
`inFlight` registry. Emits are throttled to four a second — a pass over files it
already knows reports thousands of steps a second — except phase changes and
start/end, which always go out. Every pass reaches the stream because every pass
goes through `runScan`: the minute timer, a page visit and **Rescan**.

The directory walk and the media-duration probe are Go jobs
(`internal/jobs/scanlist`, `internal/jobs/mediaprobe`); Go only returns
keys/sizes and durations, TS still decides every row. The walk sizes a symlink
by its **target** (`os.Stat`) — `WalkDir`'s info is `Lstat`, and a link's own 42
bytes as the stored size truncated every stream from a symlinked library.

Durations are **never awaited on a request**. An upload nulls the duration and
fires `recordDurations` (`services/storage/media.ts`) without awaiting it; a
scan nulls it for changed bytes. `null` means "not known yet": the duration
sweep (`services/duration-sweep.ts`, every minute from `init()`) visits
**every** root — personal drives in full mode and shared drives included, which
the library scan never touches — and probes up to 500 of each root's `null` rows
in one job (one dedupe key per root, random order so rows that keep failing
cannot starve the rest). `0` is definitive: ffprobe read the file and it has
none, or rejected it as not media. A transient failure (I/O error, a truncated
upload) leaves the path out of the result so it stays `null`; a missing
`ffprobe` fails the whole job. A duration is written only if `updated_at` still
matches the bytes it was probed for — two quick re-uploads raced, and the older
probe could land last — and the write keeps `updated_at`, since `$onUpdate`
would otherwise reorder "last modified".

ffprobe failures that are not a definitive "no duration" back off in memory
(doubling from a minute to a day, `probeMissingDurations`), so an unreadable
file is not re-probed every minute forever; a restart retries them all once.
Backed-off ids are excluded in the SQL (up to 5000), not filtered after the
`LIMIT`, or enough stuck rows would crowd new ones out of the batch. Only paths
the job reports in `probed` back off — a sweep that joined another instance's
deduped job did not have its own rows tried. Entries a day overdue are
forgotten. The sweep's `select distinct` rides `files_category_idx`. The
`updated_at` guard has a Postgres test, `media.pg.test.ts`, skipped unless
`DATABASE_URL` names Postgres:
`DATABASE_URL=postgres://… bun test media.pg.test.ts`.

### A non-ActionResult response disappears

`use:enhance` runs `JSON.parse` on the response and hands the object to
`applyAction`, which reads only `type`. SvelteKit's own cross-site 403 answers
`{"message":"Cross-site POST form submissions are forbidden"}` — valid JSON, no
`type` — so `applyAction` set `page.form` to `undefined` and the form appeared
to do nothing at all. A wrong `ORIGIN` behind a reverse proxy is exactly that,
and it looked like a dead button.

Import `enhance`/`deserializeAction` from **`#lib/forms`**, never `$app/forms`:
they toast the server's message when the body is not an ActionResult (or not
JSON — a proxy's error page). Everything else about `enhance` is unchanged, so a
form's own `form?.error` handling is untouched.

### SvelteKit 3

- **`#lib`, not `$lib`**, and imports carry an extension: `#lib/utils.js`,
  `#lib/api/index.js` for a directory. It is a `package.json` `imports` entry,
  so Bun, tests and scripts resolve it with no alias config. A component that
  has a sibling `.svelte.ts` is still imported as `x.svelte` — the migration
  codemod rewrote two of those to `x.svelte.js`, which is the module, and the
  build failed with a missing `default` export.
- **`src/instrumentation.server.ts` is load-bearing**, not telemetry. Kit 3
  includes it with no opt-in; deleting it along with the old
  `experimental.instrumentation` flag made the server die at boot on tsyringe's
  missing reflect polyfill, which e2e only reports as an "unhealthy" container.
- **No `$env/*`.** `$app/env/private` wants every name declared up front, and
  `OAUTH_<NAME>_*` / `VOLUME_<NAME>_*` are discovered by scanning keys, so
  `config.ts` reads `process.env`.
- **`resolve()` takes a route id when it starts with `/`**, and only routes with
  a `+page`/`+server` are ids. Home is `resolve("/(app)")`; `"/"` is not a route
  here and does not type-check. Pathnames drop the slash
  (`resolve("auth/sign-in")`). The app's own URL types use `ResolvedPathname`,
  which keeps the leading slash; `Path` does not.
- **`page.url` is read-only.** Helpers that only read it take `ReadonlyURL`.
- **`goto` rejects anything that is not a page**, the raw-file endpoint included
  — `handleOpenItemFullscreen` uses `window.location` for those. External
  redirects need `redirect(…, { external: true })`, which the OAuth
  auto-redirect on sign-in does.
- **Both tsconfigs extend `$app/tsconfig`** (`node_modules/$app/tsconfig.json`).
  Kit 3 stops writing `.svelte-kit/tsconfig.json`, but an old checkout keeps a
  stale copy, so a config still pointing there passes locally and fails in CI.
  `rm -rf .svelte-kit` before trusting a local `bun run check`.
- **Do not `!!`-ignore `src/lib/api/v1.d.ts` in Biome**: `gen:api` formats it
  with Biome and fails on an ignored path.
- **Nothing may import `$app/stores`.** Kit 3 turns it into a module that throws
  on import, so one dependency still using it (superforms 2.x did) 500s every
  page that loads it — in the built app only; `bun run check` is green.
- **CSRF is ours, not Kit's.** Kit 3 counts a request with no `Content-Type` as
  a form post and refuses it before any hook runs, so every bodiless `DELETE`
  from an API-key client was a 403. `vite.config.ts` turns Kit's check off
  (`trustedOrigins: ["*"]`) and `#lib/server/csrf.ts` applies the same rule
  minus requests carrying an API key. Playwright's `request` sends no `Origin`
  either — pass `headers: sameOrigin()` (`e2e/helpers.ts`) on a bodiless call.
