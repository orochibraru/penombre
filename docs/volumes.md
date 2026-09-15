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
| `VOLUME_<NAME>_SHARED`   | no       | `true` serves one tree to every account  |

```env
VOLUME_MEDIA_PATH=/mnt/media
VOLUME_MEDIA_LABEL=Media library
VOLUME_MEDIA_READONLY=false
VOLUME_MEDIA_SHARED=true
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

By default this matches how the main drive already behaves:

- **[Simple mode](simple-mode.md):** the volume is shared whole. Every account
  browses the same tree, exactly like the main storage root.
- **Full mode:** each user gets their own subdirectory of the volume
  (`<volume>/user-<id>`), mirroring the per-user layout of the main drive. One
  mount serves everybody without anyone seeing anyone else's files.

### Sharing an existing library in full mode

The per-user split is the wrong shape for a library that is already full of
files: they sit at the root of the mount, and in full mode nobody is looking
there, so the volume opens **empty** and Penombre creates a `user-<id>` folder
inside your media directory.

`VOLUME_<NAME>_SHARED=true` is the fix. The whole tree is then served to every
account, in both modes, exactly as the main drive is in simple mode — no
subdirectory is created and everyone sees the same files.

```env
VOLUME_MEDIA_PATH=/mnt/media
VOLUME_MEDIA_SHARED=true
VOLUME_MEDIA_READONLY=true   # browse a library without letting anyone change it
```

It is off by default on purpose: turning it on in an instance that has been
running with the split would show every account what the others had put on the
mount. Pair it with `_READONLY` when the mount is a library rather than a shared
workspace.

The rows for a shared volume belong to one account (the first one ever created),
so the same file is one row no matter who is looking at it. Activity still
records whoever actually did something.

For a drive that a _group_ owns rather than a directory you mounted, see
[shared drives](shared-drives.md).

## Read-only volumes

`VOLUME_<NAME>_READONLY=true` makes the volume browsable and downloadable but
rejects every write — upload, rename, move, duplicate, trash and delete. The
check lives in the storage service rather than at each route, so an endpoint
added later cannot forget it.

## Scanning

Volumes are written to from outside the app, so the database only matches the
directory if Penombre looks. Two things trigger a scan:

- A background pass every 60 seconds — once for a shared volume, and once per
  account for a per-user one.
- Opening a volume in the UI, which reconciles what that page is about to show.

A scan adds files that appeared, drops rows for files that vanished, re-reads
media whose bytes changed, and builds thumbnails and waveforms as it goes.

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
