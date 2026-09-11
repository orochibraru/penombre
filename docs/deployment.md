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
```

See [Environment variables](env.md) for the full reference.

### 3. Create a `compose.yaml`

Penombre runs on SQLite by default, so the production stack is one container:

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    ports:
      - 3000:3000
    restart: unless-stopped
    volumes:
      - storage_data:/data
    env_file: .env
    # environment:
    #   - REDIS_URL=redis://redis:6379  # Uncomment to enable Redis caching

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
  storage_data:
  # redis_data:
```

The `storage_data` volume holds both the database (`/data/db`) and your files
(`/data/storage`).

### 4. Start the services

```bash
docker compose up -d
```

Penombre is now running on port **3000**. Open it and the setup screen will ask
you to create the administrator account — there are no default credentials.

> Get to it before anyone else does. Until the first account exists, whoever
> reaches `/auth/setup` becomes the administrator, so do not leave a fresh
> instance exposed and unattended.

## What happens on first start

1. The app waits for the database to become reachable (up to 10 retries, 2
   seconds apart). On SQLite the file is created if it doesn't exist.
2. Drizzle ORM runs all pending database migrations automatically.
3. If no users exist, every request redirects to the setup screen until an
   administrator has been created.
4. The server starts listening on port 3000.

Migrations run automatically on every startup, including after image upgrades —
no manual steps needed.

## HTTPS

In production, place a reverse proxy in front of Penombre to terminate TLS. See
the [Reverse proxy](reverse-proxy.md) guide for Caddy, Nginx, and Traefik
examples.

When using a reverse proxy, you can remove the `ports` mapping from the `app`
service and let the proxy reach it over a shared Docker network instead.

## Running on PostgreSQL (optional)

SQLite is the default and is the right answer for a single container. Reach for
PostgreSQL only if you run **multiple app instances** against one dataset — a
SQLite file can't be shared safely across containers.

Add a `db` service and point `DATABASE_URL` at it:

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
      - DATABASE_URL=postgresql://penombre:a-long-random-password@db:5432/penombre

  db:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=penombre
      - POSTGRES_PASSWORD=a-long-random-password
      - POSTGRES_DB=penombre
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: [CMD-SHELL, "sh -c 'pg_isready -U penombre -d penombre'"]
      interval: 1s
      timeout: 2s
      retries: 10
      start_period: 3s

volumes:
  postgres_data:
  storage_data:
```

Don't publish a `5432` port mapping unless you actually need external database
access. Migrations for both dialects ship in the image and run on startup, so
nothing else changes.

## Persistent storage

Penombre stores your files and — on the default SQLite setup — its database
under `/data` inside the container, backed by the `storage_data` Docker volume.
On PostgreSQL the database lives in the `postgres_data` volume instead.

Volumes persist across container restarts and image upgrades. To inspect them:

```bash
docker volume inspect penombre_storage_data
```

## Health check

The container includes a built-in health check that probes the app every 30
seconds. Docker marks the container as unhealthy after 3 consecutive failures.

```bash
docker inspect --format='{{.State.Health.Status}}' penombre-app-1
```

## Updating

### 1. Back up your instance

Back up your database (`pg_dump` for Postgres, or a copy of the `.sqlite` file)
and your `STORAGE_PATH` directory, using whatever tooling you already run for
the rest of your server.

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
docker buildx bake app
```

This builds a local image tagged `orochibraru/penombre:latest`. `TAG` is a bake
variable, so pass it as an environment variable to add a second tag:

```bash
TAG=v1.0.0 docker buildx bake app
```

`docker buildx bake docs` builds the documentation site image the same way, and
`docker buildx bake` with no target builds both.

For multi-platform builds (amd64 + arm64):

```bash
docker buildx bake app --set app.platform=linux/amd64,linux/arm64
```

## Resource tuning

### Upload size

`BODY_SIZE_LIMIT` is set to `Infinity` in the Docker image, so file uploads are
not limited by the app itself. To enforce a limit, configure it at the reverse
proxy level (e.g. `client_max_body_size` in Nginx).

### Database connections (PostgreSQL only)

On SQLite there is no pool to tune. On PostgreSQL the default connection pool is
tuned for small to medium deployments:

| Setting             | Value | Description                          |
| ------------------- | ----- | ------------------------------------ |
| `max`               | 20    | Maximum pool size                    |
| `idleTimeout`       | 30s   | Close idle connections after 30s     |
| `maxLifetime`       | 1800s | Recycle connections every 30 minutes |
| `connectionTimeout` | 10s   | Fail fast if DB is unreachable       |

PostgreSQL's default `max_connections` is 100. If you run multiple replicas,
scale the pool size down accordingly.
