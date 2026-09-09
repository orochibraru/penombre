# Getting Started

Spin up a Penombre instance in minutes with Docker Compose.

## 1. Get the `.env` file

```bash
curl -o .env https://raw.githubusercontent.com/orochibraru/penombre/refs/heads/main/.example.env
```

## 2. Configure it

Edit the `.env` file with your configuration — see
[Environment variables](env.md) for the full reference.

## 3. Set up Docker Compose

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

  db:
    image: postgres:17-alpine
    restart: unless-stopped
    ports:
      - 5432:5432
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

volumes:
  postgres_data:
    driver: local
  storage_data:
    driver: local
```

## 4. Start the application

```bash
docker compose up -d
```

After a few moments, you should be able to access the application at
`http://localhost:3000`.
