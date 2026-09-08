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
