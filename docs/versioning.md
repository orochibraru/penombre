# File versioning

Keep the earlier bytes of a file instead of `final-final-really.wav`.

Versioning is off until an admin turns it on under **Admin → Settings → File
versioning**. From then on every folder keeps versions, unless its own settings
turn it off. It is an instance setting only: there is no environment variable,
and turning it on or off needs no restart.

## What makes a version

A version is the file's bytes as they were just before something replaced them:

- **Uploading a file whose name already exists in the folder.** The upload
  replaces the file instead of creating `name (1).ext`, and the old bytes become
  a version. Names match regardless of case, and a file in the trash does not
  count. A folder that does not version keeps the old behaviour.
- **Upload new version**, in a file's menu, replaces the file with whatever you
  pick, whatever its name.
- **Editing a document, sheet, deck or Office file.** The first save of each
  editing session keeps what the file held before you opened it. Autosave does
  not add a version every two seconds.
- **Save as version**, in the editor, keeps what is on screen right now.
- **Restore** keeps the current bytes as a version before bringing an old one
  back, so a restore never loses anything. The restored version stays listed.

An empty file makes no version, which is also what keeps a fresh upload from
recording its own placeholder.

- **Another program replacing the file** on simple mode's drive or a mounted
  volume (Syncthing, rsync): the next scan keeps the previous bytes. See the
  [FAQ](faq.md#is-a-file-overwritten-by-syncthing-or-rsync-kept-as-a-version)
  for what that covers.

## Merging files into versions

Takes that were saved as separate files (`Song-001.wav`, `Song-002 (1).wav`,
`Song-2026-09-07-23_26_16.wav`) can be folded into one file after the fact.
Select two or more files and choose **Merge as versions** in the selection bar:

- Pick the **order**: by each file's own modification date, or by name, with
  numbers compared as numbers (`-2` before `-10`). The dialog previews the
  result: `v1`, `v2`, … down to the file that stays, last.
- Every file above the last becomes one of its versions in that order, keeping
  its own name and its modification date, and is then removed from the folder.
- The dialog suggests a name for the file that stays, with the take numbers,
  copy suffixes and date stamps removed (`Song.wav`). Change it or keep it; the
  preview shows the rename.
- Notes on the merged files move to the file that stays. Their stars and share
  links are removed with them.
- A merge that would make more versions than the folder keeps is refused rather
  than deleting the oldest takes: raise the folder's limit or pick fewer files.
  A file that already has versions of its own can only be the one that stays.

Folders cannot be merged, and the option is hidden while versioning is off.

If the file that stays already has versions, they take part: the preview lists
them among the new takes, in the order you picked, so an older take merged in
later lands before them instead of on top.

## Taking versions back out

The reverse of a merge. **Extract as file**, on a version's own menu, turns it
back into a file beside its own; **Extract all versions**, on a file that has
some, does it for every one. Each comes out under the name it had (or
`Song v3.wav` for a version that never had its own), made unique, and dated by
its own bytes, so a listing sorted by date shows them in history order. The
bytes move rather than being copied, and the file keeps its current content.

**Download all versions** gives one zip of the whole history, oldest first, then
the current file, numbered so any file manager lists them in that order:
`01 - Song-001.wav`, `02 - Song-002.wav`, `03 - Song.wav`. Every file keeps its
modification date inside the zip.

## Drag and drop

In list and table layouts:

- **Drop a file on another file** to open the merge dialog with both.
- **Drop a file from your computer on a file** to upload it as that file's new
  version, whatever its name.
- **Drag an unfolded version onto another** to move it to that place. The
  versions are renumbered `v1`, `v2`, … in their new order.
- **Drag a version onto its file** to restore it, after confirming.

## Seeing versions

A file with versions shows its current label beside its name (`v3`). In list
layout, click it to unfold the earlier versions right under the file, as
shorter, indented rows led by their label, with the date and who made them.
Click it again to fold them away.

An unfolded version opens like any file: an image, video, PDF or text file
previews, and a track plays in the bottom player with its own waveform, titled
with its version so you can tell takes apart. Versions have no full-screen
viewer, and a document's version previews rather than opening in the editor,
which only ever edits the current file.

While a track plays, the player has a version picker beside the time: switch
takes and playback carries on from the same moment, which is how you compare two
mixes. Image and video previews have the same picker, and a video keeps its
position too.

In grid layout, where a tile has nowhere to unfold, the label opens a **Version
history** window instead, listing every version to open, download, restore or
delete.

Right-click a version, or use its menu, to **Download** it, **Restore** it or
**Delete** it. To replace a file by hand, right-click it and choose **Upload new
version**; in a folder that does not keep versions, the option says so rather
than replacing the file.

Labels are numbers (`v1`, `v2`, …) or the date each version was kept, picked
under **Settings → Display → Version names**. Pruning never shifts them: once
`v1` is pruned, `v2` stays `v2`. Only reordering renumbers.

## How many are kept

The admin sets how many versions each file keeps (10 by default). When a new one
would go past that, the oldest is deleted.

## Folder settings

Right-click a folder and choose **Folder settings**, or use the settings button
in the toolbar while inside it:

- **File versioning**: _Inherit_, _On_ or _Off_. _Inherit_ takes the value of
  the nearest parent folder that sets one, or the admin's switch at the top of
  the drive. The option shows what it currently resolves to.
- **Versions kept per file**: lowers the admin's limit for this folder and the
  folders under it. Blank inherits. A folder can never raise the limit.

A recipient of a shared folder cannot change the shared folder's own settings,
just as they cannot rename it.

## Where they are kept

Versions live beside your files, under a hidden `.versions` directory at the
root of the drive, shared drive or mounted volume. The library scan ignores it.
A new version is a hard link to the old bytes, so keeping one costs no time and
no space until the file is actually replaced. Its thumbnail or waveform is the
one the file already had, linked the same way, so an earlier take is never
rendered twice.

With [encryption](encryption.md) on, versions are sealed like any other file,
and the key rotation sweep rewraps them too.

Versions count toward your usage: **Settings → Storage** lists how much they
hold, and the usage bar includes them.

## Who sees them

Versions follow access to the file:

- **Shared drives**: every member sees, opens and restores versions, and each
  version records the member who made it.
- **Shared with someone**: a recipient with edit access can restore and delete
  versions; one with view access can see, open and download them only.
- **Public links** serve the current file, never an earlier version.
- **Read-only volumes** never make versions, since nothing writes there.

## Through the API

Every route takes the usual `drive`, `volume` or `share` query parameter.

| Method   | Path                                                       | Does                               |
| -------- | ---------------------------------------------------------- | ---------------------------------- |
| `GET`    | `/api/v1/storage/file/{id}/versions`                       | List versions, newest first        |
| `POST`   | `/api/v1/storage/file/{id}/versions`                       | Keep the current bytes as one      |
| `POST`   | `/api/v1/storage/file/{id}/versions/{versionId}/restore`   | Restore a version                  |
| `DELETE` | `/api/v1/storage/file/{id}/versions/{versionId}`           | Delete a version                   |
| `POST`   | `/api/v1/storage/versions/merge`                           | Merge files into one's versions    |
| `PUT`    | `/api/v1/storage/file/{id}/versions/order`                 | Reorder and renumber versions      |
| `POST`   | `/api/v1/storage/file/{id}/versions/extract`               | Turn versions back into files      |
| `GET`    | `/api/v1/storage/file/{id}/versions/zip`                   | Every version as one zip           |
| `GET`    | `/api/v1/storage/file/{id}/versions/{versionId}/raw`       | Its bytes; `download=1` to save    |
| `GET`    | `/api/v1/storage/file/{id}/versions/{versionId}/thumbnail` | Thumbnail, or peaks for audio      |
| `GET`    | `/api/v1/storage/folder/{path}/settings`                   | A folder's settings, and inherited |
| `PUT`    | `/api/v1/storage/folder/{path}/settings`                   | Save them                          |

`{path}` is the folder's id or its path. An upload replaces a file with the same
name only when it creates its rows with `mode: "upload"` in
`POST /api/v1/storage/file/batch`; without it, it still gets `name (1)`. The
upload and Office save routes take `snapshot=0` to write without keeping a
version, which is how the editor's autosave avoids one every two seconds.

## What does not carry versions

- **Duplicate** and **Copy to…** copy the current bytes only.
- **Move** within the same drive keeps the versions. A move to another drive or
  volume is a copy followed by a delete, so the versions stay behind and are
  deleted with the original.
- Deleting a file for good, emptying the trash, or a file deleted from a mounted
  volume deletes its versions as well. A file **renamed or moved** on disk keeps
  them: the scan recognises it (see the
  [FAQ](faq.md#what-happens-when-i-rename-or-move-a-file-on-disk)).
