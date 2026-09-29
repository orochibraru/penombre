# WebDAV and sync

Every Penombre tree is served over WebDAV, so the file manager you already use
can mount it and [rclone](https://rclone.org) can keep a local folder in sync
with it. [Penombre Sync](desktop.md), the desktop tray app, sets that up for you
and runs it in the background.

## WebDAV or Syncthing?

Both keep a folder on your computer in step with Penombre; they reach it from
opposite ends.

- **WebDAV** goes through Penombre. It works in every mode, on your own drive,
  on shared drives and on volumes, with encryption on, from anywhere the web
  interface is reachable. Deletes land in the trash and saves become versions.
- **[Syncthing](storage.md#syncing-with-syncthing)** works on the directory
  behind Penombre, on the server itself. It needs [simple mode](simple-mode.md)
  or a [volume](volumes.md), no encryption, and a Syncthing peer on the server.

Start with WebDAV unless you already run Syncthing on that machine.

## Addresses

| Tree             | Address                                         |
| ---------------- | ----------------------------------------------- |
| Your drive       | `https://files.example.com/dav/me/`             |
| A shared drive   | `https://files.example.com/dav/drives/<id>/`    |
| A mounted volume | `https://files.example.com/dav/volumes/<name>/` |

A shared drive's id is the last part of its address in the browser. Items shared
_with_ you are not reachable over WebDAV.

`https://files.example.com/dav/` itself lists every place you can sync to: your
drive, your shared drives and the volumes that are not read-only. Mount it to
see them all in one place.

## Signing in

Create an API key under **Settings → API keys**. Sign in with any user name and
the key as the password. Your account password does not work here, and neither
does two-factor: the key is the credential, so revoke it to cut a device off. A
revoked key keeps working for up to a minute.

## rclone

```bash
rclone config create penombre webdav \
  url=https://files.example.com/dav/me vendor=owncloud \
  user=me pass=YOUR_API_KEY --obscure
```

`vendor=owncloud` matters: it is what makes rclone send each file's modification
time, without which every sync uploads everything again.

Two-way sync, the first run and then every run after it:

```bash
rclone bisync ~/Penombre penombre: --resync
rclone bisync ~/Penombre penombre:
```

Run the second line from cron, a systemd timer or launchd.

### With a graphical client

Every rclone front end reads the same configuration, so the remote created above
shows up in all of them:

- `rclone rcd --rc-web-gui --rc-user=me --rc-pass=CHOOSE_ONE` opens rclone's own
  web interface: browse, upload, rename and delete from its **Explorer**.
- [Rclone UI](https://rcloneui.com) and [RcloneView](https://rcloneview.com) are
  desktop applications on top of rclone, with scheduled sync jobs.

## File managers

- **macOS Finder:** Go → Connect to Server, enter the address.
- **Windows Explorer:** This PC → Map network drive → "Connect to a website",
  enter the address. Windows only sends a password over HTTPS.
- **GNOME Files:** Other Locations, enter `davs://files.example.com/dav/me/`.

## How it behaves

- Deleting sends the item to the trash, where you can restore it.
- Saving over a file keeps it the same file, whether the app writes it directly
  or writes a temporary file and renames it over (the safe save of Word and
  Excel included): its notes, shares and history stay, and its old bytes become
  a version when the folder keeps versions (see
  [File versioning](versioning.md)). With versioning off the old bytes are
  replaced, as an upload would replace them.
- Renames and moves keep the file's notes, versions, stars and shares.
- Names are matched without regard to case, as Penombre's own names are.
- `.DS_Store`, `._*`, `Thumbs.db` and `desktop.ini` are accepted and dropped.

## Limitations

- An upload is held in memory while it is written, so a very large file needs
  that much free memory on the server.
- Copying on the server is not supported. rclone asks for it only when copying
  between two Penombre paths; add `--disable Copy` there.
- Locks are advisory: Finder and Explorer get one, and nothing enforces it.
- Your reverse proxy must pass WebDAV methods (`PROPFIND`, `MKCOL`, `MOVE`,
  `LOCK`) through. See [Reverse proxy](reverse-proxy.md).
