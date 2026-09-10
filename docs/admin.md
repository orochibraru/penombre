# Admin panel

Accounts with the `admin` role get an extra section at `/admin`, reachable from
the user menu. It is hidden entirely when [auth is bypassed](simple-mode.md) —
nobody signs in under bypass, so the shared owner being an admin is an accident
of seeding rather than a person who should reach user management.

The first account created by seeding is the admin. See
[Authentication](authentication.md#initial-admin-account) for how it is set up.

## Dashboard

`/admin` summarises the instance: how many users, files, share links and
activity entries exist, and how many bytes are stored. Below the tiles it shows
the storage bar for the whole volume and a per-user usage table, biggest first.

## Users

`/admin/users` lists every account with its role and ban state. The row menu
can:

- **Make admin / Remove admin** — grant or revoke the `admin` role.
- **Ban / Unban** — a banned user's sessions stop working immediately.
- **Delete** — removes the account. You cannot delete your own account, since
  that would lock the instance out of its own admin panel.

Deleting a user cascades: their files, folders, share links, API keys, passkeys
and activity rows go with them. The bytes under `STORAGE_PATH` are cleaned up on
the next boot.

## Settings

`/admin/settings` holds the instance policy that has no environment equivalent:

- **Security** — require a passkey, require strong passwords, and a minimum
  password length layered on top of the `MIN_PASSWORD_LENGTH` floor.
- **Sign-ups** — whether anyone may create an account unprompted, and an
  optional allow-list of email domains when they may.

Sign-in methods (email/password, OAuth providers) are configured by environment
variable and shown here **read-only**. `config.ts` stays the single source of
truth for those, so the two can never disagree — change them in your `.env` and
restart.

## Storage

`/admin/storage` shows the resolved storage path, instance-wide file and byte
counts, how much the trash is holding across all accounts, and the same per-user
table. See [Storage](storage.md#seeing-what-you-use) for what the numbers mean.

## Activity log

`/admin/activity` is the audit trail: who did what, and when, 100 entries to a
page, newest first.

**It deliberately records no file or folder names.** Each row carries only the
action (`create`, `update`, `delete`, `share`, `rename`), its severity, the
timestamp, and the account that performed it. An admin auditing an instance can
answer "who deleted things last Tuesday" without being handed the contents of
someone else's drive — the log is safe to keep, export and review under GDPR
without it becoming a second copy of everyone's file listing.

Users see their own activity, names included, under **Account → Activity**; that
view is scoped to the person who owns the files.
