# Mounted volumes

A **volume** is a directory mounted alongside the main drive. It appears in the
sidebar as its own entry, is browsable and searchable like any other folder, and
is reconciled with what is actually on disk.

Use one to expose a media library, a NAS share, or an existing folder tree
without copying it into Penombre's own storage root.

## Declaring a volume

Volumes are declared with environment variables, one block per volume, in the
same style as OAuth providers:

| Variable                 | Required | Description                              |
| ------------------------ | -------- | ---------------------------------------- |
| `VOLUME_<NAME>_PATH`     | yes      | Absolute path to the directory           |
| `VOLUME_<NAME>_LABEL`    | no       | What the sidebar shows (default: `NAME`) |
| `VOLUME_<NAME>_READONLY` | no       | `true` refuses every write               |

```env
VOLUME_MEDIA_PATH=/mnt/media
VOLUME_MEDIA_LABEL=Media library
VOLUME_MEDIA_READONLY=false
```

`<NAME>` is uppercase with underscores; it is lowercased and hyphenated to form
the volume's id, so `VOLUME_MEDIA_PATH` gives a volume named `media` at
`/volumes/media`. A block without a `_PATH` is ignored.

Mount the directory into the container as well:

```yaml
volumes:
  - /srv/media:/mnt/media
```

## How a volume is shared

A volume is **one tree, shared by every account**, in both modes — mount a
library and everybody browses the files that are already on it. Nothing is
copied and no per-user subdirectory is created inside your directory.

Its rows belong to one account (the first one ever created), so the same file is
one row no matter who is looking at it; activity still records whoever actually
did something. Pair the mount with `_READONLY` when it is a library rather than
a shared workspace.

For a drive that a _group_ owns rather than a directory you mounted, see
[shared drives](shared-drives.md).

## Browsing one

A volume browses like My Drive: folders open, files preview and download,
uploads land in the folder on screen, and search covers it. It has its own
trash, reached from the **Trash** button on the volume header — trashing a file
on a mount puts it there, not in your personal trash, so anyone with access can
restore it.

Through the API, every `/api/v1/storage/**` endpoint takes an optional `volume`
query parameter naming the volume's id, exactly as `drive` names a shared drive:

```http
GET /api/v1/storage/list?volume=media
GET /api/v1/storage/file/<id>?raw=true&volume=media
```

Without it a call acts on your personal drive — which is why a file on a mount
needs it to be served at all.

## Read-only volumes

`VOLUME_<NAME>_READONLY=true` makes the volume browsable and downloadable but
rejects every write — upload, rename, move, duplicate, trash and delete. The
check lives in the storage service rather than at each route, so an endpoint
added later cannot forget it.

## Scanning

Volumes are written to from outside the app, so the database only matches the
directory if Penombre looks. Two things trigger a scan:

- A background pass every 60 seconds.
- Opening a volume in the UI, which reconciles what that page is about to show.

A scan adds files that appeared, drops rows for files that vanished, re-reads
media whose bytes changed, and builds thumbnails and waveforms as it goes.

It runs **in the background**, so opening a volume never waits for it: the page
lists what is already known and says _Scanning your files_ while a pass is
running, refreshing itself as files are found. Walking a large NAS mount takes
minutes, and holding the page open for all of them looked like a hang.

Opening a volume again within 30 seconds of the last pass does not start another
one.

## What is stored where

## When the mount cannot be read

A volume the container has no rights on answers **503** with "the files on this
drive can't be reached", rather than a generic server error. It means exactly
what it says: the directory is mounted but the process cannot read or write it.
Check the folder's ownership and mode on the host against the user the container
runs as — Penombre runs as uid 1000 in the published image.

Rows in `files` and `folders` carry a `volume_id`. The main drive stores `null`,
which is also what every row created before volumes existed has, so no migration
of existing data is needed. Every storage query filters on both owner and
volume: paths are only unique within a volume, so an unscoped query could
otherwise match a row on the wrong mount.
