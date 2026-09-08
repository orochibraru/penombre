# TODOs

## 🔴 High Priority

### Profile Page Improvements

- [ ] **OAuth Password Setup** - Allow users signing in through OAuth to set a
      password when email signin is also enabled
  - Files: `src/routes/(app)/settings/+page.svelte`, Better Auth config
  - Check if user has password set, show "Set Password" form if not
- [ ] **Mobile Nav Injection** - Replace upload button with nav menu on mobile
  - The icon is already different (`MenuIcon`) but does nothing
  - Should open a Drawer with the extra nav items (Recent, My Drive, etc.)
  - Files: `src/routes/(app)/+layout.svelte` (see `mobileCreateDrawerOpen`)

### Drag n drop to move

- [ ] Add a `..` folder at the top of the folder list when moving files to allow
      moving to parent folder easily

### Mobile-only CTA button becomes drawer menu trigger

- [ ] **Make mobile upload button open a drawer menu** instead of having a
      nested side drawer
  - Drawer to include configured submenu for specific pages including it by
    specifying the flag `hasCustomMenu: true` in the page or layout's `load`
    function

---

## 🟡 Medium Priority

### Sharing Feature

- [ ] **Implement "Share" feature**
  - Generate shareable links with optional expiry and password
  - Public vs authenticated sharing
  - Files to create: `src/lib/server/routes/share.ts`
  - DB schema: `shares` table with `fileId`, `token`, `expiresAt`, `password`,
    `permissions`

### Bugs

- [ ] Fix the version being treated as "unknown" and always prompting to update
      when on latest. Instead of using a docker arg, just set it at build time.
      Each build has its version that can't be tempered with.
- [ ] Openapi swagger shouldn't be a separate page, embed the swagger files in
      the UI (just like the docs) within the body.
- [ ] When audio is buffering in the player, show a loader instead of the pause
      button to indicate it's buffering, not stuck.

### Features

- [ ] Simple mode, like Filebrowser but it's just lightweight Penombre via
      mounted volumes
- [ ] Mounted volumes in full mode, appear in the sidenav as extra volumes
- [ ] Curated settings for optimal UX
- [ ] Finish the sharing feature.
- [ ] Storage stats. What's available on the server, what's used, what's left,
      what could be cleaned up.
- [ ] Admin settings, to manage users, storage allowed per user, permissions.

### Nits

- [ ] Since there are only two layout modes, replace the select with a toggle.

### Decisions

- [ ] Drop the "coming soon" sync feature, explain instead how to use Syncthing
      with the app.

---

## 🟢 Low Priority / Nice-to-Have

### Admin Features

- [ ] **Activity log viewer** - Admin panel WITHOUT details (GDPR compliance)
  - Show action type, timestamp, user (no file names or content)
  - Files: `src/routes/(app)/admin/activity/+page.svelte` (new)
  - Existing: `src/lib/server/dto/activity.ts`
- [ ] **Metadata regeneration tool** - Admin tool to regenerate file metadata
      (thumbnails, previews)
  - Files: `src/routes/(app)/admin/metadata/+page.svelte` (new)
  - Backend logic to reprocess files and update metadata in DB

### Office Integration

- [ ] **OnlyOffice Integration** - Edit docs, sheets, presentations in-browser
  - Requires running OnlyOffice Document Server (Docker)
  - WOPI integration, callback handling
  - Deploy OnlyOffice as separate service, integrate via Document Server API
  - **Note:** Major undertaking - save for when core features are solid

- [ ] **Improve file count display in navbar**
  - Use badge component for better aesthetics
  - Files: `src/lib/components/navbar/+fileCount.svelte`
