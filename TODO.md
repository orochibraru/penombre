# TODOs

## Low effort

- [ ] [Feature] Add a `..` entry to the move-file folder list to jump to the
      parent
- [ ] [Bug] Version always shows "unknown" and prompts to update on latest — set
      it at build time instead of a docker arg
- [ ] [Nit] Embed Swagger UI in-page instead of a separate page
- [ ] [Bug] Show a loader instead of the pause icon while the audio player is
      buffering
- [ ] [Nit] Replace the layout-mode select with a toggle (only two modes exist)
- [ ] [Nit] Use a badge for the file count in the navbar
- [ ] [Decision] Drop the "coming soon" sync banner; document using Syncthing
      instead

## Medium effort

- [ ] [Feature] Let OAuth users set a password when email signin is also enabled
- [ ] [Feature] Replace the mobile upload button with a drawer menu for
      nav/submenu items (configurable via a `hasCustomMenu` flag)
- [ ] [Feature] Mounted volumes appear in the sidenav as extra volumes (full
      mode)
- [ ] [Nit] Curate default settings for a better out-of-box UX
- [ ] [Feature] Storage stats: usage, availability, cleanup candidates
- [ ] [Feature] Admin: activity log viewer (action, timestamp, user — no file
      details, GDPR-safe)
- [ ] [Feature] Admin: metadata regeneration tool (thumbnails/previews)

## High effort

- [ ] [Feature] Sharing: shareable links with expiry & password,
      public/authenticated access, new `shares` DB table
- [ ] [Feature] Admin settings: manage users, storage quotas, permissions
- [ ] [Feature] Backups: S3-compatible target, schedule, ignore patterns
- [ ] [Feature] OnlyOffice integration (in-browser docs/sheets/presentations
      editing, WOPI) — save for once core features are solid
