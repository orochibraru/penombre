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

This differs by mode, matching how the main drive already behaves:

- **[Simple mode](simple-mode.md):** the volume is shared whole. Every account
  browses the same tree, exactly like the main storage root.
- **Full mode:** each user gets their own subdirectory of the volume, mirroring
  the per-user layout of the main drive. One mount serves everybody without
  anyone seeing anyone else's files.

## Read-only volumes

`VOLUME_<NAME>_READONLY=true` makes the volume browsable and downloadable but
rejects every write — upload, rename, move, duplicate, trash and delete. The
check lives in the storage service rather than at each route, so an endpoint
added later cannot forget it.

## Scanning

Volumes are written to from outside the app, so the database only matches the
directory if Penombre looks. Two things trigger a scan:

- A background pass every 60 seconds, as the shared owner.
- Opening a volume in the UI, which reconciles that user's own subdirectory —
  needed in full mode, where the background pass only covers one account.

A scan adds files that appeared, drops rows for files that vanished, re-reads
media whose bytes changed, and builds thumbnails and waveforms as it goes.

## What is stored where

Rows in `files` and `folders` carry a `volume_id`. The main drive stores `null`,
which is also what every row created before volumes existed has, so no migration
of existing data is needed. Every storage query filters on both owner and
volume: paths are only unique within a volume, so an unscoped query could
otherwise match a row on the wrong mount.
