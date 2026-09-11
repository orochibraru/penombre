# Environment Variables

Configure your Penombre instance with environment variables.

See
[.example.env](https://github.com/orochibraru/penombre/blob/main/.example.env)
for a complete reference.

## Core

General application settings that control the runtime identity, environment
mode, and logging behavior.

`ORIGIN` must be set to the public URL where your instance is accessible. It is
used to generate absolute URLs in OAuth callbacks and email links. In
development this is typically `http://localhost:3000`.

| Variable     | Description                                  | Default                 |
| ------------ | -------------------------------------------- | ----------------------- |
| `APP_NAME`   | Application name (used in UI and emails)     | `Penombre`              |
| `APP_ENV`    | Environment (`dev`/`production`)             | `production`            |
| `ORIGIN`     | Public origin URL (used for OAuth callbacks) | `http://localhost:3000` |
| `LOG_LEVEL`  | `debug`, `info`, `warn`, `error`, `trace`    | `info`                  |
| `LOG_FORMAT` | `console` or `json`                          | `console`               |

## Database

Penombre runs on **SQLite** by default — no database server to install, back up
or keep patched. The Docker image ships pointing at a file inside its data
volume, so a fresh install needs no database configuration at all.

The dialect is picked from the `DATABASE_URL` scheme: a `postgres:`/
`postgresql:` URL runs PostgreSQL, anything else runs SQLite — including an
empty value, which falls back to the default below. With a `file:`/`sqlite:` URL
the rest of the value is the path to the database file, created on first boot.

```ini
# SQLite (default) — no database server needed
DATABASE_URL=file:/data/db/penombre.sqlite

# PostgreSQL (optional)
DATABASE_URL=postgresql://penombre:penombre@localhost:5432/penombre
```

**PostgreSQL is optional.** It is still fully supported and worth the extra
container if you run **multiple app instances** against one database. For a
single container — which is what most self-hosted installs are — SQLite is the
simpler and faster choice.

| Variable       | Description                                          | Default                             |
| -------------- | ---------------------------------------------------- | ----------------------------------- |
| `DATABASE_URL` | SQLite `file:` path, or a Postgres connection string | `file:$DATA_DIR/db/penombre.sqlite` |

## Initial Setup

These variables are only used during the **first-time database seed** to create
the initial admin account. They have no effect after the database has been
initialized and can be removed from your environment afterwards.

There are **no admin credential variables**. The first administrator is created
through the setup screen on first boot — see
[Authentication](authentication.md#initial-admin-account).

## Authentication

Controls how users authenticate. `AUTH_SECRET` must be a long, random string —
you can generate one with `openssl rand -hex 32`. Keep it secret and do not
rotate it without invalidating all existing sessions.

| Variable              | Description                        | Default  |
| --------------------- | ---------------------------------- | -------- |
| `AUTH_SECRET`         | Secret key for signing auth tokens | Required |
| `ENABLE_EMAIL_SIGNIN` | Enable email/password sign-in      | `true`   |
| `ENABLE_OAUTH_SIGNIN` | Enable OAuth sign-in               | `false`  |
| `MIN_PASSWORD_LENGTH` | Minimum password length            | `8`      |

`AUTH_AUTO_REDIRECT_PROVIDER` skips the sign-in screen and sends users straight
to one OIDC provider. See
[Skipping the sign-in screen](authentication.md#skipping-the-sign-in-screen).

| Variable                      | Description                          | Default |
| ----------------------------- | ------------------------------------ | ------- |
| `AUTH_AUTO_REDIRECT_PROVIDER` | Provider name to redirect to on load | /       |

## OAuth Providers (Optional)

Penombre supports any OIDC-compliant provider. Enable OAuth sign-in by setting
`ENABLE_OAUTH_SIGNIN=true` and configuring at least one provider using the
naming pattern `OAUTH_<PROVIDER>_<SETTING>`, where `<PROVIDER>` is an uppercase
identifier of your choice (e.g. `GOOGLE`, `GITHUB`, `POCKET_ID`).

| Variable                         | Description            | Default                |
| -------------------------------- | ---------------------- | ---------------------- |
| `OAUTH_<PROVIDER>_ENABLED`       | Enable this provider   | `true`                 |
| `OAUTH_<PROVIDER>_CLIENT_ID`     | OAuth client ID        | Required               |
| `OAUTH_<PROVIDER>_CLIENT_SECRET` | OAuth client secret    | Required               |
| `OAUTH_<PROVIDER>_DISCOVERY_URL` | OIDC discovery URL     | Required               |
| `OAUTH_<PROVIDER>_PRETTY_NAME`   | Display name in the UI | Provider name          |
| `OAUTH_<PROVIDER>_PKCE`          | Use PKCE               | `true`                 |
| `OAUTH_<PROVIDER>_SCOPES`        | Comma-separated scopes | `openid,profile,email` |

## Redis (Optional)

Penombre includes an in-memory cache for file listings and metadata. By default,
each app instance maintains its own cache in-process. To share the cache across
multiple instances or preserve it across restarts, you can connect an external
Redis server.

When `REDIS_URL` is set, all caching is offloaded to Redis. When it is not set,
caching falls back to an in-process memory cache (production) or is disabled
entirely (development).

| Variable    | Description             | Default |
| ----------- | ----------------------- | ------- |
| `REDIS_URL` | Redis connection string | /       |

## SMTP (Optional)

Required for email features such as password reset and email verification. Set
`SMTP_ENABLED=true` and provide the connection details for your mail server. If
SMTP is disabled, email-dependent features will be unavailable.

| Variable        | Description              | Default             |
| --------------- | ------------------------ | ------------------- |
| `SMTP_ENABLED`  | Enable SMTP              | `false`             |
| `SMTP_HOST`     | SMTP server hostname     | Required if enabled |
| `SMTP_PORT`     | SMTP server port         | `587`               |
| `SMTP_USER`     | SMTP username            | Required if enabled |
| `SMTP_PASSWORD` | SMTP password            | Required if enabled |
| `SMTP_FROM`     | Sender email address     | Required if enabled |
| `SMTP_SECURE`   | Use TLS (`true`/`false`) | `false`             |

## Storage

Everything Penombre writes — uploaded files and the SQLite database — hangs off
one data directory, so a single mounted volume covers a whole install. Set
`DATA_DIR` to move all of it at once, or override a single path on its own. See
[Storage](storage.md) for the full guide.

| Variable       | Description                       | Default                   |
| -------------- | --------------------------------- | ------------------------- |
| `DATA_DIR`     | Base directory for all app data   | `/data` (`./data` in dev) |
| `STORAGE_PATH` | Absolute path to the storage root | `$DATA_DIR/storage`       |

## Simple Mode (Optional)

Turns Penombre into a bare shared file browser: one storage volume shared by
every account instead of a drive per user. See [Simple mode](simple-mode.md) for
the full guide.

`BYPASS_AUTH` removes authentication entirely — see
[No sign-in at all](simple-mode.md#no-sign-in-at-all) before enabling it. It is
ignored unless `SIMPLE_MODE=true`.

| Variable      | Description                            | Default |
| ------------- | -------------------------------------- | ------- |
| `SIMPLE_MODE` | Enable simple mode (`true`/`false`)    | `false` |
| `BYPASS_AUTH` | Disable sign-in, everyone is the owner | `false` |
