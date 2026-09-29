# Penombre mobile app: design

Status: approved in conversation, awaiting written review.

## Intent

A native iOS and Android app for Penombre, from one Kotlin Multiplatform
codebase. What the PWA cannot do is the reason it exists:

- **Offline files.** Pin files and folders, read them with no network, edit them
  offline, upload on reconnect.
- **OS integration.** A Files-app provider on both platforms, "share into
  Penombre", background audio with lock-screen controls.
- **Store presence.** A real app in the App Store and Play Store.

The web app's everyday screens are native. Everything else (editors, admin,
account, settings) is the instance's own web UI in an embedded browser, which
gives full feature parity without rewriting the long tail.

Not a goal: camera-roll auto-backup, native document editing, native admin.

## Decisions

| Question      | Decision                                                   |
| ------------- | ---------------------------------------------------------- |
| Platforms     | iOS and Android from day one                               |
| Framework     | Kotlin Multiplatform + Compose Multiplatform               |
| Rejected      | Capacitor/WebView shell, Dioxus (WebView on mobile), RN    |
| Offline model | Pins; offline edits; last write wins, loser to History     |
| Scope         | Native main screens, embedded browser for the rest         |
| Auth          | Authorization code + PKCE, result is a better-auth session |
| Accounts      | One instance, one account (MVP)                            |
| OS floor      | iOS 17, Android 10 (API 29)                                |

Dioxus was rejected because its mobile renderer is the system WebView and its
native renderer (Blitz) is an HTML/CSS engine still in preview: web weight
without web reuse. Compose Multiplatform for iOS is stable since 1.8.0.

## 1. Native vs. embedded browser

Native:

- **Listings**: home, folder browse, categories, recent, starred, trash; shared
  drives list, drive, drive trash; volumes and their trash; shared with me. One
  listing screen parameterised by location (drive, volume, share), paged on the
  server's keyset cursor, mirroring the server's single `listing.ts`.
- **Search.**
- **File actions**: rename, new folder, move/copy (transfer endpoint), star,
  trash/restore/delete, empty trash, download, make available offline.
- **Upload**: photo picker, camera, Files picker, share sheet; background queue.
- **Viewer**: images (zoom, swipe), video, PDF (PDFKit / `PdfRenderer`),
  text/code read-only.
- **Audio**: mini and full-screen player, waveform scrubber drawn from the peaks
  JSON, timestamped notes on the waveform, background playback.
- **Sharing**: share dialog (public link, share with a user), "My links".
- **Versions**: history list, restore, extract.
- **Offline**: pinned items, readable with no network.
- **App settings**: sign out, offline storage used and its cap, upload over
  Wi-Fi only.

Embedded browser (in-app `WKWebView` / `WebView`, sharing the app's session,
close button back to native): `/edit/*`, `/admin/*`, `/account/*`,
`/settings/*`, `/api-docs`, drive members and settings, version merge, and any
web screen not yet ported.

System browser: sign-in (section 2) and `/s/<token>` public links.

Theme follows the user's saved preferences (accent, corners, font) read from the
preferences API; bordeaux when unset; light/dark follows the system.

## 2. Sign-in and sessions

The app holds one credential: a **better-auth session token**, obtained by an
authorization code grant with PKCE (RFC 8252 pattern), so it appears under
**Account → Sessions** and is revocable there.

1. **Authorize.** The app makes a PKCE verifier/challenge and a `state`, and
   opens
   `https://<instance>/auth/mobile/authorize?code_challenge=…&state=…&redirect_uri=penombre://auth&device=<model>`
   in `ASWebAuthenticationSession` / Chrome Custom Tabs, so passkeys, OAuth and
   an existing browser session work. The page signs in if needed
   (`signInReturningTo`), asks `Sign in Penombre on <model>?`, and on approval
   redirects to `penombre://auth?code=…&state=…`.
2. **Token.** The app POSTs `{ code, code_verifier }` to
   `/api/v1/auth/mobile/token`. The code is single-use, expires in 60 seconds
   and is bound to the challenge. The server creates an ordinary session
   (`internalAdapter.createSession`, user agent `Penombre mobile · <model>`) and
   returns its token plus the signed session cookie value.
3. **Use.** Native calls send `Authorization: Bearer <token>`, which the loaded
   `bearer()` plugin already accepts through `getSession` in `authHandler`. The
   embedded browser gets the same session: the app plants the signed cookie in
   `WKHTTPCookieStore` / `CookieManager`. One session row covers both; one
   revoke kills both.
4. **Revoke.** A revoked session yields 401; the app returns to sign-in and
   keeps local files. Signing out in the app revokes its own session.

Why not better-auth's OAuth provider plugin: its tokens are not sessions, so
they would not appear under Sessions and every route would need a second auth
path.

A custom scheme, not a universal link: a self-hosted domain cannot be in the
app's associated domains. PKCE makes a hijacked redirect useless.

Mobile sessions get a **fixed 90-day sliding lifetime**, set at creation, so a
phone left unused for a week keeps its Files provider working. No env var until
someone asks.

At sign-in the app reads the instance version and refuses anything older than
the release carrying these server changes ("Update your server to X").

## 3. Offline engine

Lives in the shared `core` module: Ktor client, SQLDelight pin store, engine,
upload queue. The app links it on both platforms; so does the iOS File Provider
extension. On iOS the database and bytes live in an App Group container; on
Android the provider runs in-process.

State:

- `pins`: what the user pinned (file or folder, location, server id).
- `items`: every file under a pin (server id, location, path, name, size, server
  `updatedAt`, state `clean | dirty | uploading | failed`).
- Bytes are stored by file id, never by path, so a server-side rename or move is
  a row update.

Refresh, when online: on foreground, from background refresh (`BGAppRefreshTask`
/ WorkManager), and on pull-to-refresh. A pinned folder is listed through a new
**recursive file listing** endpoint (id, path, size, `updatedAt` for every file
under a folder, keyset-paged, one prefix-range query on the existing `path`
indexes, scoped through `ownedFiles`). Rows whose `updatedAt` or size changed
are re-downloaded (background `URLSession` / WorkManager, Range-resumable).
Files gone from the server are dropped locally unless `dirty`.

Offline edits (made in other apps through the Files provider) mark the item
`dirty`. On reconnect it is uploaded to the same file id with
`?base=<updatedAt it was edited from>`:

- Base matches: a normal save.
- Server changed meanwhile: the phone's copy becomes current, the server's copy
  becomes a version (the existing upload-over snapshot).
- Server changed and versioning is off for that file: the server answers 409 and
  the app uploads a sibling `name (<model>).ext`. The server copy is never
  overwritten with nothing kept.

Offline, create/rename/move/delete are refused with a clear error. Online, the
provider performs them directly on the server.

Limits and security:

- A storage cap in settings. A pin that would exceed it is refused; pins are
  never evicted. Unpinned files opened through the provider are system-managed
  cache.
- Bytes on the device are plaintext under OS file protection (iOS
  `completeUntilFirstUserAuthentication`, needed for background refresh; Android
  file-based encryption), including on an `ENCRYPTION_KEY` instance. Documented,
  as for the desktop client.
- A 401 stops the engine; local files, dirty ones included, are kept until the
  user signs back in or removes them.

## 4. Files providers, share, audio

**iOS File Provider** (`NSFileProviderReplicatedExtension`, a Swift shim over
`core`):

- One domain per signed-in account, shown as **Penombre** with top-level **My
  Drive**, **Shared drives/…**, **Volumes/…**, **Shared with me**: the places
  the `/dav` root and the sidebar list.
- Enumerates pinned items from the pin store (offline) and the rest from REST
  listings (online). Thumbnails from the named-size thumbnail endpoint.
- Opening: pinned files from local bytes, others downloaded on demand into
  evictable storage.
- Writes follow section 3. Create, rename, move are online only. Delete means
  trash, as in `/dav`.
- The engine calls `signalEnumerator` after each refresh.

**Android `DocumentsProvider`** (Kotlin, in-process): same roots.
`queryChildDocuments` answers from the pin store, sets `EXTRA_LOADING`,
refreshes online and `notifyChange`s. `openDocument` serves pinned bytes or
downloads to cache; a write-mode open uploads on close.

**Share into Penombre**: an iOS share extension with a native folder picker
(recent destinations, browse), copying items into an App Group inbox; an Android
share-intent activity with the same picker. Both feed the persisted upload queue
in `core`, run on background `URLSession` / WorkManager, and follow the web
uploader's contract: metadata row first, then bytes, `mtime` preserved.

**Background audio**: iOS `AVPlayer` with a playback session,
`MPNowPlayingInfoCenter`, `MPRemoteCommandCenter`; Android Media3 ExoPlayer in a
`MediaSessionService`. Streams the raw endpoint with the bearer session, or
plays local bytes for a pinned track. The playhead carries between mini and
full-screen players.

## 5. Repo, tooling, CI, release

- `mobile/` at the repo root, its own Gradle KMP project (as `desktop/` is its
  own Cargo project). Modules: `core` (no UI), `ui` (Compose screens), the
  Android app (with provider and share activity), and an Xcode project with
  three targets: app, File Provider extension, share extension.
- JDK pinned in `mise.toml` and CI alike; Gradle through its wrapper; Xcode
  version pinned in the workflow.
- API models and a thin Ktor client generated at build time from the committed
  `openapi.json`; output gitignored.
- Strings: `scripts/gen-mobile-strings.ts` converts `messages/*.json` into
  Compose resources for all 13 locales (placeholders to positional args,
  paraglide plural `match` arms to `<plurals>` quantities). Mobile strings are
  added to `messages/*.json`, so the `i18n` hook covers them.
- prek hooks: `format-kotlin` (ktfmt, pre-commit), `test-mobile`
  (`./gradlew :core:jvmTest`, pre-push). CI calls them by id.
- CI: `mobile.yaml`, called from `pull_request.yaml` when `mobile/`,
  `openapi.json` or `messages/` change: Android build and `test-mobile` on
  Ubuntu; unsigned iOS simulator build on macOS only when `mobile/` changed.
- Release, desktop-shaped: every canary attaches a signed APK to the GitHub
  release, plus Play internal track and TestFlight once store accounts exist;
  stable goes to Play production and App Store review via fastlane. The version
  is stamped at build. Needs an Apple Developer account, a Play Console account,
  an Android keystore and an App Store Connect API key.
- Docs: `docs/mobile.md` and a `docs/config.json` entry; CLAUDE.md gets the
  gotchas as they are learned.

## Server changes

All ship with the server, with tests and docs:

1. `/auth/mobile/authorize` page and `POST /api/v1/auth/mobile/token` (contract,
   rate limit), pending codes stored hashed with challenge, user and expiry (the
   `verification` table or a new one).
2. 90-day sliding lifetime for sessions created by the token endpoint.
3. Minimum-version check readable by the app (existing version, if exposed;
   otherwise a field on an existing public endpoint).
4. Recursive file listing under a folder, keyset-paged, scope-respecting.
5. `base` parameter on the file upload route: match, version-on-mismatch, 409
   when versioning is off.

## Testing

- `core` on the JVM: refresh diffing, conflict rules, upload-queue resume, PKCE,
  against Ktor `MockEngine`.
- Server (`bun test`): token endpoint (single use, expiry, verifier mismatch),
  session lifetime, recursive listing scope (drive, volume, share), upload
  `base` including the 409.
- One Playwright spec for the authorize page.
- No native UI test harness in the MVP.

## Risks and first spikes

1. **Kotlin/Native in the iOS File Provider extension** under its memory cap.
   Fallback: the extension enumerates in Swift over REST and shares only the
   SQLite pin store.
2. **Planting the signed session cookie** in both WebViews and having
   better-auth accept it; confirm before building screens on it.
3. **App Store 4.2** ("minimum functionality") for a partly web app: the
   provider, share extension, offline mode and background audio are the native
   case; confirm on the first TestFlight review.
