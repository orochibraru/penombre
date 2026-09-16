# TODO

- [x] build docker + e2e on merge + rebuild on release = waste of ci and time
- [x] add a pr CI check to ensure the title is semantic to prevent missed
      releases
- [x] The the shared drives management page to /drives/shared, this way it won't
      highlight the "all drives" menu item above shared drives. Make sure we
      know what to do if there are like 200 shared drives. What happens to the
      sidebar? Add a test, truncate when more than 5.
- [x] Ability to move data from a personal drive into a shared drive. Same from
      a mounted volume into a shared drive or a personal drive.
- [x] Ability to copy to another drive
- [x] Quick action to duplicate in context menu
- [x] Remove transparency on context menus
- [x] When something's shared with someone they should be able to access it via
      the normal UI not have to download it. Rename the "shared" page to "My
      links". When someone shares data with someone well first notify them via
      email and in-app notification then display in the sidebar in a category
      called "shared with me"
