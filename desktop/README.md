# Penombre Sync

A tray app that keeps a local folder in two-way sync with your Penombre drive.
It signs in to your server, stores an API key in the system credential store
(Keychain, Credential Manager or Secret Service) and runs `rclone bisync`
against the server's WebDAV endpoint (`/dav/me`).

This is an MVP: it proves the idea, it is not packaged.

## Prerequisites

- Rust 1.98 or newer.
- [rclone](https://rclone.org/install/) on `PATH`. The app does not bundle it.

## Run

```bash
cd desktop
cargo run
```

## Signing in

1. Type your server address (`https://files.example.com`, or
   `http://localhost:5173` for a dev server) and press **Sign in**.
2. Your browser opens the server's device page. Check the code matches the one
   shown in the window and approve it.
3. The app trades the approval for a long-lived API key named
   `Penombre Sync on <hostname>`, stores it in the credential store and ends the
   temporary session.

**Sign out** forgets the key locally. It stays valid on the server until you
revoke it there.

## Syncing

Each entry under **Folders** keeps one local folder in step with one place on
the server: your drive, a shared drive or a volume, whole or one folder in it.
The first entry is `~/Penombre`, mirroring your whole drive; **Add folder…**
adds others, `~/Documents` to `My drive / Documents` for example. Removing an
entry only stops syncing it; nothing is deleted on either side.

A folder synced by one entry is left out of any entry containing it, so
`~/Penombre` does not download `Documents` a second time. The first sync of an
entry, and the first after the entries change around it, runs with `--resync`;
later ones don't. A sync runs at start, every five minutes, on **Sync now**, and
five seconds after local changes settle. The key reaches rclone through
environment variables only, never a configuration file or the command line.

System litter never syncs, in either direction: `.DS_Store`, `._*`, `Icon`
files, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `.TemporaryItems`,
`.DocumentRevisions-V100`, `Thumbs.db`, `ehthumbs.db`, `desktop.ini`,
`$RECYCLE.BIN`, Office's `~$` owner files, LibreOffice's `.~lock.*#` and
rclone's own interrupted downloads (`*.<8 hex>.partial`). Changing that list
makes every entry's next sync a `--resync`.

While a sync runs, the **Sync** view shows the entry being synced, overall
progress in bytes and files, and the files in flight. Afterwards it lists the
last twenty files that moved (uploaded, downloaded or deleted, and on which
side) and every file that failed, with rclone's reason.

A file that fails gets an early retry a minute later instead of waiting five
minutes. If it fails again, a desktop notification names it (or counts them),
once; it is not repeated on every run, and a file that syncs again is forgotten,
so a later failure notifies again. On macOS the notification comes through
Script Editor: an app outside a bundle cannot ask for its own.

Every run starts by asking `/api/health`. Any answer below 500 means the server
is up (before setup it redirects); a refused connection, a timeout or a proxy's
5xx means it is down, and then no rclone runs at all: every file would fail,
count toward a notification and could send its pair back to a resync. A pair
that fails is followed by the same check, so an outage in the middle of a run is
not counted as failed files either. While down, a banner in the **Sync** view
shows since when and why, the app asks again every 30 seconds and syncs as soon
as it answers. One notification per outage, from the second failed check on, so
a server restarting in seconds does not raise one.

**Pause syncing**, in the tray menu or the **Sync** view, stops the running
rclone (SIGTERM, then a kill after three seconds) and holds every schedule until
**Resume**, which syncs at once. The pause survives a restart. Quitting stops
rclone the same way; `--recover` picks an interrupted sync up on the next run.

Closing the window keeps the app in the tray. Quit from the tray menu. A second
launch shows the running one instead of starting another.

## Limitations

- rclone is looked for on `PATH`, then in `/opt/homebrew/bin`, `/usr/local/bin`
  and `~/.local/bin`. Anywhere else, launched from Finder or a desktop menu, the
  app does not find it.
- On macOS, notifications cannot be allowed or denied for Penombre Sync itself:
  that needs a `.app` bundle with a `CFBundleIdentifier`. They follow Script
  Editor's notification setting instead.
- A file that fails on every run makes bisync ask for `--resync`, so each
  following run is a resync until the file goes through.
- On a configured start the window shows for one frame before hiding: macOS only
  creates the tray item once a window exists.
- No installer, no signed builds.

## Developing

`bacon run` rebuilds and restarts the app on every change; plain `bacon` runs
clippy the same way. Install it with `cargo install --locked bacon`.

`PENOMBRE_SYNC_SNAPSHOTS=/tmp/snaps cargo test snapshots` renders every state of
the window, light and dark, to PNG files there, without the tray, the network or
rclone.
