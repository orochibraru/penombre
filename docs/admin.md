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

`/admin/users` adds people by email address and lists every account with its
role and ban state. A new account is created with no password: its owner chooses
one at first sign-in. An admin cannot set it for them. The row menu can:

- **Make admin / Remove admin** — grant or revoke the `admin` role.
- **Ban / Unban** — a banned user's sessions stop working immediately.
- **Delete** — removes the account. You cannot delete your own account, since
  that would lock the instance out of its own admin panel.

Deleting a user cascades: their files, folders, share links, API keys, passkeys
and activity rows go with them. The bytes under `STORAGE_PATH` are cleaned up on
the next boot.

## Settings

`/admin/settings` holds the instance policy that has no environment equivalent:

- **Security** — require a passkey, require two-factor authentication, require
  strong passwords, and a minimum password length layered on top of the
  `MIN_PASSWORD_LENGTH` floor.
- **Sign-ups** — whether anyone may create an account unprompted, and an
  optional allow-list of email domains when they may.
- **Email (SMTP)** — host, port, credentials and the from address, used for
  verification emails and invitations. **Send test email** mails the signed-in
  admin using the values currently in the form, saved or not, so a configuration
  can be proven before it is committed.
- **Sign-in methods** — email/password, the emailed sign-in link, the emailed
  one-time code, and the OAuth providers. See
  [Authentication](authentication.md#which-methods-may-be-turned-off) for the
  rules on which of these may be turned off.

Configuration follows one rule: **an environment variable wins when it is set,
otherwise this page governs.** A setting the environment claims is shown
read-only with a note; anything it does not claim is editable here. So removing
`ENABLE_EMAIL_SIGNIN` from your `.env` hands that switch to the admin UI, and
setting it again takes it back.

Several things are read by the auth layer at boot — email sign-in, the
passwordless methods and the OAuth providers — so changing them here takes
effect **after the next restart**. The page says so next to each.

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
