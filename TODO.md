# TODOs

- [x] For the settings, admin and account pages instead of replacing the main
      nav with a new one let's use tabs.
- [x] The glass design looks a bit shit, revise it. Make it work for right click
      context menus.
- [x] Regarding styling: add themes to the appearance tab of the settings page
      where user can choose if they want:
  - Mono space or Standard font
  - Rounded corners or boxy
  - Accent color
- [ ] [Feature] OnlyOffice integration (in-browser docs/sheets/presentations
      editing, WOPI), save for once core features are solid
- [x] Users need to be able to change their password.
- [x] The app logo is complete garbage, generate a new svg one. Use it for
      branding on auth and sidebar.
- [x] Grid layout is consistent but ugly AF. Let's redesign it.
- [x] Add E2E tasks to take screenshots of the app with sample media to then
      inject in the app's readme and documentation.
- [ ] Loading preview thumbnails and waveforms is ugly as fuck (only showing alt
      text). Let's use skeletons instead.
- [ ] Admin panel needs to store important app settings: security requirements
      (require passkey, CRUD oauth providers (if one was added from env var
      display as read only with a message), password sign in enabled or not,
      password requirements if it is, allow signups, if allow signups enabled
      add email domain filter (allow signups ending in @tomain.tld))
- [ ] Admin panel needs to be where an admin can invite users via email or
      simply register the user's email so they can complete an onboarding
      process upon signing in. For that to happen change the sign in flow, if
      signing in via email only show the email input. If user is registered and
      email is correct show password field. if user is NOT registered and email
      is correct (set by an admin) redirect user to onboarding flow where they
      can set their password (if login flow enabled). Upon first sign in show
      the user a modal where they can customize the UI (with the UI settings
      from the settings page, with a stepper component and ability to skip)
- [ ] Right click context menu: add color to icons so user can distinguish each
      action from muscle memory instead of looking every time.

## Done this pass

Mounted volumes shipped as **option 3** (full read-write, `volume_id` threaded
through every storage query). See `docs/volumes.md`.

## Follow-ups

- `bun run screenshots` writes to `docs/images/`, but nothing references those
  files yet — the README and docs pages still need the image embeds added.
- Volume scanning runs on a timer as the shared owner, which in full mode only
  covers that account's subdirectory. Every other user reconciles their own when
  they open the volume; a per-user background sweep would need a worker that
  knows the full user list.
- The grid's audio tiles were rendering waveforms, then regressed to the icon
  fallback after a CSS change. Generation and serving are verified working (200,
  `image/webp`); the client-side `onerror` path needs a look.
