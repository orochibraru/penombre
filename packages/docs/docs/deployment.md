# Deployment

Deploy Penombre to production with Docker.

## Requirements

- A Linux server with **Docker** and **Docker Compose** installed
- At least **1 GB of RAM** (more if handling large files)
- A domain name with DNS pointing to your server (for HTTPS)

## Quick start

### 1. Download the environment file

```bash
curl -o .env https://raw.githubusercontent.com/orochibraru/penombre/refs/heads/main/.example.env
```

### 2. Edit the `.env` file

At minimum, set these values:

```bash
ORIGIN=https://cloud.example.com
AUTH_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-strong-password
```

See [Environment variables](env.md) for the full reference.

### 3. Create a `compose.yaml`

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    depends_on:
      db:
        condition: service_healthy
    ports:
      - 3000:3000
    restart: unless-stopped
    volumes:
      - storage_data:/data
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/penombre
    # - REDIS_URL=redis://redis:6379  # Uncomment to enable Redis caching

  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD-postgres}
      - POSTGRES_DB=${POSTGRES_DB-penombre}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test:
        [
          CMD-SHELL,
          "sh -c 'pg_isready -U ${POSTGRES_USER-postgres} -d
          ${POSTGRES_DB-penombre}'",
        ]
      interval: 1s
      timeout: 2s
      retries: 10
      start_period: 3s

  # Optional: uncomment to enable distributed caching with Redis
  # redis:
  #     image: redis:7-alpine
  #     restart: unless-stopped
  #     volumes:
  #         - redis_data:/data
  #     healthcheck:
  #         test: [CMD, redis-cli, ping]
  #         interval: 5s
  #         timeout: 3s
  #         retries: 5

volumes:
  postgres_data:
  storage_data:
  # redis_data:
```

### 4. Start the services

```bash
docker compose up -d
```

Penombre is now running on port **3000**. Sign in with the admin credentials you
set in the `.env` file.

> **Warning** — change the default admin password after your first login. The
> `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables are only used during the initial
> database seed and can be removed afterwards.

## What happens on first start

1. The app waits for PostgreSQL to become healthy (up to 10 retries, 2 seconds
   apart).
2. Drizzle ORM runs all pending database migrations automatically.
3. If no users exist, an admin account is created from `ADMIN_EMAIL` and
   `ADMIN_PASSWORD`.
4. The server starts listening on port 3000.

Migrations run automatically on every startup, including after image upgrades —
no manual steps needed.

## HTTPS

In production, place a reverse proxy in front of Penombre to terminate TLS. See
the [Reverse proxy](reverse-proxy.md) guide for Caddy, Nginx, and Traefik
examples.

When using a reverse proxy, you can remove the `ports` mapping from the `app`
service and let the proxy reach it over a shared Docker network instead.

## Hardening the database

The default Compose file uses `postgres:postgres` as the database credentials.
For production, set custom values in `.env`:

```bash
POSTGRES_USER=penombre
POSTGRES_PASSWORD=a-long-random-password
POSTGRES_DB=penombre
```

Then update the `DATABASE_URL` in `compose.yaml` accordingly:

```yaml
environment:
  - DATABASE_URL=postgresql://penombre:a-long-random-password@db:5432/penombre
```

Remove the `ports: - 5432:5432` mapping from the `db` service unless you need
external database access.

## Persistent storage

Penombre stores uploaded files in the `/data` directory inside the container,
backed by the `storage_data` Docker volume. The PostgreSQL data lives in the
`postgres_data` volume.

Both volumes persist across container restarts and image upgrades. To inspect
them:

```bash
docker volume inspect penombre_storage_data
docker volume inspect penombre_postgres_data
```

## Health check

The container includes a built-in health check that hits `GET /api/health` every
30 seconds. Docker marks the container as unhealthy after 3 consecutive
failures.

```bash
docker inspect --format='{{.State.Health.Status}}' penombre-app-1
```

## Updating

### 1. Back up your instance

```bash
./scripts/backup.sh
```

See [Backup & Restore](backup.md) for details.

### 2. Pull the latest image and recreate the container

```bash
docker compose pull
docker compose up -d
```

Database migrations run automatically on startup — no manual steps required.

## Building from source

If you prefer to build the Docker image yourself:

```bash
git clone https://github.com/orochibraru/penombre.git
cd penombre
docker buildx bake image-local
```

This builds a local image tagged `orochibraru/penombre:latest`. You can set a
custom tag:

```bash
docker buildx bake image-local --set TAG=v1.0.0
```

For multi-platform builds (amd64 + arm64):

```bash
docker buildx bake image-all
```

## Resource tuning

### Upload size

`BODY_SIZE_LIMIT` is set to `Infinity` in the Docker image, so file uploads are
not limited by the app itself. To enforce a limit, configure it at the reverse
proxy level (e.g. `client_max_body_size` in Nginx).

### Database connections

The default connection pool is tuned for small to medium deployments:

| Setting             | Value | Description                          |
| ------------------- | ----- | ------------------------------------ |
| `max`               | 20    | Maximum pool size                    |
| `idleTimeout`       | 30s   | Close idle connections after 30s     |
| `maxLifetime`       | 1800s | Recycle connections every 30 minutes |
| `connectionTimeout` | 10s   | Fail fast if DB is unreachable       |

PostgreSQL's default `max_connections` is 100. If you run multiple replicas,
scale the pool size down accordingly.
