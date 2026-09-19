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

Runtime is **Bun** (1.3+); use `bun`/`bunx`, not `npm`/`node` (`preinstall`
enforces this).

```bash
bun run dev              # Vite dev server (SQLite by default, no services needed)
bun run build            # svelte-kit sync && vite build
bun run check            # svelte-check (app) + type-check for scripts, in parallel

bun run lint             # oxlint + biome + markdownlint + tailwint
bun run lint:fix         # fix everything fixable
bun run format           # biome format --write

bun test                                    # unit tests (fully mocked, no services needed)
bun test src/lib/server/services/user.test.ts   # single file
bun test -t "some test name"                # filter by test name
bun run test:docker      # unit tests in Docker (mirrors CI, adds real Redis)
bun run test:e2e         # Playwright e2e on SQLite (the default stack)
bun run test:e2e:pg      # Playwright e2e on PostgreSQL
bun run test:e2e:ui      # Playwright UI mode

bun run db:generate      # generate a Drizzle migration from schema.ts changes
bun run db:studio        # Drizzle Studio
bun run gen:api          # regenerate OpenAPI spec + typed API client

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
fast linters on staged files; **pushes** run `bun run check` and `bun test`. CI
runs the pre-commit stage with `--all-files`:

```bash
prek run --all-files                        # every pre-commit hook, whole repo
prek run --all-files --hook-stage pre-push  # type check + unit tests
prek run oxlint                             # a single hook
SKIP=test-unit git push ...                 # skip one hook
```

## Architecture

The **SvelteKit app lives at the repo root** (frontend + backend API):

```text
.                  # SvelteKit app (frontend + backend API)
├── src/
│   ├── routes/    # pages ((app)/, auth/) and API endpoints (api/v1/**/+server.ts)
│   └── lib/
│       ├── server/          # server-only code (#lib/server, never bundled to client)
│       │   ├── openapi/v1/  # route contracts: defineRoute() calls, one file per resource
│       │   ├── services/    # business logic (storage, activity, preferences, user, version)
│       │   └── db/          # Drizzle schema + client
│       └── components/      # Svelte 5 UI (shadcn-svelte in components/ui)
├── drizzle/       # SQL migrations generated from src/lib/server/db/schema.ts
├── e2e/           # Playwright tests
└── tests/         # Go tests for cmd/ and internal/, split unit vs integration
```

Despite what the README says, there is **no Hono** in this codebase — API routes
are plain SvelteKit `+server.ts` handlers built with a custom `defineRoute()`
wrapper.

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
in the database (`files`/`folders` tables in `db/schema.ts`) — SQLite by
default, Postgres optional, picked from the `DATABASE_URL` scheme by
`db/dialect.ts`. The actual **bytes** live behind the `StorageDriver` interface
(`#lib/server/services/storage/driver.ts`), implemented only by
`LocalStorageDriver` (filesystem under `STORAGE_PATH`); the interface stays
because every consumer and test double types against it. All driver methods take
keys relative to a user's storage root. `StorageService`
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

`#lib/server/cache` is a pluggable async cache (`CacheBackend` interface) with
`MemoryCacheBackend` (default, in-process), `RedisCacheBackend` (`REDIS_URL`
set), and `NullCacheBackend` (no-op). `CacheManager`/`CacheKeys` in the storage
service module wrap it for listing/metadata caching.

### i18n

Messages live in `messages/*.json`, compiled by paraglide-js into
`src/paraglide/messages` (also mirrored under `src/lib/paraglide`). Don't
hand-edit generated paraglide output.

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
- `bun run lint:md` must pass: 80-column prose, aligned table pipes. Relative
  links between guides (`simple-mode.md#anchor`) are rewritten by the docs site
  — use them instead of absolute URLs.

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

**Do not reach for `max-w-*` by default.** Most things should fill their
container — the page shell and the tab strip already bound the content. A width
cap is a deliberate choice for a specific reason (a single-column reading
measure, a form that would look absurd at 2000px), not a reflex to add to every
wrapper. Panes inside tabs are full width. When a wide screen leaves a layout
looking sparse, add columns (`xl:grid-cols-2`, `2xl:grid-cols-3`) rather than
capping the width.

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

System theme, purple accent, standard (sans) typeface, rounded corners, list
layout, sorted by last modified descending. These live in **two** places that
must agree: `defaultPreferences` (`services/preferences.ts`) and the `:root`
block in `app.css` — the CSS base is what unauthenticated pages (sign-in) use,
since `applyTheme()` only runs once a session's preferences have loaded.

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

Anything better-auth reads at init (email sign-in, OAuth providers) is resolved
once via top-level `await` in `auth/index.ts`, so a change there needs a
restart. The UI says so.

### OAuth providers come from two places

Env-declared (`OAUTH_<NAME>_*`, owned by `config.ts`) and stored (`app_settings`
`oauthProviders`, written by **Admin → Settings**). `auth/index.ts` merges them
at init with env winning a name collision, and exports `loadedOAuthProviders` —
which is what the sign-in page and `/api/v1/auth/providers` must read. The
config list would offer a button for a provider this process never registered,
which is the same trap as the passwordless methods above.

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
accounts depend on it (`accountsWithOnly` counts who would be stranded). Magic
link and emailed codes are exempt from the second rule — they authenticate an
address, not a stored credential, so no `account` row depends on them.

`validateSignInMethods` takes the stranded-count lookup as its third argument so
the rules can be tested without a database; the default is the real query.

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

### The sign-in page offers what the process loaded, not what the DB says

`getPasswordlessSettings()` is true the moment an admin saves, but the plugin
list was built at module init — so the button appeared for an endpoint that did
not exist and posting to it 404'd with no message. The page reads
`passwordlessMethods` (exported from `auth/index.ts`, the resolved value)
instead. `test.setup.ts` mocks that export too.

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

### Passwordless methods need a restart

better-auth builds its plugin list once at module init, so `magicLink` and
`emailOTP` are resolved by top-level await in `auth/index.ts`. Toggling them in
the admin UI takes effect on the next boot; the UI says so. Both are gated on
SMTP in `getPasswordlessSettings()` rather than only in the UI, so removing mail
afterwards disables them rather than leaving a method that silently fails.

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
  times over.
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
order would let a directory sweep away bytes TS just decided to keep. On the
main drive and shared drives a folder's row is safe to remove regardless of that
job's outcome: `createFolder` never touches the filesystem, a directory only
exists once some file under it is written. On a mounted volume a scanned folder
**is** a real directory, so one in `failedDirs` can outlive its row — the next
scan simply re-creates the row, with nothing under it lost.

Emptying is one request for the same reason the bulk actions are pooled
(`MAX_PARALLEL_REQUESTS` in `wrapper-bulk.svelte.ts`): a request per row over a
large selection is where the partial failures came from, and the client can only
price what the page happens to be showing.

### The sidebar counts come from the layout load

`(app)/+layout.server.ts` fetches `/storage/file/counts`, so it must
`depends("app:files")` — a mutation invalidates that key, and without the
dependency the badges keep the numbers they were booted with. Server-side,
`invalidateListingCaches` has to drop the `counts` **prefix**: the two counters
are stored under `counts:trashed` / `counts:starred`, which an exact-key delete
never touched.

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

Every key must exist in **all four** locales (`messages/{en,fr,de,es}.json`) or
`bun run check` fails. There is no working ICU plural support here — use two
flat keys plus a helper in `utils.ts` (see `filesCountLabel`).

### Test isolation

`mock.module` in Bun is **global and permanent** — a module mock in one test
file leaks into every file that runs after it. Two consequences:

- Every local `#lib/server/config` mock must return the _same_ shape, or a suite
  that runs later reads a config missing the fields it needs.
- A suite that calls `mockReturnValue` (not `...Once`) on a shared mock must
  restore it in `afterAll`, or it reconfigures everything downstream.

Prefer stubbing a method on the instance under test over mocking a module.

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

### A folder path is a chain of UUIDs, and a file key is not an id

`folders.path` is the folder's own id appended to its parent's path, so a nested
folder's path is `uuid/uuid/uuid`, and the browse URL is that same chain
(`page.params.path`). Taking `.split("/").pop()` of it gives a segment that
matches no row: `getFolderIdByPath` returns null while the caller still prefixes
the file's path with it, producing a row filed in the root that claims to live
in a folder and is unreachable by its own key. `resolveDestination()` in
`services/storage/files.ts` now refuses an unresolvable folder outright (400),
so a create either lands where it says or fails.

`fileDbToObjectItem` sets `key` to the **last path segment** only, so an item
from a listing cannot address its own file unless the caller re-attaches the
folder (`query.folder`), which is why every mutation in `wrapper.svelte.ts`
carries `currentFolder`. Views that list across folders (starred, recent,
search, the editor) have no such folder, so `PUT /api/v1/storage/file/{id}`
falls back to `findFileById` when the path misses. Prefer passing `metadata.id`.

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
slow suite is a bug. The suite is split `--shard=N/2` per dialect, each shard on
its own fresh stack, which is why tests may stay serial (`workers: 1`) inside
one. A spec that pushes a shard over budget gets faster or moves, the budget
does not grow.

A broken build is the other way to blow it: every test times out three times,
and 103 × 3 × 30s kept a job red for 2.5h. CI stops at `maxFailures: 10`.
Playwright already runs on Bun (`[run] bun = true` in `bunfig.toml`); there is
nothing to switch on.

### `bun install` on checkout

`.pre-commit-config.yaml` has a `post-checkout` hook, installed by `prepare`
(`post-checkout` is in `default_install_hook_types`). `node_modules` is not part
of a checkout, so without it the first command after a branch switch runs
against the previous branch's dependencies.

It runs `bun install --ignore-scripts` plus an explicit `svelte-kit sync`, not a
plain `bun install`: `prepare` runs `prek install`, which rewrites `.husky/_/*`
— tracked files — from inside the hook prek is currently running. prek then sees
a hook that modified the working tree and every branch switch on a dirty tree
ends in "Hook changes conflicted with the saved unstaged changes." `entry` is
exec'd rather than run through a shell, hence the `sh -c`.

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
one-line `FROM` + `ENV PENOMBRE_RELEASE_VERSION` build — the image was built
before semantic-release picked the version, and `config.ts` reads that override.
A mismatch (direct push, stale PR run) takes the full path. The PR image of a
merged PR is deleted by `publish.yaml`, not `pr-cleanup.yaml`, which would race
the promotion. The release commit carries `[skip ci]`; without it the version
bump rebuilt and re-tested the whole pipeline a second time.

### TypeScript is held at 6 on purpose

`svelte-check` refuses TypeScript 7 outright — it wants _both_ TS 6 and TS 7
installed plus a `--tsgo` flag, and dies before checking a single file. A
`renovate.json` rule caps `typescript` at `<7` so the bump stops being
reproposed. Lift it when svelte-check ships tsgo support, not before.

`nodemailer` 10 cut `Transporter`'s second type argument (the options type); it
takes only `SentMessageInfo` now.

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
the same.

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

It first seeds one dummy of every supported kind from `e2e/fixtures/showcase-*`
(image, video, track, PDF, sheet, deck, code, 3D model, archive), so the shots
exercise every preview path rather than showing an empty drive.

`docs/showcase.md` publishes those files and the README links to it with a
single hero image — there is no demo instance. Markdown carries plain relative
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
existing storage query, cache key, mutation and read-only check scopes to it
with no changes under `services/storage`. Three things hold it together:

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
outside `/drives` and so get it from `withDrive()` on the link.

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

### During a navigation, `page` is the page you are leaving

A universal load runs _while_ the navigation is in flight, so anything it reads
from `$app/state`'s `page` describes the **previous** route. `#lib/api`'s drive
middleware read `page.params.drive` and therefore sent the drive's header with
`/browse`'s own listing request: leaving a shared drive by a sidebar link showed
the drive's files in My Drive until a full reload, which is why it looked like a
cache bug. It reads `navigating.to ?? page` — the route whose load is actually
running. Anything else keyed off the current route from outside a component owes
itself the same check.

`drives.spec.ts` covers it by _clicking_ the link; a `page.goto` is a fresh
document and passes either way.

### Opening a volume must not wait for its scan

`scanOnVisit` (`services/library-scan.ts`) starts the pass and returns whether
one is running; the load reports it and the page shows _Scanning your files_ and
re-invalidates every 3s until it clears. Awaiting `scanStorage()` in the load
held the page open for as long as walking the mount took — minutes on a NAS, and
indistinguishable from a hang.

Both schedules — the minute timer and a page visit — go through **one**
in-flight registry keyed by volume. Two registries meant the timer's pass was
invisible to the page (which then reported "not scanning" while the mount was
still being crawled) and the two could crawl the same tree at once; the badge
flickering between visits was that disagreement showing.

The 30s cooldown is load-bearing, not tuning: the poll re-runs the load, so
without it each refresh would start a fresh pass the moment the last one ended
and the banner would never go away.

### A share is a scope, not a copy

"Shared with me" browses the **owner's** tree through an ordinary
`StorageService` built by `resolveShare()` (`services/storage-for.ts`) with
`options.scope` set — `?share=<shared_with id>` / `x-share` on any storage
route. `ownedFiles`/`ownedFolders` apply the scope, so every query is narrowed
for free; do not add a storage query that bypasses them.

Three things the scope alone does not cover, all handled in `service.ts`:

- **Writes that name a destination** (create, move, duplicate) do not read a row
  there first, so `assertInScope` checks the path. `strict` refuses the shared
  folder itself: a recipient works inside it, never renames, moves or trashes
  it. A shared _file_ allows no creates at all.
- **`writeFile`/`deleteFile` touch bytes by key even when no row matched**, so a
  scoped call must find its row first (`assertFileInScope`).
- **The listing cache is per owner.** A scoped service reads a
  `NullCacheBackend` — or the owner would be served the recipient's narrowed
  listing, and vice versa — but still clears the owner's cache on a mutation.

A file share's scope includes its **parent folder** so that folder can be listed
(showing just the file); that is why folder mutations under a file scope must
stay refused. Share URLs keep the owner's full paths
(`/shared-with-me/[share]/[...path]`), and the listing load redirects anything
outside the share back to its root; `page.data.share.root` hides the `..` row.

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

A source missing from disk (deleted outside Penombre on a volume, row not yet
scanned away) is skipped and reported in `skipped`, not a failed archive — the
old `archiver` code treated ENOENT as a warning too.

A job that times out from the app's side while the worker is still writing
leaves an orphaned file there — there is no cancellation API to stop a running
job. `sweepStaleZips()` (called once at boot and hourly from `hooks.server.ts`)
deletes anything older than an hour and never throws; it is the cleanup for
exactly that case.

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
