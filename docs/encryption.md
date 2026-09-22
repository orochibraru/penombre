# Encryption

Penombre can seal file bytes at rest with a key you hold, but start with
disk-level encryption on `DATA_DIR`: for a stolen or decommissioned drive it
covers strictly more, because it also covers the database. Application-level
encryption then adds one thing disk encryption cannot: file bytes that stay
sealed when they are copied off the server.

## What each layer protects

| Someone has                                 | Disk encryption | `ENCRYPTION_KEY`     |
| ------------------------------------------- | --------------- | -------------------- |
| A stolen, powered-off disk (database on it) | files and DB ok | files ok, DB exposed |
| A copy of `STORAGE_PATH` only (NAS, backup) | exposed         | **safe**             |
| Disk, database and the key together         | exposed         | exposed              |
| Root on the running server                  | exposed         | exposed              |

Neither hides sizes, file counts, folder shape or modification times. Names live
in the database, never in the sealed bytes: disk encryption is what protects
them.

## Disk encryption first

By default everything Penombre writes lives under `DATA_DIR` (see
[Storage](storage.md)): file bytes and thumbnails under `STORAGE_PATH`, and the
SQLite database under `DATA_DIR/db`. The database holds names, email addresses,
password hashes, two-factor secrets, API keys and OAuth client secrets, so it
needs the same protection as the files.

Put `DATA_DIR` on an encrypted block device or filesystem before Penombre ever
writes to it:

- **LUKS** (Linux): encrypt the block device the volume is mounted from.
- **ZFS native encryption**: `zfs create -o encryption=on ...`.
- **FileVault** (macOS): whole-disk encryption for a Mac used as a server.
- Your cloud provider's encrypted-volume option, for a mounted cloud disk.

A Postgres database (`DATABASE_URL`) and mounted volumes (`VOLUME_<NAME>_PATH`,
see [Volumes](volumes.md)) live outside `DATA_DIR`: encrypt the disks they sit
on too.

## Sealing file bytes

Set `ENCRYPTION_KEY` to 32 random bytes in base64, on the app and on any
[external worker](worker.md):

```bash
openssl rand -base64 32
```

Or keep it in a file and point `ENCRYPTION_KEY_FILE` at it, which is the
recommended way: a Docker secret mounted outside `DATA_DIR` means a backup of
`/data` never carries its own key.

```yaml
services:
  penombre:
    environment:
      ENCRYPTION_KEY_FILE: /run/secrets/penombre_encryption_key
    secrets:
      - penombre_encryption_key
secrets:
  penombre_encryption_key:
    file: ./encryption.key
```

**Lose the key and every sealed file is gone.** There is no recovery without it.
Back it up the way you back up a password manager's master key, somewhere other
than the backups of `DATA_DIR`.

Every file is sealed with AES-256-GCM under its own random key, which is itself
wrapped by `ENCRYPTION_KEY` and stored in the file's header. Previews,
waveforms, streaming with seeking, zips, shares, public links and office editing
all keep working: the app and the worker decrypt as they read.

### Turning it on for an existing instance

1. Back up `DATA_DIR`, and keep the key out of that backup.
2. Set the key on the app and on any external worker, then restart.
3. New uploads are sealed at once; older files stay readable meanwhile.
4. A background sweep seals the existing files a batch at a time. It needs free
   space for one copy of the largest file. The log reports its progress.
5. Temporary zips in `STORAGE_PATH/.tmp` expire within an hour.

Encryption does not reach back in time: old backups, snapshots and the blocks an
SSD has not reclaimed yet still hold plaintext.

### What it covers

- **Personal and shared drives**: sealed as soon as a key is set, existing files
  included.
- **Mounted volumes**: plaintext by default. `VOLUME_<NAME>_ENCRYPT=true` seals
  what Penombre writes there (uploads, saves, copies, thumbnails). Files already
  on the volume, or dropped in by other tools, are never rewritten. It cannot be
  combined with `VOLUME_<NAME>_READONLY`.
- **Simple mode** is not supported: its root is a library other tools read, and
  sealing it would turn it into ciphertext for them. The app refuses to start
  with both set.

Nothing binds a sealed file to its path: someone with write access to the disk
can swap two sealed files between accounts. Disk encryption and ordinary
filesystem permissions are the answer to that attacker.

### Once it is on

The first boot with a key records its id in the database. From then on the app
refuses to start without a key that can open the files: removing
`ENCRYPTION_KEY`, or replacing it with another one, stops the boot with a
message naming the key it expects.

### Rotating the key

1. Move the current key to `ENCRYPTION_KEY_PREVIOUS` (comma-separated if there
   are several) and set a new `ENCRYPTION_KEY`, on the app and on any external
   worker. Restart.
2. The sweep rewrites each file's header under the new key; the bytes keep their
   own file key. It also moves what Penombre sealed on mounted volumes.
3. Once the log says `ENCRYPTION_KEY_PREVIOUS can be removed`, remove it.

A rotation does not re-encrypt the content: someone who holds both the old key
and an old copy of a file can still read that copy.

### Recovering files without Penombre

The worker binary opens a sealed file on its own, with the same variables:

```bash
ENCRYPTION_KEY_FILE=./encryption.key penombre-worker -decrypt path/to/file > out
ENCRYPTION_KEY_FILE=./encryption.key penombre-worker -encrypt-check /data/storage
```

`-decrypt` writes the plaintext to stdout (plaintext files pass through);
`-encrypt-check` counts plaintext, sealed and unreadable files under a
directory. Neither needs the database, so a copy of `STORAGE_PATH` and the key
are enough to get every file back.

### Performance

AES is hardware accelerated on any recent x86 or ARM server. A Raspberry Pi 4
has no crypto extensions and manages roughly 50 to 100 MB/s, which is felt when
streaming large video.
