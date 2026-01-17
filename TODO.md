# TODOs

## Bugs
- [x] Fix folder appearing as an option when trying to move offering the option to move into itself
  - FIXED: Added `filteredFolders` derived state that excludes the folder being moved and all its children from the folder tree in move-dialog.svelte. Now the folder and its subfolders simply don't appear as destination options.
- [x] When uploading a large amoount of files, getting `PostgresError: Idle timeout reached after 30s` code `ERR_POSTGRES_IDLE_TIMEOUT`
  - SOLUTION IMPLEMENTED: Implemented batch file upload endpoint (POST /storage/objects/batch) that accepts array of files and creates all metadata in one operation with a single activity log entry instead of individual Promise.all calls. Frontend now groups files by folder and sends batches, reducing DB transactions significantly.
- [] Invalidate data when renaming

## 🔴 High Priority

### CI/CD
- [x] Merge pipeline files into one with conditions to reduce maintenance overhead
- [x] Only trigger TS, docker & deployment pipelines based on relevant changes, not MD files for example (unless it's in docs/)
  - IMPLEMENTED: Consolidated typescript.yaml, docker.yaml, and deploy.yaml into single ci.yaml workflow. Added paths-ignore filters to skip runs on markdown files (except docs/), copilot instructions, and LICENSE. TypeScript job runs first, Docker job depends on it, Deploy job only runs on main branch pushes after Docker succeeds.

### Profile Page Improvements
- [ ] **OAuth Password Setup** - Allow users signing in through OAuth to set a password when email signin is also enabled
  - Files: `packages/web/src/routes/(app)/settings/+page.svelte`, Better Auth config
  - Check if user has password set, show "Set Password" form if not
- [ ] **Mobile Nav Injection** - Replace upload button with nav menu on mobile
  - The icon is already different (`MenuIcon`) but does nothing
  - Should open a Drawer with the extra nav items (Recent, My Drive, etc.)
  - Files: `packages/web/src/routes/(app)/+layout.svelte` (see `mobileCreateDrawerOpen`)
 
### Drag n drop to move
- [x] **Implement drag-and-drop file moving**
  - Allow dragging files/folders into other folders in the UI
  - Update backend to handle move operations
  - Files: `packages/web/src/lib/components/file/wrapper.svelte`, `packages/web/src/lib/server/routes/storage/objects.ts`
  - IMPLEMENTED: Added HTML5 drag-and-drop support to all three view modes (list, grid, table). Files and folders can now be dragged onto folders with visual feedback (ring highlight). Backend move endpoints were already in place.

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
- [ ] **Develop a desktop sync client** OR use SyncThing?
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

- Prettier file count in navbvar (using the badge component )
- [x] Custom file icons for docx, xlsx, pptx etc.. & inlude gsuite mimetypes like gsheet, gdoc, gslide
  - IMPLEMENTED: Added Google suite MIME types (application/vnd.google-apps.document/spreadsheet/presentation) to server-side content type detection. Created DocumentIcon.svelte component with color-coded icons for Word (blue), Excel (green), PowerPoint (orange), PDF (red), Google Docs (blue), Google Sheets (green), Google Slides (red). Updated prefix.svelte to display document icons in list/grid/table views using getDocumentType() utility function.
- [x] Calculate folder sizes asynchronously and cache them
  - IMPLEMENTED: Added calculateFolderSize() and calculateFolderSizes() methods to FolderOperations with 5-minute cache TTL. Added GET /storage/folders/size/:id and GET /storage/folders/sizes/:prefix endpoints. Created FolderSize.svelte component that fetches and displays folder sizes asynchronously in table view.
