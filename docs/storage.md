# Storage

Where Penombre keeps your files.

Files live on the host filesystem at the path configured by `STORAGE_PATH`. The
default is `/data/storage`, which maps to a Docker volume in the bundled
`compose.yaml`.

There is nothing to configure beyond that path — Penombre is built for a single
box with a disk attached, not for object storage.

> Running as a shared file browser instead of a multi-user drive? See
> [Simple mode](simple-mode.md) — it changes what lives at `STORAGE_PATH`.

| Variable       | Description                   | Default         |
| -------------- | ----------------------------- | --------------- |
| `STORAGE_PATH` | Absolute path to storage root | `/data/storage` |

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

## Using a network share

Anything the container can see as a directory works — an NFS or SMB mount, a ZFS
dataset, an external drive. Mount it on the host and point the volume at it:

```yaml
volumes:
  - /mnt/nas/penombre:/data/storage
```

Penombre needs read/write access and reports free space from that filesystem, so
mount the share before the container starts.
