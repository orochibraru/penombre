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

## Files already on the volume

Penombre indexes what it finds. Simple mode scans the storage root **on start
and every 60 seconds**, so files that were on the volume before you ever ran
Penombre — or that arrive later over SMB, rsync, a torrent client, whatever —
show up on their own. Files removed from disk drop out of the listing the same
way.

Hidden entries (`.DS_Store`, `.git/…`) and thumbnail caches are skipped. The
scan never rewrites your files: it only reads names and sizes to build the
index, so your folder layout on disk stays exactly as it is.

## The whole stack

SQLite is the default, so simple mode needs exactly one container — no database
server, one file next to your data:

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    ports:
      - 3000:3000
    restart: unless-stopped
    environment:
      - SIMPLE_MODE=true
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

The database file is created and migrated on first boot at
`/data/db/penombre.sqlite`. Back it up by copying that file alongside your
storage directory.

> PostgreSQL is optional and still supported — worth it only if you run
> **multiple app instances** against one dataset, since a SQLite file can't be
> shared safely across containers. See [Environment variables](env.md#database).

## What changes

- **One shared file tree.** Every account routes to the same storage root and
  the same DB-owned files, so uploads/edits from different logins land in the
  same place instead of separate per-user drives.
- **Trimmed navigation.** Recent, Starred, Shared, Categories, and Sync are
  hidden — just Browse, Trash, and Settings. Trash stays, so an accidental
  delete is still recoverable. The hidden pages return 404 if you type their URL
  directly.

## What doesn't change

- **Auth is still required by default.** Simple mode isn't anonymous access —
  it's the same login system, just pointed at one shared drive instead of one
  per account. See [Authentication](authentication.md) to configure sign-in, or
  share one set of credentials if you want everyone using the same login. To
  drop sign-in entirely, see [No sign-in at all](#no-sign-in-at-all) below.
- **Everything else works as normal**: upload, download, rename, delete, search,
  thumbnails, the API.

## No sign-in at all

Set `BYPASS_AUTH=true` alongside `SIMPLE_MODE=true` and Penombre stops asking
for a login: every visitor is treated as the shared owner, with full read and
write access to the volume.

```ini
SIMPLE_MODE=true
BYPASS_AUTH=true
```

> **Danger** — this is unauthenticated access. Anyone who can reach the app can
> read, upload and delete everything on the volume. Only run it on a trusted
> network (a LAN, a Tailscale/WireGuard network) or behind your own
> authenticating reverse proxy — see [Reverse proxy](reverse-proxy.md).

`BYPASS_AUTH` is ignored unless `SIMPLE_MODE=true`: without one shared drive
there is no single account for a visitor to be.

The account is the first user in the database — the admin seeded on first boot
from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, the same one simple mode already routes
everyone's storage through.

The sign-in screen redirects home while bypass is on, and the API accepts
requests without a key. The UI drops the account menu too: no avatar in the
header, no profile, admin or sign-out entries — there is no account to manage
when nobody signs in. `/account` and `/admin` return 404 while bypass is on.
Turn `BYPASS_AUTH` off again and the normal login is back, unchanged — the flag
adds no users and changes nothing in the database.
