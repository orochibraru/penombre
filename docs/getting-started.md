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

Penombre runs on SQLite out of the box, so this is the whole stack — one
container, one volume:

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

volumes:
  storage_data:
    driver: local
```

The `/data` volume holds both the SQLite database (`/data/db`) and your files
(`/data/storage`).

> Prefer PostgreSQL? It is optional — see
> [Deployment](deployment.md#running-on-postgresql-optional) for the
> two-container version.

## 4. Start the application

```bash
docker compose up -d
```

After a few moments, you should be able to access the application at
`http://localhost:3000`.

## 5. Getting around

On a desktop the left sidebar holds everything: your drive, categories, any
mounted volumes, settings, the API reference and — if you are an administrator —
the admin panel.

On a phone that sidebar is replaced by the button in the middle of the bottom
bar. It opens a drawer with the same navigation plus the create and upload
actions, so nothing is desktop-only. The admin panel is in there too; it used to
hide behind the profile menu, which a phone never showed.
