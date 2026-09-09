# Simple Mode

Run Penombre as a bare shared file browser instead of a multi-user drive.

Simple mode is for the "mount a folder, spin up the app, share the link" use
case — a shared NAS folder, a media library, a project's files — where you don't
need per-account drives, sharing links, or a "My Drive" concept. Everyone who
signs in browses the same files.

## Enabling it

Set `SIMPLE_MODE=true` in your environment. That's the only setting — no other
configuration changes.

```ini
SIMPLE_MODE=true
```

## Mount your volume

In simple mode, storage is a single shared root instead of a per-user folder:
whatever you mount at `STORAGE_PATH` (default `/data/storage`) is exactly what
you browse — no generated per-user subfolder to look for.

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    environment:
      - SIMPLE_MODE=true
    volumes:
      - /your/host/path:/data/storage
```

See [Storage](storage.md) for S3-compatible backends — simple mode works the
same way there, with the whole bucket/prefix shared instead of per-user.

## Files already on the volume

Penombre indexes what it finds. Simple mode scans the storage root **on start
and every 60 seconds**, so files that were on the volume before you ever ran
Penombre — or that arrive later over SMB, rsync, a torrent client, whatever —
show up on their own. Files removed from disk drop out of the listing the same
way.

Hidden entries (`.DS_Store`, `.git/…`) and thumbnail caches are skipped. The
scan never rewrites your files: it only reads names and sizes to build the
index, so your folder layout on disk stays exactly as it is.

## Running without PostgreSQL

Point `DATABASE_URL` at a `file:` path and Penombre runs on SQLite instead — no
database server, no second container, one file next to your data:

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    ports:
      - 3000:3000
    restart: unless-stopped
    environment:
      - SIMPLE_MODE=true
      - DATABASE_URL=file:/data/db/penombre.sqlite
      - ORIGIN=http://localhost:3000
      - AUTH_SECRET=change_me
      - ADMIN_EMAIL=admin@example.com
      - ADMIN_PASSWORD=Admin1234!
    volumes:
      - /your/host/path:/data/storage
      - penombre_db:/data/db

volumes:
  penombre_db:
```

That's the whole stack. The database file is created and migrated on first boot.
See [Environment variables](env.md#database) for how the backend is chosen, and
back it up by copying the `.sqlite` file alongside your storage directory.

> PostgreSQL is still the better choice if you run **multiple app instances**
> against one dataset — they can share a database, a SQLite file can't be shared
> safely across containers.

## What changes

- **One shared file tree.** Every account routes to the same storage root and
  the same DB-owned files, so uploads/edits from different logins land in the
  same place instead of separate per-user drives.
- **Trimmed navigation.** Recent, Starred, Shared, Categories, and Sync are
  hidden — just Browse, Trash, and Settings. Trash stays, so an accidental
  delete is still recoverable.

## What doesn't change

- **Auth is still required.** Simple mode isn't anonymous access — it's the same
  login system, just pointed at one shared drive instead of one per account. See
  [Authentication](authentication.md) to configure sign-in, or share one set of
  credentials if you want everyone using the same login.
- **Everything else works as normal**: upload, download, rename, delete, search,
  thumbnails, the mobile app, the API.
