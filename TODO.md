# TODOs

- [ ] For the settings, admin and account pages instead of replacing the main
      nav with a new one let's use tabs.
- [ ] The glass design looks a bit shit, revise it. Make it work for right click
      context menus.
- [ ] Regarding styling: add themes to the appearance tab of the settings page
      where user can choose if they want:
  - Mono space or Standard font
  - Rounded corners or boxy
  - Accent color
- [ ] [Feature] OnlyOffice integration (in-browser docs/sheets/presentations
      editing, WOPI), save for once core features are solid
- [ ] Users need to be able to change their password.
- [ ] The app logo is complete garbage, generate a new svg one. Use it for
      branding on auth and sidebar.
- [ ] Grid layout is consistent but ugly AF. Let's redesign it.
- [ ] Add E2E tasks to take screenshots of the app with sample media to then
      inject in the app's readme and documentation.

## Mounted volumes

**Question:** Blocked on a decision, not on effort. `LocalStorageDriver` already
takes an arbitrary absolute root, so pointing one at `/mnt/media` is
mechanically easy. The database is the hard part: `files`/`folders` rows key on
`ownerId` plus a path relative to the user root, and every listing, upload, move
and trash query assumes that single root. Three ways out, in rising cost:

1. **Read-only browse, no DB rows.** A separate listing path that reads the
   filesystem directly. Cheapest, and it fits the common homelab case (mount a
   media library, browse and download it). No upload, rename, move, trash, star,
   search or thumbnails on those volumes.
2. **Read-only browse, scanned into the DB.** Reuse `scanStorage()` per volume
   so search and thumbnails work. Needs a `volumeId` on `files`/`folders` and a
   scan loop per volume, but leaves the write paths alone.
3. **Full read-write volumes.** `volumeId` threaded through every storage query
   and route. Everything works everywhere; largest change by far.

**Answer** ==> Option 3.

---

**Question**: Also undecided: are volumes shared by all users or scoped per
user, and does simple mode (which already mounts one volume at `STORAGE_PATH`)
keep its current behaviour or become "one volume among several"?

**Answer** ==> In simple mode one volume is shared by all users. In full mode
each user has their own. A dir can be mounted in simple mode with no change
required. If a dir is mounted in full mode it should appear in the sidebar as
mounted and scanned just like in simple mode.
