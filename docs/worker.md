# Worker

Penombre offloads CPU- and I/O-heavy byte work to a small Go process rather than
doing it inline in the app's request handlers.

## What it does

The worker generates image, video and PDF thumbnails and audio waveforms, walks
a storage root during a library scan, probes media duration, builds zip archives
for downloads, and copies or deletes bytes for cross-drive transfers and
emptying the trash. The app decides _what_ to do — which rows exist, which files
belong in a zip, which bytes survive a delete — and hands the worker a job with
everything it needs as absolute paths; the worker only touches the filesystem
and reports back.

## Embedded by default

`WORKER_MODE=embedded` (the default) spawns the worker as a child process of the
app itself, on the same container, using the same `DATABASE_URL`. Nothing to
configure — a fresh install runs it out of the box. If the process exits, the
app restarts it automatically with a backoff.

## Running it separately

Set `WORKER_MODE=external` on the app service and run a second container from
the same image with the worker as its entrypoint:

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    environment:
      - WORKER_MODE=external
    # ...

  worker:
    image: orochibraru/penombre:latest
    command: ["/usr/local/bin/penombre-worker"]
    restart: unless-stopped
    healthcheck:
      disable: true
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/penombre
    volumes:
      - storage_data:/data
    depends_on:
      - app
```

Two things the worker container must match exactly, because every job spec
carries **absolute paths** resolved by the app:

- The same storage mount, at the **same path** — `/data` above, and the same for
  every `VOLUME_<NAME>_PATH` the app declares.
- The same `DATABASE_URL`.
- The same `ENCRYPTION_KEY` (or `ENCRYPTION_KEY_FILE`) and
  `ENCRYPTION_KEY_PREVIOUS`, when [encryption](encryption.md) is on. Keys never
  travel in a job; a worker without them fails every job that touches a sealed
  file with `sealed with key <id>, not loaded`, and says so once at startup.

Scale `WORKER_CONCURRENCY` on the worker container independently of the app —
see [Environment variables](env.md#worker) for both variables.

## When no worker is running

Each worker checks in every few seconds. If none has for 30 seconds, the app
stops waiting on it: thumbnails fall back to icons, downloads and emptying the
trash fail with an error instead of hanging, and the log says
`No background worker has checked in` — with `WORKER_MODE=external`, that means
the worker container is not running or cannot reach the database. Nothing is
left half-done: a job that never started is cancelled rather than run later
behind your back.

Right after the app starts, it gives the worker a few minutes to check in before
treating it as missing.

Uploads never wait on the worker. A track or video's duration fills in once the
worker has read it, and a background sweep every minute retries any it missed,
on every drive.

## Restarts

Stopping or restarting the worker never loses track of a copy or an emptied
trash: the worker stops at the next file and reports what it had done, so
Penombre keeps exactly the files that are still there. If the app restarts in
the middle of one, the worker notices within half a minute, stops, and the app
tidies up from the report once it is back: copies that never became visible are
removed (the originals are untouched), and trashed files whose bytes are already
gone leave the trash instead of restoring as broken files. Every job also has a
generous time limit, so one stuck on an unreachable disk fails instead of
hanging the page.

The worker compares time using the database's clock, so it may run on another
host without its clock being in sync.

## What runs first

A person waiting beats background work. Thumbnails someone is looking at and zip
downloads run first, then copies, deletes, scans and duration probes, and
thumbnails generated ahead of time for a freshly scanned library run last — a
big library's backlog never holds up the page you are on.

## SQLite across two containers

Running the worker externally with SQLite means two processes opening the same
database file. This works — SQLite's WAL mode plus a busy timeout handle the
concurrent access — but only when the file sits on **shared local storage** both
containers can see, such as a bind mount or a Docker volume on the same host. Do
not put it on a network filesystem (NFS, SMB, most cloud file shares): WAL
relies on shared memory between processes on one machine, and a network
filesystem cannot provide that. If you need the worker on a different host, use
PostgreSQL instead.
