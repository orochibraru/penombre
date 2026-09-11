# TODO

- [x] Assign colors to docs, sheets and presentations: blue, green and orange.
- [x] Send all uploads to a worker, if page is reloaded doesn't matter bring
      back up the upload modal and continue what could be. when the tab gets
      closed save all in progress first-transfers as "failed".
- [x] When uploading a folder, ask user if they want it in enclosed folder or
      put its contents at the root.
- [x] Upload modal: separate clearly upload files and upload folder.
- [x] Version is always one version late when publishing (docker image 1.8.28
      says it's version 1.8.27). Compute version before starting build jobs and
      inject version in package.json when building docker image.
- [x] Passkey registration is broken.
- [x] Mobile sidenav is transparent
- [x] Replace upload button with nav drawer on mobile. Remove sidenav and put
      its contents in the drawer alongside the upload button.
- [x] Admin page can't be accessed from mobile, add a link in sidenav instead of
      profile.
- [x] Notes for music files should be settable at timestamps. When opening the
      notes tab for music files show the music player and when the user clicks
      on the waveform pause the track, focus the input field. Notes modal isn't
      optimized for mobile, too small.
- [x] Instead of a plain progress bar music player should display the waveform
      (being filled with accent color as the track goes)
- [x] When opening a media file in a new tab, we should have a custom fullscreen
      UI (with notes available) instead of the default browser player.
- [x] On the notes modal the "open in new tab" button is broken.
- [x] The screenshots in the docs aren't linked to anything, add to Readme and
      docs website as a showcase section. Add playwright run to insert all
      supported media types (dummies) in the test instance and screenshot for
      the Readme. Only one image in the readme, as promotion with a link to see
      showcase. Build showcase in docs so we don't have to setup a demo
      instance.
- [x] Scan is fucked in simple mode, doesn't scan on startup.
- [x] Auth pages: remove 50/50 screen split and only display the form with
      aurora behind it. All forms in cards with a proper solid background for
      readability;
