# TODOs

## 🔴 High Priority

### Media Previews
- [x] **Video Thumbnails/Previews** - Extract thumbnail at ~2s mark on upload
  - ✅ ffmpeg-based thumbnail generation already implemented in `thumbnails.ts`
  - ✅ Updated `FilePreview.svelte` to request thumbnails for videos
  - ✅ Graceful fallback to icon if thumbnail generation fails

- [x] **Document Previews (PDF, then DOCX)**
  - ✅ PDF: Added `generatePdfThumbnail` using `pdftoppm` (poppler-utils)
  - ✅ Added `poppler-utils` to Dockerfile for runtime
  - ✅ Updated `FilePreview.svelte` to request thumbnails for PDFs
  - 🔮 Future: DOCX via LibreOffice headless

### Profile Page Improvements
- [ ] **OAuth Password Setup** - Allow users signing in through OAuth to set a password when email signin is also enabled
  - Files: `packages/web/src/routes/(app)/settings/+page.svelte`, Better Auth config
  - Check if user has password set, show "Set Password" form if not
- [ ] **Mobile Nav Injection** - Replace upload button with nav menu on mobile
  - The icon is already different (`MenuIcon`) but does nothing
  - Should open a Drawer with the extra nav items (Recent, My Drive, etc.)
  - Files: `packages/web/src/routes/(app)/+layout.svelte` (see `mobileCreateDrawerOpen`)

### File Operations
- [x] **Fix folder starring** - Folders cannot be starred currently
  - ✅ Added `isStarred` to `updateFolderMeta` function signature
  - ✅ Added `isStarred` to PUT `/storage/folders/folder/:id` validation schema
  - ✅ Updated `onStar` handler in wrapper.svelte to detect folders and call correct endpoint
  - ✅ Updated `listStarredFiles` to also collect starred folders via `collectStarredFolders`

---

## 🟡 Medium Priority

### Sharing Feature
- [ ] **Implement "Share" feature**
  - Generate shareable links with optional expiry and password
  - Public vs authenticated sharing
  - Files to create: `packages/web/src/lib/server/routes/share.ts`
  - DB schema: `shares` table with `fileId`, `token`, `expiresAt`, `password`, `permissions`

### Bulk Downloads
- [x] **Zip file download for multiple items**
  - ✅ When more than 1 file selected, create a zip on-the-fly
  - ✅ Added `POST /storage/objects/download` endpoint
  - ✅ Uses `archiver` for streaming zip creation
  - ✅ Updated `wrapper.svelte` to call bulk download API
- [x] **Download folders as zip**
  - ✅ Recursively zip folder contents
  - ✅ Added `GET /storage/objects/download/folder/:folder` endpoint
  - ✅ Stream response to avoid memory issues
  - ✅ Filters out `.meta.json`, `.keep`, `.thumbnails` from archives

### Folder Uploads
- [x] **Ability to upload entire folders**
  - ✅ Added `webkitdirectory` attribute on file input
  - ✅ Preserve folder structure during upload via `webkitRelativePath`
  - ✅ Added `onFolderUpload` callback to `FileDropZone`
  - ✅ Drag & drop folder support with `webkitGetAsEntry` API
  - ✅ Auto-creates nested folders before uploading files
  - ✅ Updated `upload-dialog.svelte` to handle folder files with paths
  - ✅ Automatically filters out OS-specific system files (`.DS_Store`, `Thumbs.db`, `Icon`, etc.)
  - ✅ Strips root folder name from paths (uploads folder contents, not folder itself)

### Audio Waveforms
- [x] **Generate audio waveforms** - Nice visual feedback for audio files
  - ✅ Added `AUDIO_TYPES` constant and `generateAudioWaveform` using ffmpeg `showwavespic` filter
  - ✅ Updated `generateThumbnail` to handle audio files
  - ✅ Updated `FilePreview.svelte` to display waveform images for audio
  - ✅ Orange waveform (#f97316) on transparent background, cached as WebP

---

## 🟢 Low Priority / Nice-to-Have

### Drag n drop to move
- [ ] **Implement drag-and-drop file moving**
  - Allow dragging files/folders into other folders in the UI
  - Update backend to handle move operations
  - Files: `packages/web/src/lib/components/file/wrapper.svelte`, `packages/web/src/lib/server/routes/storage/objects.ts`

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

