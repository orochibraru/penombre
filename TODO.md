# TODOs

## Bugs
- [] Fix folder appearing as an option when trying to move offering the option to move into itself

## 🔴 High Priority

### Profile Page Improvements
- [ ] **OAuth Password Setup** - Allow users signing in through OAuth to set a password when email signin is also enabled
  - Files: `packages/web/src/routes/(app)/settings/+page.svelte`, Better Auth config
  - Check if user has password set, show "Set Password" form if not
- [ ] **Mobile Nav Injection** - Replace upload button with nav menu on mobile
  - The icon is already different (`MenuIcon`) but does nothing
  - Should open a Drawer with the extra nav items (Recent, My Drive, etc.)
  - Files: `packages/web/src/routes/(app)/+layout.svelte` (see `mobileCreateDrawerOpen`)
 
### Drag n drop to move
- [ ] **Implement drag-and-drop file moving**
  - Allow dragging files/folders into other folders in the UI
  - Update backend to handle move operations
  - Files: `packages/web/src/lib/components/file/wrapper.svelte`, `packages/web/src/lib/server/routes/storage/objects.ts`

### Bulk move
- [ ] **Implement bulk move functionality**
  - Allow selecting multiple files/folders and moving them to a different folder
  - Update backend to handle bulk move operations
  - Files: `packages/web/src/lib/components/file/wrapper.svelte`, `packages/web/src/lib/server/routes/storage/objects.ts`

### Mobile-only CTA button becomes drawer menu trigger
- [ ] **Make mobile upload button open a drawer menu** instead of having a nested side drawer
  - Drawer to include configured submenu for specific pages including it by specifying the flag `hasCustomMenu: true` in the page or layout's `load` function

---

## 🟡 Medium Priority

### Sharing Feature
- [ ] **Implement "Share" feature**
  - Generate shareable links with optional expiry and password
  - Public vs authenticated sharing
  - Files to create: `packages/web/src/lib/server/routes/share.ts`
  - DB schema: `shares` table with `fileId`, `token`, `expiresAt`, `password`, `permissions`
  
### Sync client
- [ ] **Develop a desktop sync client**
  - Cross-platform (Windows, macOS, Linux)
  - Sync selected local folders with cloud storage
  - Handle file changes, conflicts, deletions
  - Technologies: Electron for UI, Node.js for backend logic
  - Features: Selective sync, bandwidth throttling, auto-start on login

---

## 🟢 Low Priority / Nice-to-Have

### Admin Features
- [ ] **Activity log viewer** - Admin panel WITHOUT details (GDPR compliance)
  - Show action type, timestamp, user (no file names or content)
  - Files: `packages/web/src/routes/(app)/admin/activity/+page.svelte` (new)
  - Existing: `packages/web/src/lib/server/dto/activity.ts`

### Office Integration
- [ ] **OnlyOffice Integration** - Edit docs, sheets, presentations in-browser
  - Requires running OnlyOffice Document Server (Docker)
  - WOPI integration, callback handling
  - Deploy OnlyOffice as separate service, integrate via Document Server API
  - **Note:** Major undertaking - save for when core features are solid

- Prettier file count in navbvar

