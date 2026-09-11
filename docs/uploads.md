# Uploads

Uploading is deliberately boring: pick files, they land in the folder you are
browsing. Two things about it are worth knowing.

## Files and folders are separate choices

The upload dialog offers two drop zones, because they do different things to the
resulting tree:

- **Files** — everything you pick lands directly in the folder on screen.
- **Folder** — the whole directory tree is recreated, however deep it goes.

Drag and drop works on either zone; dropping a directory anywhere is treated as
a folder upload.

### Where a folder's contents go

Pick a folder and Penombre asks what to do with the folder itself:

- **Create it here and put everything inside it** (the default) — you get
  `Holiday photos/` in the current folder, with its subfolders under it.
- **Put its contents straight into the current folder** — the enclosing folder
  is dropped and its subfolders are created at this level.

OS bookkeeping files (`.DS_Store`, `Thumbs.db`, `._*`, `.git`, and friends) are
skipped either way.

## Transfers survive a reload

Uploads run in a Web Worker, not on the page, so a large transfer does not
compete with the interface for the main thread — the file list stays responsive
while a multi-gigabyte video goes up.

The queue itself is stored in the browser (IndexedDB), holding the file handles
alongside the server-side rows already created for them. So:

- **Reloading the page does not lose the transfer.** Whatever was in flight is
  picked up again on the next load and the progress panel comes back with it.
- **Closing the tab records the interrupted transfers as failed.** They are
  listed in the progress panel next time you open Penombre, with a retry button,
  rather than quietly disappearing.
- **A file that moved or was deleted on disk in the meantime cannot resume.**
  The browser can no longer read it, so it stays failed and says so.

Up to four files upload at once, and each gets three attempts with a backoff
before it is reported as failed.

> The queue is per browser profile, like any other site storage. It is not
> shared between devices, and clearing site data for your Penombre origin clears
> it. Nothing about it reaches the server: the server only ever sees the
> metadata row and the bytes.

## Limits

There is no built-in file-size cap. What you will hit first is your reverse
proxy's request-body limit — see [Reverse proxy](reverse-proxy.md) for the
`client_max_body_size` equivalent for your proxy — and the free space on the
volume behind [`STORAGE_PATH`](storage.md).
