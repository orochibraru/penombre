# Shared drives

A **shared drive** belongs to a group instead of a person. Everyone on it opens
the same tree, uploads into the same folders, and sees the same trash — unlike
[sharing](sharing.md), where an item stays in its owner's drive and other people
are given a door to it.

Use one for a team's files, a project, or anything that should outlive whoever
happened to upload it.

Full mode only. [Simple mode](simple-mode.md) already serves one drive to
everybody, so a second sharing model on top of it would mean nothing — the page
and the sidebar group are hidden there.

## Creating one

Any signed-in user can create a drive: **Shared drives → All drives** in the
sidebar, then **New shared drive**. The creator owns it, and owning it means
managing it.

Each drive then appears in the sidebar under its own name, and browses exactly
like My Drive: upload, folders, rename, move, preview, notes, documents. The
sidebar lists the first five alphabetically and a **N more** link to the rest;
the drive you have open is always listed. The management page lives at
`/drives/shared`.

## Roles

Members are added by name or email, the same search the Share dialog uses, and
each is given one role:

| Role    | Can do                                                       |
| ------- | ------------------------------------------------------------ |
| Manager | Everything below, plus adding members and renaming the drive |
| Editor  | Read, upload, edit, move, trash and restore                  |
| Viewer  | Read and download only; every write is refused               |

The owner is a manager who cannot be removed, and is the only person who can
delete the drive. Adding someone who is already a member **changes** their role
rather than granting a second one, and anyone may remove themselves from a drive
they no longer want to see.

New members are notified the way a share is; a role change is not news, so it is
silent.

## Moving files in and out

**Move** and **Copy to…** in a file's or folder's menu (and the selection bar)
offer every place you can write to: My Drive, each shared drive where you are
not a viewer, and every writable [mounted volume](volumes.md). A folder travels
with everything under it; its trashed contents stay behind.

A move between two places is a copy followed by deleting the original, and the
original is only deleted once every file has arrived — a partial failure leaves
both copies rather than losing anything. Moving out of a drive needs write
access to it, and nothing can be moved out of a read-only volume (copying out is
fine).

## The trash

Each drive has its own trash, reached from the **Trash** button on the drive
header. Trashing in a shared drive puts the item there, not in the personal
trash of whoever pressed delete — so anybody with write access can restore it.

## Where the files live

Under `STORAGE_PATH/drives/<drive-id>`, one directory per drive, alongside the
per-user directories. Nothing is copied when a drive is created: it starts
empty.

Rows in `files` and `folders` carry `volume_id = drive:<id>`, the same column
[mounted volumes](volumes.md) use, and are owned by the drive's creator. Two
consequences worth knowing:

- Deleting the creator's account deletes the drive and its files with it.
- A drive's bytes count towards the creator's storage usage, not the member's
  who uploaded them.

Activity rows name the person who actually did the thing, not the drive's owner.

## Deleting a drive

**All drives → ⋯ → Delete drive**, owner only. It deletes the drive's files for
everybody and cannot be undone.

## Through the API

Drives are managed under `/api/v1/drives`:

| Method   | Path                                 | What it does                 |
| -------- | ------------------------------------ | ---------------------------- |
| `GET`    | `/api/v1/drives`                     | Drives you own or belong to  |
| `POST`   | `/api/v1/drives`                     | Create one                   |
| `PUT`    | `/api/v1/drives/{id}`                | Rename it                    |
| `DELETE` | `/api/v1/drives/{id}`                | Delete it, owner only        |
| `GET`    | `/api/v1/drives/{id}/members`        | Who is on it                 |
| `POST`   | `/api/v1/drives/{id}/members`        | Add people, or change a role |
| `DELETE` | `/api/v1/drives/{id}/members/{user}` | Remove one person            |

Copying or moving between places is `POST /api/v1/storage/transfer`: the query
names where the items are, the body names the `destination` (`drive`, `volume`
or neither, plus a `folder`) and a `mode` of `copy` or `move`.

Their **contents** are not a separate API. Every `/api/v1/storage/**` endpoint
takes an optional `drive` query parameter, and with it acts on that drive
instead of your own:

```http
GET /api/v1/storage/list?drive=<drive-id>
POST /api/v1/storage/folder?drive=<drive-id>
```

Membership is checked before the handler runs: a drive you are not on answers
`404` (a guessed id must not reveal that it exists), and a write as a viewer
answers `403`.
