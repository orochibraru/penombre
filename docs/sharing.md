# Sharing

Penombre shares a file or folder two ways, and the **Share** dialog has a tab
for each:

- **Link** — a URL carrying an unguessable token. Anyone holding it can open the
  item, subject to the limits you set. Good for people without an account.
- **People** — a grant to named accounts on this instance. It follows the person
  rather than the URL, and is revoked per-person.

Both are available in full mode only. [Simple mode](simple-mode.md) serves one
shared volume to everyone already, so per-item sharing has nothing to add.

Right-click a file or folder (or use the row's ⋯ menu) and choose **Share**.

## Links

The **Link** tab offers three limits, all optional:

| Option        | Default | What it does                                    |
| ------------- | ------- | ----------------------------------------------- |
| Password      | none    | Visitors must type it before they see anything  |
| Expires       | never   | The link stops working after 1, 7 or 30 days    |
| Requires auth | off     | Only signed-in Penombre users may open the link |

The link is created immediately and shown ready to copy. Nothing about the
shared item changes — a share link is an extra door, not a move.

## People

The **People** tab searches accounts on this instance by name or email, and adds
the ones you pick at a permission:

| Permission  | Meaning                     |
| ----------- | --------------------------- |
| Can view    | Read and download           |
| Can edit    | Read, download and change   |
| Full access | Everything, including share |

Searching requires a query: the user directory is not enumerable by typing
nothing, so one account holder cannot list everyone on the instance. You never
appear in your own results.

Re-adding someone at a different permission **replaces** their old grant rather
than stacking a second one, so a person always has exactly one level of access
to a given item. The **×** next to a name revokes it immediately.

Recipients find these items under **Shared → Shared with me**, with who shared
each one and at what permission. Putting an item in the trash stops serving it
to everyone it was shared with, without revoking the grants — restore it and
they have access again.

## Managing links

**Shared** in the sidebar lists every link you own, with its expiry, download
count, and whether it is password-protected or sign-in-only. **Revoke** deletes
the link: the URL 404s from that moment on. There is no undo, and a new link for
the same file gets a new token.

## What a visitor sees

A share URL looks like `https://your-instance/s/<token>`.

- **A shared file** shows its name and size, with a download button. An image,
  video or audio file is also playable on the page itself — no download needed
  to see or hear what was shared.
- **A shared folder** lists its files, each downloadable on its own, plus a
  "Download as ZIP" button for the whole folder. Playable files get a preview
  button that expands in place.
- **A password-protected link** asks for the password first. A correct answer
  sets a cookie scoped to that one link, valid for 12 hours, so the visitor is
  not asked again on every download.
- **An expired link** says so rather than 404ing, so the visitor knows to ask
  you for a new one.

The owner of a link never has to type its password.

## Notes

Any file can carry notes: open it and the panel sits beside the preview, or use
**Notes** in a file's menu for anything that has no preview of its own.

On **audio and video** a note can be pinned to a moment. While the file is
playing, the note box offers the current position — tick it and the note is
stamped with that time. Timestamps in the thread are buttons: clicking one moves
the playhead there, which is what makes this useful for feedback on a mix or a
cut rather than a comment box that happens to sit near a player.

Notes are visible to everyone who can see the file, and each person can edit and
delete their own. They are not shown to visitors holding a share link — a link
is a way to hand somebody a file, not a way into a conversation about it.

## Security notes

- The token is the whole secret: 128 bits from the CSPRNG, unguessable, but
  anyone you send it to can forward it. Add a password for anything sensitive.
- Passwords are hashed with Argon2id. The hash is never returned by the API.
- The unlock cookie is an HMAC over the share id and its password hash, keyed by
  `AUTH_SECRET`. Changing the password invalidates every outstanding unlock.
- The download endpoint re-checks access on every request rather than trusting
  the page that linked to it.
- Expired links stop working immediately; the rows are cleaned up separately.
- Previewing serves the bytes through the same access-checked endpoint as a
  download, with `?inline`. Playing a preview does **not** count against the
  link's download tally — a video that seeks would otherwise record dozens.

## API

Share links are part of the v1 API:

| Method   | Path                  | Description            |
| -------- | --------------------- | ---------------------- |
| `GET`    | `/api/v1/shares`      | List the links you own |
| `POST`   | `/api/v1/shares`      | Create a link          |
| `DELETE` | `/api/v1/shares/{id}` | Revoke a link          |

User-to-user sharing has its own endpoints:

| Method   | Path                             | Description                        |
| -------- | -------------------------------- | ---------------------------------- |
| `GET`    | `/api/v1/users/search?q=`        | Find accounts to share with        |
| `GET`    | `/api/v1/sharings`               | Who a resource is shared with      |
| `POST`   | `/api/v1/sharings`               | Grant accounts access              |
| `DELETE` | `/api/v1/sharings/{id}`          | Revoke one person's access         |
| `GET`    | `/api/v1/sharings/{id}/download` | Download something shared with you |

Creating one takes `resourceType` (`file` or `folder`), `resourceId`, and
optionally `password`, `expiresInDays` and `requiresAuth`. The response includes
the `token` — build the URL as `<origin>/s/<token>`.

Both endpoints require authentication. The public `/s/<token>` page and its
`/s/<token>/download` endpoint do not — that is the point of a share link.
