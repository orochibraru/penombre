# Troubleshooting

Solutions to common Penombre issues.

## Startup

### Database not ready after maximum retries

The app retries the database connection 10 times (2 seconds apart) before giving
up.

**Common causes:**

- On SQLite (the default): the directory holding the database file isn't
  writable by the container's `bun` user, or the `/data` volume isn't mounted.
- On PostgreSQL: the server isn't running or hasn't finished starting.
- `DATABASE_URL` is incorrect (wrong path, or wrong host/port/credentials).
- A firewall or network issue is blocking the connection (PostgreSQL only).

**Verify, on SQLite:**

```bash
docker compose exec app ls -l /data/db
```

**Verify, on PostgreSQL:**

```bash
docker compose exec db pg_isready
```

If you added a `db` service, the app should wait for its health check — make
sure the `depends_on` condition is set to `service_healthy`.

### Could not migrate the database. Exiting

Migrations retry 10 times (3 seconds apart) before the process exits. Docker's
`restart: unless-stopped` policy will restart the container automatically.

**Common causes:**

- Another process holds a lock on the database.
- The database user lacks CREATE/ALTER permissions.

**Check migration status:**

```bash
docker compose logs app | grep -i migration
```

### Container keeps restarting

Check the logs for the root cause:

```bash
docker compose logs app --tail 50
```

The most common reasons are a missing `DATABASE_URL`, an unreachable database,
or an invalid `AUTH_SECRET`.

## Authentication

### The setup screen keeps appearing, or never appears

Every URL redirects to `/auth/setup` while the database holds **no accounts**;
as soon as one exists the screen redirects to sign-in instead. So a setup screen
that will not go away means the account was not created — check the app logs for
the failure — and a missing one means an account already exists.

There are no default credentials to fall back on. If you have lost access to the
only account, reset its password through the forgot-password flow (requires
SMTP), or connect to the database directly:

```bash
# SQLite (default)
docker compose exec app bun -e "console.log([...new (require('bun:sqlite').Database)('/data/db/penombre.sqlite').query('select email from user').all()])"

# PostgreSQL
docker compose exec db psql -U postgres -d penombre
```

### OAuth redirect mismatch / callback error

When registering your OAuth application with the provider, the redirect URI must
match exactly:

```text
https://<your-domain>/api/v1/auth/callback/<provider-name>
```

The `<provider-name>` is the lowercase, hyphenated version of the env var
prefix. For `OAUTH_POCKET_ID_*`, use `pocket-id`:

```text
https://cloud.example.com/api/v1/auth/callback/pocket-id
```

Also make sure `ORIGIN` matches your actual public URL — it's used to build the
callback URL.

### Rate limited (HTTP 429)

In production, auth endpoints are rate-limited to **100 requests per 15 minutes
per IP**. API keys have a separate limit of **100 requests per minute per key**.

Wait for the window to reset, or check if a misconfigured client is sending
excessive requests. Rate limiting is disabled when `APP_ENV=dev`.

### Passkeys stopped working after domain change

Passkeys (WebAuthn) are bound to the origin domain. If you change `ORIGIN`, all
existing passkeys become invalid. Users will need to sign in with another method
and register new passkeys from the settings page.

### OAuth error: "At least one OAuth provider must be enabled"

You set `ENABLE_OAUTH_SIGNIN=true` but no providers are fully configured. Each
provider needs at minimum:

```bash
OAUTH_<NAME>_CLIENT_ID=...
OAUTH_<NAME>_CLIENT_SECRET=...
OAUTH_<NAME>_DISCOVERY_URL=...
```

If any of these are missing, the provider is skipped with a warning. Either
complete the configuration or set `ENABLE_OAUTH_SIGNIN=false`.

## Email & SMTP

### Email verification / password reset not working

These features require SMTP. If `SMTP_ENABLED` is `false` (the default), email
verification is skipped on signup and password reset is unavailable.

Enable it and provide all required fields:

```bash
SMTP_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=app-password
SMTP_FROM=noreply@example.com
SMTP_SECURE=false
```

Use `SMTP_SECURE=true` for port 465 (implicit TLS) and `false` for port 587
(STARTTLS).

### SMTP connection refused / authentication failed

- Verify your SMTP host and port are correct.
- Many email providers (Gmail, Outlook) require an **app-specific password**,
  not your regular password.
- Check if your server's IP is blocked by the mail provider.
- Enable debug logging (`LOG_LEVEL=debug`) and check the output for connection
  details.

## File storage

### Uploads fail with permission errors

The `/data` directory inside the container must be writable by the `bun` user.
If you're using a bind mount instead of a Docker volume, make sure the host
directory has the correct permissions:

```bash
# Check current permissions
docker compose exec app ls -la /data

# Fix from the host (if using a bind mount)
sudo chown -R 1000:1000 /path/to/data
```

### Disk full / uploads fail silently

Check available space on the volume hosting `/data`:

```bash
docker compose exec app df -h /data
```

Clean up trashed files or move the storage volume to a larger disk.

### Video or PDF thumbnails not generating

Thumbnail generation requires `ffmpeg` (video) and `poppler-utils` (PDF), both
included in the official Docker image. If you're running outside Docker, install
them:

```bash
# Debian/Ubuntu
sudo apt install ffmpeg poppler-utils

# macOS
brew install ffmpeg poppler
```

Thumbnail failures are logged as warnings but don't block the upload. The file
is still stored successfully.

## Networking & reverse proxy

### ORIGIN mismatch errors

`ORIGIN` must match the exact public URL users access (including scheme and port
if non-standard):

```bash
# Correct
ORIGIN=https://cloud.example.com

# Wrong — trailing slash
ORIGIN=https://cloud.example.com/

# Wrong — HTTP when behind HTTPS proxy
ORIGIN=http://cloud.example.com
```

### Large uploads fail behind a reverse proxy

Penombre sets `BODY_SIZE_LIMIT=Infinity`, but your reverse proxy may enforce its
own limit.

**Nginx** — set `client_max_body_size 0;` to disable the limit:

```nginx
location / {
    client_max_body_size 0;
    proxy_pass http://localhost:3000;
}
```

**Caddy** — has no default body size limit; no change needed.

**Traefik** — increase the buffering middleware limit or disable it.

### 502 Bad Gateway / connection refused

The reverse proxy can't reach the Penombre container. Check that:

- The app container is running: `docker compose ps`
- The container is healthy:
  `docker inspect --format='{{.State.Health.Status}}' <container>`
- The proxy and app are on the same Docker network if both are in containers.
- Port 3000 is correct (the default).

## Debugging

Enable verbose logging to diagnose issues:

```bash
LOG_LEVEL=debug
LOG_FORMAT=json
```

View live logs:

```bash
docker compose logs -f app
```

> **Note** — log format `json` produces structured output that's easier to
> filter with tools like `jq`. Use `console` for human-readable output during
> development.

Check the database directly (PostgreSQL):

```bash
docker compose exec db psql -U postgres -d penombre -c "\dt"
```

Check the health endpoint:

```bash
curl http://localhost:3000/api/health
```
