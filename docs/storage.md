# Storage

Where Penombre keeps your files.

Files live on the host filesystem at the path configured by `STORAGE_PATH`. The
default is `$DATA_DIR/storage` — `/data/storage`, which maps to a Docker volume
in the bundled `compose.yaml`. Running `bun run dev` outside production instead
writes to `./data/storage` inside the repo, so a dev box needs no `/data` mount.

`DATA_DIR` is the base directory for everything the app writes: the storage root
above and the SQLite database (`$DATA_DIR/db`). Point it somewhere else and both
follow; `STORAGE_PATH` and `DATABASE_URL` still override their own path.

There is nothing to configure beyond that path — Penombre is built for a single
box with a disk attached, not for object storage.

> Running as a shared file browser instead of a multi-user drive? See
> [Simple mode](simple-mode.md) — it changes what lives at `STORAGE_PATH`.

| Variable       | Description                       | Default                   |
| -------------- | --------------------------------- | ------------------------- |
| `DATA_DIR`     | Base directory for all app data   | `/data` (`./data` in dev) |
| `STORAGE_PATH` | Absolute path to the storage root | `$DATA_DIR/storage`       |

To change the storage location, update `STORAGE_PATH` in your `.env` file and
make sure the path is mounted in your container:

```yaml
volumes:
  - /your/host/path:/data/storage
```

## What lives where

File and folder **metadata** (names, paths, sizes, trash state, ownership) lives
in the database. The **bytes** live under `STORAGE_PATH`. A backup needs both:
see [Deployment](deployment.md) for the backup routine.

## Seeing what you use

**Settings → Storage** reports your own usage: total bytes across your live
files, a breakdown by category, how much the trash is still holding, and your
ten largest files. The bar shows your usage against the whole volume — the
lighter segment is everything else on that filesystem, including other users'
files, since Penombre shares one disk between accounts.

Admins get the instance-wide view under **Admin → Storage**: the resolved
storage path, total files and bytes, trashed bytes across all accounts, and a
per-user usage table sorted biggest first.

Both views read aggregates from the database plus one `statfs` call, so they
stay cheap on a large library — nothing walks the object store.

## Using a network share

Anything the container can see as a directory works — an NFS or SMB mount, a ZFS
dataset, an external drive. Mount it on the host and point the volume at it:

```yaml
volumes:
  - /mnt/nas/penombre:/data/storage
```

Penombre needs read/write access and reports free space from that filesystem, so
mount the share before the container starts.

## Syncing with Syncthing

Penombre has no sync client of its own, and isn't going to grow one — a
directory of files is exactly what [Syncthing](https://syncthing.net) already
does well. Point it at the same directory the container mounts:

```yaml
volumes:
  - /srv/penombre/files:/data/storage
```

…then share `/srv/penombre/files` as a Syncthing folder with your laptop or
phone. Files land on disk and Penombre picks them up.

**Use [simple mode](simple-mode.md) for this.** Simple mode re-scans the storage
root every 60 seconds, so anything Syncthing writes shows up in the UI on its
own. In the default drive mode nothing rescans — every file is expected to
arrive through an upload that also wrote its database row — so files dropped in
from outside stay invisible.

Two things to set on the Syncthing side:

- **Ignore the thumbnail cache.** Add `.thumbnails` to the folder's ignore
  patterns — Penombre regenerates it per instance, so syncing it to every device
  is pure waste.
- **Pick a conflict strategy.** Syncthing keeps both sides of a conflict as
  `*.sync-conflict-*` files; Penombre lists them like any other file rather than
  resolving them for you.
