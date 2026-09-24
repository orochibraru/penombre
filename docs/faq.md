# FAQ

## Is a file overwritten by Syncthing or rsync kept as a version?

Yes, when [file versioning](versioning.md) is on for its folder, on simple
mode's drive and on mounted volumes. Syncthing and rsync never write into the
old file: they write a temporary one and rename it over. Each scan keeps a hard
link to every file's bytes (it costs no space until the file is replaced), so
the old render survives the rename, and the next scan (within a minute, or at
once with **Rescan**) turns it into a version, dated when it was current and
with its waveform. The new file is read again, even a re-render of the same
length that is the same size to the byte.

Where it does not work:

- **A program that writes into the file itself** (`rsync --inplace`, some tools
  rendering straight onto a network share) changes the linked bytes too, so
  there is nothing left to keep. Syncthing and plain rsync are fine.
- **Two replaces between scans**: only the state before the first is kept.
- **A filesystem that refuses hard links** (some network shares): files there
  are re-read but never versioned.
- **Versioning turned on after the fact** starts with the next scan: a file
  replaced before that is only re-read.

Other ways to keep renders:

- **Turn on Syncthing's own file versioning** (Simple or Staggered) for that
  folder on the machine running Penombre. Syncthing then moves each replaced
  file into `.stversions/`, which Penombre does not list.
- **Render with a take number or a date in the name** (Reaper's `$project-001`
  or `$date` wildcards), and fold the takes into one file afterwards with
  [Merge as versions](versioning.md#merging-files-into-versions).
- **Replace the file through Penombre**: drop the new render onto the file, or
  use **Upload new version**.
