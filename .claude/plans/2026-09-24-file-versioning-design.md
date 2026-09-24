# File versioning — design

Issue #110. Keep earlier bytes of a file instead of `final-final-really.wav`.

## Decisions

- **Triggers:** upload onto an existing name, an explicit **Upload new
  version**, editor saves (one version per editing session), and a manual **Save
  as version** in the editor.
- **Retention:** keep the last N per file; the oldest is pruned when a new one
  lands. Admin sets N (default 10); a folder may lower it, never raise it.
- **Usage:** version bytes count toward the owner's storage, shown as their own
  line.
- **Switches:** admin on/off (default off). When on, every folder versions
  unless its settings turn it off; subfolders inherit the nearest ancestor that
  sets it; a drive root follows the admin.
- **Scope:** personal drives, shared drives and mounted volumes. A read-only
  volume never writes, so never versions.
- **Naming:** a user preference, `v{seq}` or the version's date in the user's
  locale. Current bytes carry a **Latest** pill.
- **Not carried:** Duplicate and cross-place transfer copy current bytes only. A
  cross-place move deletes the source, versions included. Same-place moves keep
  them (the row id is unchanged).

## Rejected

- **Versions as `files` rows** (`version_of` column): every listing, count,
  search, trash and share query would need `version_of is null`, and one miss
  leaks versions into the drive.
- **Content-addressed blob store with dedupe**: no measured need.

## Data

New table `file_versions`, in `schema.pg.ts`, `schema.sqlite.ts` and the
`schema.ts` shim, migrations pg `0029` / sqlite `0021`:

| column         | notes                                       |
| -------------- | ------------------------------------------- |
| `id`           | text PK (UUID), also the byte filename      |
| `file_id`      | FK `files.id`, `on delete cascade`          |
| `seq`          | per file, monotonic; labels survive pruning |
| `size`         | bytes (plaintext size, like `files.size`)   |
| `content_type` | at snapshot time                            |
| `created_by`   | `ctx.actor` id, `on delete set null`        |
| `created_at`   | timestamp                                   |

Index `(file_id, seq)` unique. `seq` is `max(seq)+1` for the file, inside the
snapshot's transaction; the unique index turns a race into a retry, not a
duplicate.

New column `folders.settings`: JSON (`jsonb` / `text({mode:"json"})`), nullable,
`{ versioning?: boolean; maxVersions?: number }`.

`AppSettingsData` gains `versioningEnabled?: boolean` and
`maxVersionsPerFile?: number` (database only, no env var, no migration).

`UserPreferencesData` gains `versionNaming?: "sequential" | "date"`, default
`sequential` — the four places from CLAUDE.md "Adding a user preference".

## Bytes

`<root>/.versions/<fileId>/<versionId>`, `<root>` being the service's root
(personal user root, drive root or volume mount).

- The scan (`isScannable`) and the Go lister already skip dot-directories, so
  version bytes are never imported as files nor counted missing.
- At the root, folder moves (`relocateObjects`) and prefix deletes never see
  them.
- Version files are not dot-named, so the encryption sweep seals and rewraps
  them like any file. A raw copy of a sealed file is a valid sealed file, so a
  snapshot needs no key.

### Snapshot

`snapshot(file)`:

1. `link(<key>, <version path>)`; on `EXDEV` or `EPERM`, a byte copy.
2. Insert the row.
3. Prune past N: delete rows oldest first, then their bytes (ENOENT fine). Rows
   before bytes, or a row points at nothing.

A hard link shares the inode, so the current file must never be written in place
again. `LocalStorageDriver.writeObject` changes to stage and rename: write
`.<basename>.<uuid>.tmp` beside the key, then `rename` over it. The key never
disappears (the scan deletes rows whose bytes vanish) and the version's inode is
never touched. It also means a crashed upload no longer truncates the current
file. The stage name follows the dot-named convention the scan and the sweep
already skip.

### Where it runs

`uploadFileBody(id, body, { snapshot })` is the one choke point; every trigger
ends there. It snapshots only when all hold:

- `snapshot` is not `false`;
- versioning is effective for the file's folder;
- the bytes on disk are non-empty. Not the row's size: a batch placeholder row
  already carries the declared size.

`POST …/versions` calls `snapshot(file)` directly (current bytes, no write).

### Cleanup

Rows go with the file by cascade. Bytes, keyed by the file ids each path already
has:

- `deleteFile`: remove `.versions/<id>/`.
- `deleteFolder`: the same for its `.returning` ids.
- `emptyTrash`: `dropVersionBytes` for the rows it removed, in Node after the
  rows go. Not the Go delete job: that runs before the outcome is known, and
  would take the versions of a file whose own delete failed.
- `reconcileDelete`: the same dirs for the ids it drops.

A stray `.versions/<id>/` left by a crash is unreferenced bytes, never a
resurrected file (the scan skips it). Accepted.

## Effective setting

`effectiveVersioning(ctx, folderPath)` returns `{ enabled, max }`:

- admin off → `{ enabled: false }`, whatever the folders say;
- else the nearest ancestor (the folder itself included) whose `settings` sets
  `versioning`, found with one `where path in (<cumulative prefixes>)` over
  `ownedFolders(ctx)` — works for UUID-chain paths and a mount's real names
  alike;
- no ancestor sets it → enabled;
- `max` = the nearest ancestor's `maxVersions`, clamped to the admin's N.

## Triggers

1. **Upload onto the same name.** `POST /file/batch` gains `mode: "upload"`,
   sent by the upload dialog only. In that mode, when versioning is effective
   and an untrashed sibling matches the name (same case-insensitive rule as
   `getUniqueDisplayName`), the response returns **that row's id** and no row is
   inserted. The upload worker then writes to it and `uploadFileBody` snapshots.
   Create-document, move, duplicate and import keep `name (1).ext`. Reusing the
   row means `files_live_path_idx` is never in play.
2. **Upload new version.** File context action (`fileOnly`), hidden when
   versioning is not effective. A file picker; it queues an ordinary upload job
   onto the existing id, so it is persisted and resumable.
3. **Editor saves.** The first save of an editing session sends `snapshot=1`;
   later autosaves send `snapshot=0`. The upload and office routes take the flag
   (default on). No session column.
4. **Save as version.** Editor button: flush the pending save, then
   `POST …/versions`, which keeps the state on screen.

## API

Contracts in `openapi/v1/storage.ts` (or a new `versions.ts` registered in
`routes.ts`), all with `service: storageServiceFor`, so drive, volume and share
scope apply. Then `bun run gen:api`.

| method | path                                        | does                     |
| ------ | ------------------------------------------- | ------------------------ |
| GET    | `/storage/file/{id}/versions`               | list, newest first       |
| POST   | `/storage/file/{id}/versions`               | snapshot current bytes   |
| POST   | `/storage/file/{id}/versions/{vid}/restore` | restore                  |
| DELETE | `/storage/file/{id}/versions/{vid}`         | delete one               |
| GET    | `/storage/file/{id}/versions/{vid}/raw`     | download                 |
| GET    | `/storage/folder/{id}/settings`             | stored + effective value |
| PUT    | `/storage/folder/{id}/settings`             | save                     |

- `{id}` is `metadata.id`. A version always belongs to `{id}`; a `vid` of
  another file is 404. A folder's `{path}` is its id or its path: the toolbar
  button only knows the path, and on a volume that is real names.
- **Restore** is `uploadFileBody(id, openRawFile(version))`: it snapshots the
  current bytes first, and thumbnails and duration refresh through the existing
  path. The restored version stays listed.
- **Raw** streams through `openRawFile` with Range and spreads
  `rawFileSecurityHeaders()`; active types are `attachment`.
- Mutations go through `assertWritable` and the share scope
  (`assertFileInScope`). Folder settings on a share's root are refused
  (`strict`), like rename.
- The list response carries `seq`, `size`, `createdAt`, the author's name, and
  the current file's `updatedAt`/`size` for the Latest row.

## UI

- **Version history dialog** (`responsive-dialog`), from a `fileOnly` context
  action next to Notes. Top row: current bytes, **Latest** pill. Then each
  version: label, size, author, date; download, restore (confirm), delete
  (confirm).
- **Listing pill**: files with versions show their label (`v8` or the date). The
  count comes with the page, one grouped query over the page's ids.
- **Folder settings dialog**: `folderOnly` context action next to Copy link, and
  a toolbar button in the listing toolbar when a folder is open. Versioning:
  Inherit / On / Off (showing what Inherit resolves to), max versions (≤ admin
  N). Hidden entirely when the admin has versioning off.
- **Admin → Settings**: a versioning card with the switch and N.
- **Settings → Display**: version naming radio.
- **Storage usage**: a "Versions" line.
- i18n keys in all 13 locales.

## Docs

`docs/versioning.md` plus an entry in `docs/config.json`. `docs/storage.md`
links to it and states that versions do not follow a duplicate or a cross-place
copy/move. `docs/admin.md` mentions the switch.

## Tests

- **Unit, real SQLite migrations** (like `jobs.test.ts`):
  - effective setting: admin off, inherit chain, nearest override, clamp;
  - snapshot and prune, `seq` stable after pruning, placeholder skip;
  - cleanup: `deleteFile`, `deleteFolder` and `emptyTrash`'s job spec carry the
    versions dirs.
- **Driver**: `writeObject` stage-and-rename leaves a hard-linked copy intact.
- **E2E** (`versioning.spec.ts`, own folder name): enable in admin, upload the
  same name twice, one row in the listing, history shows v1 and Latest, restore
  swaps them.
