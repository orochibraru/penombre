# TODO

The backlog, and the only one. Filled by the `devex`, `ui-ux` and `privacy`
agents (`.claude/agents/`) and by hand. No priority order beyond **[SECURITY]**
first. Size: `[S]` an hour, `[M]` a day, `[L]` more. Done means deleted.

## Privacy

- [ ] **[SECURITY]** [S] `src/routes/(app)/admin/settings/+page.server.ts`:
      `save`, `saveProvider`, `deleteProvider` never check the caller. The admin
      check is only in `admin/+layout.server.ts` `load`, which does not run
      before a form action, and `hooks.server.ts` has no auth gate. A
      same-origin POST from a non-admin or no session at all can repoint SMTP
      (every share/note email with file names), enable magic link, or add an
      attacker-controlled OAuth provider. Guard every action with a
      `requireAdmin(locals)`, and audit every other `admin/**` action for the
      same hole.
- [ ] **[SECURITY]** [M] `src/routes/auth/onboarding/+page.server.ts`
      `setPassword` is anonymous and takes only an email. `needsPassword()` is
      true for any account with no `credential` row: invitees, but also every
      OAuth-, passkey- and magic-link-only user. `auth/sign-in?/lookup` answers
      `step: "onboarding"` for exactly those, so they can be enumerated. Set a
      password, sign in, own the drive. Bind onboarding to a single-use
      admin-issued invite token and never offer it to an account holding any
      `account` row or passkey.
- [ ] **[SECURITY]** [M] Stored XSS: `storage/proxy.ts` `handleRawFile` and
      `/s/[token]/download?inline` serve bytes inline with the row's
      `contentType` (`html` -> `text/html`, `svg` -> `image/svg+xml`), and
      `updateFile` accepts any `contentType` from the body. No CSP, no
      `nosniff`, no sandbox. An HTML file in a share, drive or volume runs on
      the instance origin with the victim's session ("Open full screen" does
      `window.location.assign(rawUrl)`). Send
      `Content-Security-Policy: sandbox` + `nosniff` on raw responses, force
      `attachment` for active types, drop `contentType` from `updateFileSchema`.
- [ ] **[SECURITY]** [M] `services/storage/files.ts`/`folders.ts` write file and
      folder names into `activity.message` ("Created file: ${name}", "Moved file
      ...", "Created folder: ..."), which `ActivityService.audit()` selects and
      `admin/activity` renders to every admin. The `audit` docstring and
      CLAUDE.md both claim otherwise. Make messages name-free, scrub existing
      rows in a migration, fix both texts.
- [ ] **[SECURITY]** [S] `api/v1/files/[fileId]/notes/+server.ts` `announce()`
      notifies everyone who ever wrote a note, with no access check. A revoked
      sharee or ex-drive-member keeps getting notifications and emails with the
      file name and a link. Filter to users who can still reach the file.
- [ ] [S] Trashed items still served to sharees: `/s/[token]` load and
      `/s/[token]/download` use `findFileById` (no `isTrashed` filter),
      `fileIsInFolder` ignores it for `?file=`, and
      `api/v1/sharings/[id]/download` does the same. Add `isTrashed = false` on
      all three.
- [ ] [S] `hooks.server.ts:258` logs the full raw API key on every failed
      attempt (typos, revoked keys, and valid keys whose `verifyApiKey` threw).
      Log a prefix or hash.
- [ ] [S] Error bodies leak internals: `Http.ServerError` returns
      `error.message` as `context`, and `handleError` returns `error.message` to
      pages, including public `/s/[token]`. Drizzle errors carry SQL and bound
      params, driver errors carry absolute paths. Return a generic message plus
      `errorId`.
- [ ] [S] `admin/settings/+page.server.ts` load returns `getAppSettings()`
      whole: every OAuth `clientSecret` and the SMTP password land in page data,
      the password in an input `value`, despite the comment saying otherwise.
      Strip them; blank password on save means "keep".
- [ ] [S] `storage/proxy.ts` `handleThumbnailRequest` sends
      `Cache-Control: public, max-age=31536000, immutable` on private
      thumbnails. A caching proxy serves them to anyone with the URL; a revoked
      sharee keeps them a year. Use `private, no-cache`.
- [ ] [S] No rate limit on anonymous actions `/s/[token]?/unlock` (share
      password brute force) and `auth/sign-in?/lookup` (email and sign-in method
      enumeration). better-auth's limiter only covers `/api/v1/auth/**`; the
      comment on `lookup` is wrong. Add a per-IP/per-token limiter.
- [ ] [S] `SharingService.searchUsers`: one-character `q`, unescaped `%`/`_`, so
      any user can dump the directory's names and emails 10 at a time. Require
      ~3 chars, escape wildcards, or exact email.
- [ ] [M] Deletion leaves traces: `file_notes.file_id`, `shares.resource_id`,
      `sharings.resource_id` have no FK, so notes, public links (with frozen
      `resourceName`) and grants outlive the file. Notifications keep
      `resourceName` forever. `ShareService.purgeExpired()` is never called.
      Delete with the resource, schedule the purge.
- [ ] [M] `admin/users` `removeUser` cascades rows but leaves
      `STORAGE_PATH/user-<id>`, its `.thumbnails`, and owned
      `STORAGE_PATH/drives/<id>` on disk forever. Enqueue a Go delete job from a
      user-delete hook.
- [ ] [S] Thumbnails outlive their key: `moveFile`/`moveFolder` leave
      `.thumbnails/<oldkey>_*`, and `uploadFileBody`/Office save replace bytes
      without dropping cached thumbnail/peaks, so the old image is served for
      new content. `deleteThumbnails(oldKey)` on move and overwrite.
- [ ] [S] Sign-out leaves browser state: `handleSignOut` (`auth-helpers.ts`)
      doesn't clear the IndexedDB upload queue or `penombre:sign-in-email`. The
      next user on a shared machine sees the previous upload list, and
      `resumeUploads()` re-sends their bytes under the new session. Clear both,
      key the queue by user id.
- [ ] [S] Off-instance by default: `(app)/+layout.server.ts` hits
      `/api/v1/version/check`, which calls `api.github.com` hourly with no
      opt-out and no docs. `user.image` is any URL (better-auth `update-user`)
      and `admin/users` renders them all, so a user can plant a tracking pixel
      for the admin. Env switch for the version check, proxy or restrict
      avatars, document in `docs/env.md`.
- [ ] [S] Info-level logs with personal data: `email.ts:79` (recipient +
      subject), `folders.ts:161` and `:246` (folder names), `auth/index.ts:148`
      (address). Debug level or redact.
- [ ] [S] `/s/[token]/+page.server.ts` returns full `ObjectItem`s to anonymous
      visitors: owner user id, tags, `isStarred`, `isTrashed`. Map to a
      name/size/type/id DTO.
- [ ] [M] User rights: no self-service account deletion, no "export everything I
      own", no retention for `activity`/`notifications`/`jobs` (activity never
      pruned). Add both paths and a retention setting, document in `docs/`.

## DevEx

- [ ] [S] `bunfig.toml` has no `rerunEach`, yet CLAUDE.md and CONTRIBUTING.md
      claim `rerunEach = 3`. Add it under `[test]` (suite is 1.4s) or delete the
      claim.
- [ ] [S] CLAUDE.md drift: `bun run check` is sequential
      `check:app && check:scripts && check:go`, not parallel. `db/schema.ts` is
      a dialect shim; drizzle reads `schema.pg.ts`/`schema.sqlite.ts` (also
      stale in CONTRIBUTING "Database changes"). Paraglide outdir is
      `src/lib/paraglide` only; `src/paraglide/` is a dead leftover still
      ignored in `.oxlintrc.json` and `.markdownlint-cli2.jsonc`, and
      `gen:paraglide` exists. `withDrive()` is now `withLocation()`. The "no
      Hono despite README" line is obsolete. Cut the Architecture layout tree.
      Bun is 1.4 (`packageManager`), not 1.3+. Many scripts missing from the
      Commands block (`circular`, `gen*`, `lint:*`, `db:generate:*`,
      `machine-translate`, `migrate:storage`, `preview`, `release`,
      `test:e2e:headed`, ...).
- [ ] [M] CONTRIBUTING.md drift: prerequisites omit Go, poppler and libwebp
      ffmpeg; prek comes from node_modules, not brew;
      `SKIP=test-unit git commit` is wrong (pre-push hook); `console.*` is an
      oxlint error, not Biome; `$lib`/`$env` references are gone; "green local
      commit means green CI" ignores pre-push. README Acknowledgments still
      names Biome as the linter.
- [ ] [S] `bun run circular` fails (`storage/driver.ts` <->
      `storage/drivers/local.ts`), runs nowhere, and only scans `.ts`. Fix the
      cycle and wire it into `code_quality.yaml` (2s), or delete it with `madge`
      and its doc mentions.
- [ ] [S] Dead deps: `sveltekit-superforms` (imported nowhere, and CLAUDE.md
      says 2.x 500s the built app via `$app/stores`) and `markdownlint`
      (`markdownlint-cli2` bundles its own). Remove.
- [ ] [S] `.markdownlint-cli2.jsonc` has `"fix": true`, so `lint:md` and CI's MD
      lint rewrite files instead of failing. Drop it; also drop the duplicated
      `globs` (log prints `**/*.md **/*.md`).
- [ ] [S] `code_quality.yaml` runs every lint twice: `prek run --all-files`
      already covers oxlint, biome, markdownlint, tailwint and `gen`, then the
      job re-runs `lint:md`/`lint:ts`/`lint:tailwind`/"Codegen is current". One
      owner per gate.
- [ ] [S] Pre-push `check` and `test-unit` hooks' `files:` skip
      `package.json`/`bun.lock` (and `scripts/` for tests), so a dependency bump
      pushes unchecked. Add them.
- [ ] [S] Every `svelte-kit sync` prints the `vite-plugin-pwa`
      "transformIndexHtml hook which is not supported" warning twice. Silence it
      in `vite.config.ts` or drop the plugins that don't work under svelte-smol.
- [ ] [S] Missing prerequisites fail late: without Go, dev `worker-process.ts`
      loops forever on exit 127; say "install Go or set WORKER_MODE=external".
      Without libwebp every thumbnail fails separately. Add a boot preflight in
      `cmd/worker` (LookPath ffmpeg/ffprobe/pdftoppm + libwebp encoder check)
      logging the brew command.

## UI/UX

- [ ] [S] `src/lib/components/layout/dialogs/delete-dialog.svelte`: `isTrash` is
      `page.url.pathname.startsWith("/trash")`, so in `/drives/[drive]/trash`
      and `/volumes/[volume]/trash` the permanent-delete confirm shows the "move
      to trash" copy and a "Continue" button. Bytes go forever while the dialog
      says it is reversible. Use `isTrashListing()` from `utils.ts` like
      `wrapper.svelte`.
- [ ] [S] `src/routes/(app)/account/+page.svelte`: the `$effect` reads `email`,
      `name` and `form` together. After one save `form.success` stays set, so
      every keystroke re-fires the "Account updated" toast and resets
      `hasChanged`; Save stays disabled until reload. Handle `form` once per
      submission in the `enhance` callback. Also a hand-rolled `<h2>` instead of
      `Card.Header`/`Card.Title`, and both `<Label>`s lack `for`.
- [ ] [S] `src/routes/(app)/edit/[fileId]/+page.svelte`: `flush()` returns early
      during an in-flight save, so an edit typed then sits in `pending` with no
      timer while the header says "Saved at HH:MM". A failed save also leaves
      "Saved" up and nothing retries until the next keystroke. Re-flush after a
      save when `pending` is set, retry failures on a timer, show "Unsaved
      changes"/error. Same file: `h-[calc(100vh-8rem)]` hides the editor bottom
      under the bottom bar on iOS Safari; use `dvh`.
- [ ] [M] `wrapper-bulk.svelte.ts` `executeDeleteOperation` / `wrapper.svelte`
      `onMoveToTrash`: trash has no undo; the toast is a dead end. Add an "Undo"
      action running restore on the same keys.
- [ ] [S] `src/routes/(app)/shared/+page.svelte`: "Revoke" kills a public link
      in one click, no confirm, no undo. Confirm via `responsive-dialog.svelte`.
- [ ] [S] `src/routes/(app)/account/sessions/+page.svelte`: "Last active" shows
      `session.createdAt`. Use `updatedAt`.
- [ ] [M] `wrapper.svelte` `onDownload` (folder) and `wrapper-bulk.svelte.ts`
      `downloadSelected`: the zip is fetched whole as a `blob` before the save
      prompt. Minutes of "Creating zip" toast, no progress, whole archive in tab
      memory. Point an `<a download>` at the streaming endpoint.
      `handleDownloadItem` also toasts "Downloaded" before anything arrived.
- [ ] [S] `src/lib/components/layout/header.svelte` breadcrumbs: mobile renders
      a single crumb twice ("Drive > Drive"); desktop crumbs lack
      `truncate`/`min-w-0` so a deep path pushes the bell/avatar off-screen;
      last crumb is `Breadcrumb.Link` not `Breadcrumb.Page` (no `aria-current`);
      mobile ellipsis trigger has no accessible name.
- [ ] [M] `src/routes/(app)/browse/[...path]/+page.ts`: one
      `/folder/{path}/meta` request per segment, sequential, before the listing
      starts. Each level adds a round trip, and a failed lookup shows the raw
      UUID as crumb. Resolve the chain in one request or parallelise with the
      listing. Also the hard-coded "My Drive" crumb.
- [ ] [S] `src/lib/components/file/grid.svelte`: the tile "..." button is
      `opacity-0` until hover, invisible on phones. Use
      `pointer-coarse:opacity-100`. Its `loadingRows` skeletons are thin bars,
      then tiles snap in at 16:10 and the page jumps; make skeletons
      tile-shaped.
- [ ] [S] `src/lib/components/file/list.svelte`: row "..." button has no
      accessible name or focus style, ~28px touch target; destructive entries
      hard-code `text-red-600/800/300` instead of `text-destructive`.
- [ ] [S] Icon-only buttons with no accessible name: collapse/dismiss in
      `upload-progress-indicator.svelte`, remove-file in `upload-dialog.svelte`,
      loading-state play in `music-player.svelte`/`video-player.svelte`, API-key
      actions in `account/security/+page.svelte`.
- [ ] [S] Button inside button: volume `Popover.Trigger` in
      `music-player.svelte`/`video-player.svelte` and API-key
      `DropdownMenu.Trigger` in `account/security/+page.svelte` wrap a
      `<Button>`. Use the `child` snippet like `user-menu.svelte`.
- [ ] [S] `src/lib/components/layout/error-page.svelte`: `text-gray-700/800`
      headline, near-invisible in dark theme on every 404/403/503. Use
      `text-foreground`/`text-muted-foreground`.
- [ ] [S] Hard-coded red/amber error text: `rename-dialog.svelte:148`,
      `new-folder-dialog.svelte:80`, `move-dialog.svelte:584,591`,
      `account/security/+page.svelte:477`, failed-upload icon in
      `file/prefix.svelte`. Use `text-destructive` plus a warning token.
- [ ] [S] Radii ignoring the corners preference: bottom bar `rounded-t-4xl` in
      `(app)/+layout.svelte`, `rounded-2xl` in `view/[fileId]/+page.svelte`.
      Derive from `--radius`.
- [ ] [S] `src/lib/components/layout/top-loading-bar.svelte`: `bg-white` track,
      glaring on dark, invisible on light. Use `bg-primary/20`.
- [ ] [S] `table.svelte`/`list.svelte`/`grid.svelte` empty states: Trash,
      Starred, Recent and categories all say "No results", which reads like a
      failed search. Give each its own message (four locales).
- [ ] [S] Hard-coded English: `"Close"` default in `bottom-action.svelte`,
      `fail()` fallbacks in `account/security/+page.server.ts` and
      `account/+page.server.ts`, thrown errors in `account/sessions` and
      `account/security` pages that reach toasts.
- [ ] [M] `src/routes/auth/sign-in/+page.svelte`: better-auth's English errors
      shown verbatim to fr/de/es users, with English fallbacks, and each error
      shown twice (toast + inline `Alert`). Map error codes to paraglide keys,
      one surface.

## Features

- [ ] [M] Release channel setting (`stable` | `canary`) so update alerts match
      the image the instance runs. `services/version.ts` only reads
      `releases/latest`, so a canary instance is never told about newer
      canaries, and `isNewerVersion` splits on `.` and `Number()`s each part:
      `1.8.51-canary.3` yields `NaN`, and comparing 1.8.51 against its own
      canary is wrong either way. Store it in `app_settings` (instance-wide, the
      image is per instance) with an env override under the `envProvided()`
      rule, default from the running version (a `-canary.N` build defaults to
      `canary`). Canary reads `releases?per_page=…` and takes the newest
      prerelease or release, whichever is higher; compare with real semver
      prerelease ordering. Admin → Settings select, the check's cache keyed by
      channel, paraglide keys in all four locales, a unit test for the
      comparisons, and `docs/deployment.md` (tags table) + `docs/env.md`. Pairs
      with the Privacy item on making the check opt-out.

## Encryption

Plan: `.claude/plans/2026-09-22-encryption.md`. Server-held key at rest only;
per-user keys and E2E rejected there, with reasons.

- [ ] [S] Phase 0: `docs/encryption.md` (+ `docs/config.json` entry) telling
      operators to put `DATA_DIR` on LUKS/ZFS encryption. Covers stolen hardware
      and the DB, which in-app encryption never will.
- [ ] [S] Envelope v1 primitives in TS (`src/lib/server/crypto/envelope.ts`) and
      Go (`internal/envelope`) with shared test vectors (plan step 1).
- [ ] [S] `ENCRYPTION_KEY`/`_FILE`/`_PREVIOUS` and `VOLUME_<NAME>_ENCRYPT`
      config, simple-mode refusal, boot guard on `encryptionKeyId` (steps 2, 6).
- [ ] [M] `EncryptedStorageDriver` decorator with range reads, wired through the
      driver factories and `ctx.encrypted` (step 3).
- [ ] [M] Go executors: loopback `envelope.Serve` for ffmpeg/ffprobe/pdftoppm,
      sealed zips, copy matrix, new `encryptfiles` sweep job, `-decrypt`
      recovery flag (step 4).
- [ ] [S] TS job-spec producers and scan size tolerance via `sealedSize` (step
      5).
- [ ] [S] Encrypted Postgres E2E shard, docs pages, CLAUDE.md gotcha (steps 9,
      10).
