# TODOs

## 🔴 High Priority

### Profile Page Improvements
- [ ] **OAuth Password Setup** - Allow users signing in through OAuth to set a password when email signin is also enabled
  - Files: `packages/web/src/routes/(app)/settings/+page.svelte`, Better Auth config
  - Check if user has password set, show "Set Password" form if not
- [ ] **Mobile Nav Injection** - Replace upload button with nav menu on mobile
  - The icon is already different (`MenuIcon`) but does nothing
  - Should open a Drawer with the extra nav items (Recent, My Drive, etc.)
  - Files: `packages/web/src/routes/(app)/+layout.svelte` (see `mobileCreateDrawerOpen`)

### File Operations
- [ ] **Fix folder starring** - Folders cannot be starred currently
  - The star action exists but may not properly update folder metadata
  - Files: `packages/web/src/lib/server/dto/storage/folder-operations.ts`
  - Need to add `isStarred` toggle for folders via PUT on `/storage/folders/folder/:folder`

---

## 🟡 Medium Priority

### Sharing Feature
- [ ] **Implement "Share" feature**
  - Generate shareable links with optional expiry and password
  - Public vs authenticated sharing
  - Files to create: `packages/web/src/lib/server/routes/share.ts`
  - DB schema: `shares` table with `fileId`, `token`, `expiresAt`, `password`, `permissions`

### Bulk Downloads
- [ ] **Zip file download for multiple items**
  - When more than 1 file selected, create a zip on-the-fly
  - Files: `packages/web/src/lib/server/routes/storage/objects.ts` (add bulk download endpoint)
  - Use `archiver` or Bun's native zip support
- [ ] **Download folders as zip**
  - Recursively zip folder contents
  - Stream the response to avoid memory issues

### Folder Uploads
- [ ] **Ability to upload entire folders**
  - Use `webkitdirectory` attribute on file input
  - Preserve folder structure during upload
  - Files: `packages/web/src/lib/components/layout/dialogs/upload-dialog.svelte`

---

## 🟢 Low Priority / Nice-to-Have

### Admin Features
- [ ] **Activity log viewer** - Admin panel WITHOUT details (GDPR compliance)
  - Show action type, timestamp, user (no file names or content)
  - Files: `packages/web/src/routes/(app)/admin/activity/+page.svelte` (new)
  - Existing: `packages/web/src/lib/server/dto/activity.ts`

---

## ✅ Completed

### Storage Redundancy
- [x] ~~Implement storage redundancy across multiple storage solutions~~
  - ✅ Backup & restore scripts implemented (`backup.sh`, `restore.sh`)
  - 🔮 Future: Multi-storage redundancy (S3, remote FS, etc.)

### Starring Feature
- [x] Star icon display on starred files
- [x] Dynamic "Star/Unstar" context menu action
- [x] Count badges for Starred and Trash in sidebar (desktop only)

### Performance
- [x] **File caching** - Server-side caching for file listings and metadata
  - ✅ In-memory cache with 30s TTL in `packages/web/src/lib/server/dto/storage/cache.ts`
  - ✅ Cache invalidation on all mutations (create/update/delete/move)
  - ✅ Per-user cache isolation
  - 🔮 Future: Redis/unstorage for distributed caching

