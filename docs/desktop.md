# Desktop sync

Penombre Sync is a small tray app for macOS, Linux and Windows that keeps
folders on your computer in two-way sync with Penombre. It is built on
[WebDAV and rclone](webdav.md): it does the setup that page describes for you,
then runs the sync on its own.

## What it does

- **Several folders, each to its own place.** Pair any local folder with your
  drive, a shared drive or a volume, whole or one folder in it: `~/Penombre`
  with all of My drive, `~/Documents` with `My drive / Documents`. A folder
  synced by one pair is left out of any pair containing it, so nothing downloads
  twice. Removing a pair stops syncing it; nothing is deleted.
- **Browser sign-in.** Enter your server's address; your browser opens Penombre,
  you check the code matches and approve. The app then creates its own
  [API key](webdav.md#signing-in), named after your computer, and keeps it in
  the system credential store (Keychain, Credential Manager or Secret Service).
  Your password never reaches it. **Sign out** forgets the key on this computer;
  revoke it under **Settings → API keys** to cut the device off.
- **rclone bisync underneath.** Each pair is an `rclone bisync` run, at start,
  every few minutes, on **Sync now** and shortly after local changes settle. The
  key reaches rclone through its environment only, never a configuration file.
- **Junk stays local.** `.DS_Store`, `._*`, `Thumbs.db`, `desktop.ini` and
  similar system files are never uploaded.
- **It tells you what happened.** The app shows whether a sync is running and
  how far along it is, lists the files that failed, retries what can be retried
  and notifies you when something needs you.

Closing the window keeps the app in the tray; quit from the tray menu.

## Requirements

- A Penombre server reachable over HTTPS (or plain HTTP on your own network).
- [rclone](https://rclone.org/install/). The app does not bundle it; Homebrew
  installs it for you.

## Install with Homebrew

On macOS (Apple silicon or Intel) and Linux (x86_64):

```bash
brew install orochibraru/tap/penombre-sync
brew services start penombre-sync
```

`brew services start` launches it now and at every login. Quit it from the tray
and it stays quit until the next login; if it crashes it is restarted. Its log
is `$(brew --prefix)/var/log/penombre-sync.log`. `brew upgrade` brings each new
stable release.

## Download

Every Penombre release on
[GitHub](https://github.com/orochibraru/penombre/releases) carries the app, with
a `.sha256` checksum beside each archive:

| System                | Asset                                           |
| --------------------- | ----------------------------------------------- |
| macOS, Apple silicon  | `penombre-sync-aarch64-apple-darwin.tar.gz`     |
| macOS, Intel          | `penombre-sync-x86_64-apple-darwin.tar.gz`      |
| Linux, x86_64 (glibc) | `penombre-sync-x86_64-unknown-linux-gnu.tar.gz` |
| Windows, x86_64       | `penombre-sync-x86_64-pc-windows-msvc.zip`      |

Stable releases are `vX.Y.Z`; `vX.Y.Z-canary.N` pre-releases carry every merge
before it ships. Unpack the archive and put `penombre-sync` somewhere on your
`PATH`, and rclone on it too.

The builds are not signed. On macOS, Gatekeeper refuses a downloaded binary
until you clear its quarantine flag:

```bash
xattr -d com.apple.quarantine penombre-sync
```

Windows SmartScreen asks once; choose **More info → Run anyway**.

On Linux the tray needs a StatusNotifier host (KDE, and GNOME with the
AppIndicator extension), and the key store needs a Secret Service provider such
as GNOME Keyring or KWallet.

## Build from source

You need Rust 1.98 or newer ([rustup](https://rustup.rs)) and a C toolchain: the
Xcode command-line tools on macOS, the MSVC build tools on Windows, `gcc` on
Linux. Linux needs no other development package: X11, Wayland and OpenGL are
loaded at run time, and D-Bus is spoken in Rust.

```bash
git clone https://github.com/orochibraru/penombre.git
cd penombre/desktop
cargo build --release --locked
```

The binary lands in `desktop/target/release/penombre-sync` (`penombre-sync.exe`
on Windows). A source build reports the version in `desktop/Cargo.toml`; release
builds carry the release's own.
