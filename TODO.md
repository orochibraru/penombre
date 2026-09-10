# TODO

- [ ] [Feature] Add document suite integration with
      [Prosekit](https://github.com/prosekit/prosekit). In the "new" button
      dropdown in the sidebar show the possibility to create a document, a
      sheet, a presentation etc...
- [ ] [Feature] File notes: ability to attach notes to any file. For audio and
      video files add the ability to add a note at a specific timestamp (like
      comments on Soundcloud) for feedback and collaboration.
- [ ] [Refactor] Drop admin default credentials dangerously set in env vars and
      default conf. Instead create an admin onboarding flow, new DB = admin
      onboarding where they can set their email and password.
- [ ] [Feature] Ability to multi-select in grid mode.
- [ ] [Feature] Ability to use shift to select a whole set of files with a
      single click in multi select mode.
- [ ] [Bug] Image preview shouldn't trigger a need to scroll. Fit the image to
      the modal viewbox.
- [ ] [Devex] Reduce prek run time, it's too long. Drop svelte check and openapi
      gen, instead of openapi gen on prek run a ci job that checks diff (after
      formatting). If diff changed a new openapi gen is needed, most of the time
      it's not. Drop otherr time-consuming non-critical jobs, find balance for
      the best devex.
