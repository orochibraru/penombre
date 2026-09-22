# Encryption: threat models, trade-offs and a phased plan

Status: design only.

## TL;DR

- **Phase 0, no code:** document full-disk encryption (LUKS, ZFS native
  encryption, FileVault) for `DATA_DIR`. For a stolen, powered-off box it beats
  anything in-app, because it also covers the SQLite database (names, password
  hashes, 2FA secrets, OAuth client secrets).
- **Phase 1, build it:** at-rest encryption of file bytes with a server-held
  key. Per-file random DEK wrapped by a KEK from the environment, AES-256-GCM in
  a STREAM-style chunked envelope, header inside the file. Most of the work sits
  behind the `StorageDriver` seam; four Go executors change and one is added.
  Nothing user-visible breaks: thumbnails, waveforms, range requests, office
  editing, zips, shares, public links. Earns its place where storage sits on
  something not fully trusted: NAS/SMB, offsite copies, VPS volumes and
  snapshots.
- **Per-user keys derived from a user secret:** not recommended. Breaks
  passkey/OAuth/magic-link/OTP-only users, simple mode, public links, background
  jobs and account recovery, to defeat only "disk + DB + env stolen together".
- **End-to-end:** not worth it. Nearly every feature is a server reading bytes
  (thumbnails, waveforms, durations, zip, office splice, scan). `crypto.subtle`
  does not exist on plain-HTTP instances, and web E2E trusts the server's JS
  anyway. At most, later, an opaque "vault folder" with no previews.
- **Metadata:** names stay plaintext in the DB. Encrypting them breaks search,
  sorting and unique naming. FDE on the database directory is the answer.

## 1. Where bytes are touched today

**TypeScript seam.** Every app-side byte read/write goes through `StorageDriver`
(`services/storage/driver.ts`), implemented only by `LocalStorageDriver`
(`drivers/local.ts`):

- `files.ts`: `writeObject`, `copyObject`, `readObject` in `getRawFileData`,
  `deleteObject`. `uploadFileBody` already buffers the whole body.
- `folders.ts`: move is `listObjectKeys` + `copyObject` + `deleteObject`.
- `proxy.ts`: `getObjectSize` and `getObjectStream(start, end)` for Range.
- `reconcile.ts`: `deleteObject`.
- `/s/[token]/download` and `api/v1/storage/file/[id]/office` go through
  `getRawFileData`, so through `readObject`.

**Bypassing the driver** (absolute paths from `ctx.storagePath`):
`thumbnails.ts` (job source, `Bun.file` on the `.thumbnails` cache), `zip.ts`
(job sources, `streamAndCleanUp` on `.tmp/zips`), `transfer.ts` (copy pairs),
`trash.ts` (delete job), `media.ts` (probe paths), `scan.ts` (scan root,
`existsSync`), `reconcile.ts` (`lstat`).

**Go executors** (`internal/jobs/*`): `thumbnail` (ffmpeg, pdftoppm, PCM peaks),
`mediaprobe` (ffprobe), `ziparchive` (`os.Open` + `io.Copy`), `copyfiles` (raw
`io.Copy`), `deletefiles` (unlink), `scanlist` (walk + size).

**Constraints:**

- Job specs are persisted in `jobs`. Key material never goes in a spec.
- Simple mode rescans `STORAGE_PATH` every minute; `docs/storage.md` recommends
  Syncthing on that directory.
- Mounted volumes are existing libraries read by other tools.
- No content dedupe exists.
- On-disk keys are already `uuid.ext`, so on-disk names leak only the extension.

## 2. Threat models

| Attacker has                              | FDE             | (a) server key         | (b) per-user key | (c) E2E     |
| ----------------------------------------- | --------------- | ---------------------- | ---------------- | ----------- |
| Stolen powered-off disk, DB on same disk  | content + DB ok | content ok, DB exposed | content ok       | content ok  |
| Copy of `STORAGE_PATH` only (NAS, backup) | exposed         | **safe**               | safe             | safe        |
| Disk + DB + env/compose holding the key   | exposed         | exposed                | **safe**         | safe        |
| Root on the running server, passive       | exposed         | exposed                | exposed (online) | safe-ish    |
| Malicious server serving altered JS       | exposed         | exposed                | exposed          | **exposed** |

Always exposed: sizes, counts, tree shape, mtimes, on-disk extensions, and
plaintext already in old backups, snapshots or SSD remnants.

Names live in `files.name`, `folders.name`, `files.tags`, `shares.resourceName`,
`notifications.resourceName`, `file_notes` bodies, and (today, wrongly, see
`TODO.md` Privacy) `activity.message`.

## 3. What breaks under each option

| Feature                           | (a) server key                         | (b) per-user key                            | (c) E2E                              |
| --------------------------------- | -------------------------------------- | ------------------------------------------- | ------------------------------------ |
| Thumbnails, waveforms             | Go decrypts via loopback HTTP          | worker needs user key; only while online    | client renders and uploads encrypted |
| Duration probe                    | Go ffprobe via loopback                | sweep runs with nobody online: fails        | client probes via media metadata     |
| Search (`nameLike`)               | unaffected                             | unaffected unless names encrypted           | client index if names encrypted      |
| Zip                               | Go decrypts, writes encrypted temp zip | key in worker, owner online                 | client-side streaming zip            |
| Range / streaming                 | decrypt only covering chunks           | same, while key cached                      | service worker decrypting ranges     |
| Office editing                    | transparent                            | works while online                          | splice moves to the browser          |
| User shares, shared drives        | transparent                            | wrap DEKs per recipient/member              | same as (b), in the client           |
| Public links                      | transparent                            | link key via query, owner online            | key in fragment, SSR previews break  |
| Mounted volume scan               | volumes plaintext, opt-in for writes   | same                                        | N/A                                  |
| Password reset / recovery         | nothing changes                        | **data loss** without a recovery key        | same                                 |
| Passkey / OAuth / magic-link-only | nothing changes                        | no secret: needs WebAuthn PRF or passphrase | same                                 |
| API keys                          | nothing                                | need own wrapped UMK                        | every client needs crypto            |
| Simple mode                       | refused in Phase 1                     | breaks                                      | breaks                               |
| Plain-HTTP instances              | nothing                                | nothing                                     | **blocked** (no `crypto.subtle`)     |

## 4. Recommendation

1. **Phase 0:** `docs/encryption.md` opens with "use LUKS/ZFS for `DATA_DIR`".
2. **Phase 1:** option (a) for Penombre-owned roots (personal and shared
   drives), per-volume opt-in that encrypts only what Penombre writes,
   background migration, recovery CLI. No new dependencies: AES-256-GCM is in Go
   stdlib and `node:crypto`.
3. **Phase 2:** admin status and rotation UX, "turn encryption off" (decrypt
   sweep), range-streamed public-link downloads (an existing memory issue
   encryption only inherits).
4. **Not planned:** (b), full (c). A client-encrypted "vault" folder kind only
   on demand, HTTPS only, no previews.

**Why not `age`:** ChaCha20-Poly1305 payload needs `x/crypto` in Go and is
uncertain in Bun's `node:crypto`; its symmetric recipient is scrypt (slow per
file by design); random access from JS would be hand-written anyway. A small
STREAM on AES-GCM is ~150 lines per language, stdlib only, hardware-accelerated.
Offline recovery is `penombre-worker -decrypt`. Caveat: Raspberry Pi 4 (no
crypto extensions) does ~50-100 MB/s software AES; the version byte leaves room
for a ChaCha variant.

### Envelope format v1

```text
offset  size  field
0       8     magic "PNMBENC" + version byte 0x01
8       8     key id = HMAC-SHA256(KEK, "penombre/key-id/v1")[0:8]
16      12    wrap nonce (random)
28      48    AES-256-GCM(KEK, DEK[32]) + tag[16], AAD = bytes 0..15
76      ...   chunks: AES-256-GCM(DEK, nonce_i, pt_i), pt_i = 64 KiB (last may be shorter)
              nonce_i = uint88_be(i) || (0x01 if last chunk else 0x00)
```

- Empty file: one final chunk of 0 bytes.
- `sealedSize(pt) = 76 + pt + 16 * max(1, ceil(pt / 65536))`.
- `n = ct - 76; chunks = ceil(n / 65552); pt = n - 16 * chunks`.
- A range read decrypts chunks `floor(start / 64Ki)` to `floor(end / 64Ki)`.
- The last-chunk flag detects truncation.

Design choices:

- **DEK in the header, not the DB.** Go needs no key lookup; copy/move/duplicate
  stay raw byte copies (every write mints a new DEK, files are never patched);
  storage backup + KEK is recoverable without the DB (the scan rebuilds rows).
- **"Is it encrypted?" is sniffing the magic, never a DB column.** Mixed trees
  work during migration and no flag can drift from disk (same "disk is the
  record" rule as `bytesGone()`).
- **Nothing binds ciphertext to its path.** Someone with disk write access can
  swap whole files between users. Out of scope for (a); document it.

### Keys

- `ENCRYPTION_KEY`: 32 random bytes, base64 (`openssl rand -base64 32`), or
  `ENCRYPTION_KEY_FILE` (recommended: a Docker secret outside `DATA_DIR`, so a
  backup of `/data` never contains its own key).
- `ENCRYPTION_KEY_PREVIOUS`: comma-separated old keys, read-only.
- Rotation rewrites only each file's 76-byte header (DEK unchanged). Someone
  holding both the old KEK and an old disk copy can still read it; full
  re-encrypt is Phase 2 on demand.
- Never derived from `BETTER_AUTH_SECRET`: rotating auth would destroy data.
- **Boot guard:** first boot with a key records `encryptionKeyId` in
  `app_settings.settings`. Later boots refuse to start if the key is missing
  while the marker is set, or no current/previous key matches the marker.

### Scope

- **Personal and shared drives** (`STORAGE_PATH/user-*`, `drives/*`): encrypted
  whenever a key is set; existing files migrated by the sweep.
- **Mounted volumes:** plaintext by default. `VOLUME_<NAME>_ENCRYPT=true` means
  "what Penombre writes here is sealed" (uploads, saves, copies in,
  `.thumbnails`). Existing or externally dropped files are **never rewritten**;
  reads sniff; the sweep never walks a volume. `_ENCRYPT` with `_READONLY` is a
  config error.
- **Simple mode + key** is refused at config validation: its root is a library
  other tools read, and sweeping it would turn someone's music folder into
  ciphertext.

## 5. Phase 1 steps

### 1. Envelope primitives, shared test vectors

- `src/lib/server/crypto/envelope.ts` (`node:crypto` aes-256-gcm): `keyId`,
  `sealHeader`, `openHeader`, `sealStream` (TransformStream re-chunking to 64
  KiB), `openRange`, `openWhole`, `sealedSize`, `plainSize`, `isSealed`.
- `internal/envelope/envelope.go` (stdlib): `Keyring`, `Sniff`, `Open` (returns
  `io.ReadSeeker` + plain size), `NewWriter`, `Rewrap`.
- `internal/envelope/serve.go`: `Serve(ctx, rs, size)` on `127.0.0.1:0` with a
  random 128-bit path token via `http.ServeContent`, so ffmpeg/ffprobe get a
  **seekable** input. `pipe:0` fails on moov-at-end MP4s (common phone video).
- `tests/fixtures/envelope-v1.json` (KEK, DEK, nonce, plaintexts of 0 B, 1 B, 64
  KiB, 64 KiB + 1, expected hex), read by `envelope.test.ts` and
  `tests/unit/go/internal/envelope/envelope_test.go`: round-trip, every range
  boundary, truncation rejected, flipped byte rejected, wrong key id is a clear
  error, `plainSize(sealedSize(n)) == n`.

### 2. Configuration

- `config.ts`: `encryption: { key?: Buffer; previous: Buffer[] }` from
  `ENCRYPTION_KEY`/`_FILE`/`_PREVIOUS` (each exactly 32 bytes). `encrypt` on
  `volumeSchema` from `VOLUME_<NAME>_ENCRYPT`. `superRefine` rejects simple mode
  with a key, and `_ENCRYPT` with `_READONLY` or without a key. Export
  `encryptionEnabled()`.
- `config.defaults.ts` commented entries, then `bun run gen:env`.
- `internal/worker/config.go` loads the same variables into an
  `envelope.Keyring`; `cmd/worker/main.go` sets it once at boot. The embedded
  worker already inherits `process.env`.

### 3. Driver decorator

- `drivers/encrypted.ts`: `EncryptedStorageDriver` wrapping the inner driver.
  `writeObject` seals, stages and renames. `readObject` sniffs then opens or
  passes through. `getObjectStream(start, end)` reads the header, pulls only the
  needed chunks lazily (pull-based `ReadableStream`, so `bytes=N-` doesn't
  decrypt the whole tail). `getObjectSize` returns `plainSize`. Everything else
  passes through: a raw ciphertext copy is valid.
- `driver.ts` factories take `encrypt`; `service.ts` sets
  `encrypt = volume ? volume.encrypt : encryptionEnabled()` and exposes
  `ctx.encrypted` (`context.ts`); `drives.ts` `driveVolume()` sets it.
- Result: `proxy.ts`, `files.ts`, `folders.ts`, `reconcile.ts`, the public link
  and office routes need no changes.

### 4. Go executors

- `thumbnail`: sealed sources go through `envelope.Serve`; PDFs to `pdftoppm -`
  on stdin (verify on Alpine's poppler, fallback a 0600 temp file). `Encrypt`
  spec field seals webp/peaks output into the stage file before the rename.
- `mediaprobe`: sealed paths through `envelope.Serve`, result keyed by original
  path.
- `ziparchive`: `envelope.Open` sealed sources; `Encrypt` seals the archive.
- `copyfiles`: `Pair.Encrypt` (destination root encrypted). sealed->sealed raw,
  sealed->plain decrypt, plain->sealed encrypt, plain->plain raw.
- `deletefiles`, `scanlist`: unchanged.
- New `encryptfiles` (type `"encrypt"`, spec `{root, excludes[], budget}`):
  walks the root, skips `.tmp` and excludes, **includes** `.thumbnails`. Plain
  file: seal into `<path>.<jobID>.tmp`, fsync, re-stat source (size, mtime,
  inode), rename only if unchanged. Old-key file: `Rewrap`. Stops at `budget`,
  returns `{sealed, rewrapped, remaining, failed[]}`. Not caller-bound.
- `cmd/worker`: register it; add `-decrypt <file>` and `-encrypt-check <root>`
  flags. `worker.go` timeout `"encrypt": 6h`.
- Tests: copyfiles matrix, encryptfiles (idempotence, stat guard, rewrap),
  thumbnail integration (sealed moov-at-end MP4 via loopback, sealed PDF).

### 5. TS job-spec producers

- `thumbnails.ts`: `plan()` adds `encrypt: ctx.encrypted`; `generateThumbnail`
  reads a sealed cache with `openWhole`.
- `zip.ts`: spec `encrypt: encryptionEnabled()`; `streamAndCleanUp` pipes
  through `openRange` when sealed.
- `transfer.ts`: each pair gets the destination service's `ctx.encrypted`.
- `scan.ts`: `refreshChangedFiles` treats `diskSize === sealedSize(row.size)` as
  unchanged (otherwise every sealed file looks changed every pass and loses
  durations/thumbnails); `insertMissingFiles` takes the plain size from the
  driver when `ctx.encrypted`.

### 6. Boot guard and migration sweep

- `services/encryption.ts`: `assertEncryptionKey()` (rules above, writes the
  marker on first enable, actionable error naming `ENCRYPTION_KEY_PREVIOUS`);
  `startEncryptionSweep()` modelled on `duration-sweep.ts`, timer on
  `globalThis`, enqueues `"encrypt"` at `background` priority with
  `dedupeKey: "encrypt:" + root`, budget 2000, logs progress, stops at 0
  remaining with "ENCRYPTION_KEY_PREVIOUS can be removed".
- `hooks.server.ts` `init()`: `assertEncryptionKey()` right after migrations,
  before the worker starts; `startEncryptionSweep()` beside the duration
  sweeper.
- Worker without a key: jobs on sealed files fail with "sealed with key <id>,
  not loaded (set ENCRYPTION_KEY on the worker)"; one startup warning.

### 7. Schema

No SQL migration. Only `encryptionKeyId?: string` on `AppSettingsData`
(`schema.pg.ts`, shared by both dialects). A `files.encrypted` column is
rejected: every write path would have to maintain it and a crash between rename
and row update makes it lie. Add it in Phase 2 only if an admin view needs SQL
counts.

### 8. Operator migration

1. Back up `DATA_DIR`; keep the key out of that backup.
2. Set `ENCRYPTION_KEY` on the app and any external worker, restart.
3. New writes sealed immediately; old files readable by sniffing.
4. Sweep seals existing files in the background; needs free space equal to the
   largest file.
5. Old zips in `.tmp` age out within an hour.
6. Old backups, snapshots and SSD blocks still hold plaintext.

### 9. E2E within the five-minute budget

- `compose.e2e.yaml`: `ENCRYPTION_KEY: "${E2E_ENCRYPTION_KEY:-}"`.
- `playwright.pg.config.ts` sets it, so the whole Postgres shard runs encrypted
  and SQLite stays plaintext: both paths on every PR.
- One assertion that a file uploaded to the E2E volume without `_ENCRYPT` is
  plaintext on disk.

### 10. Docs and CLAUDE.md

- New `docs/encryption.md`: what it does and doesn't protect (section 2 table),
  FDE first, enabling and key generation, `_FILE` with a Docker secret, "lose
  the key, lose every file", migration and old snapshots, rotation, volume
  semantics, simple mode unsupported, external worker needs the key, recovery
  via `penombre-worker -decrypt`, Raspberry Pi note.
- `docs/config.json`: `{ "slug": "encryption", "icon": "lock" }` after `volumes`
  in Self-hosting.
- `docs/env.md`: "Encryption (Optional)" table, `VOLUME_<NAME>_ENCRYPT` row.
- `storage.md` (Syncthing sees ciphertext), `volumes.md`, `worker.md`,
  `deployment.md` (back up the key separately), `simple-mode.md`,
  `troubleshooting.md` (the boot refusals and "not loaded").
- CLAUDE.md gotcha "Bytes may be sealed; the disk says so": sniffing is the
  truth, DEK in header so raw copies are valid, no key material in job specs,
  scan size tolerance, ffmpeg reads via loopback because `pipe:` is not
  seekable, simple-mode refusal.

## Risks to verify

- `pdftoppm -` on stdin with Alpine's poppler.
- ffmpeg seeking over loopback HTTP for MKV and moov-at-end MP4.
- Bun `ReadableStream` chunk pulls under backpressure on long video seeks (real
  player, `/view`).
- Migration stat-guard window against concurrent uploads (`ponytail:` marked).
- AES throughput on ARM without crypto extensions.
