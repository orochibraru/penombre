# Penombre

**A modern, self-hosted cloud storage solution with mobile and web clients**

Penombre is a comprehensive file storage and synchronization platform that provides you with complete control over your data. Built with modern technologies and designed for both individual users and organizations who want the convenience of cloud storage without sacrificing privacy and control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Latest Release](https://img.shields.io/github/v/release/orochibraru/penombre)
![Docker Pulls](https://img.shields.io/docker/pulls/orochibraru/penombre)

## Getting Started

1. Get the `.env` file
   `curl -o .env https://raw.githubusercontent.com/orochibraru/penombre/refs/heads/main/.example.env`
2. Edit the `.env` file with your configuration (see below for details)

3. Start the application with Docker Compose:

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
                    "sh -c 'pg_isready -U ${POSTGRES_USER-postgres} -d ${POSTGRES_DB-penombre}'",
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

## Features

- **Web Interface**: Modern, responsive web application built with SvelteKit
- **Mobile App**: Native mobile experience with Expo/React Native
- **Authentication**: Secure authentication via Better Auth with OAuth providers
- **File Management**: Upload, download, organize files and folders
- **Smart Categories**: Automatic categorization of files (images, documents, music, etc.)
- **Soft Trash**: Recoverable file deletion with trash support
- **Self-Hosted**: Complete control over your data and infrastructure
- **Docker Support**: Easy deployment with Docker Compose
- **Recent Files**: Quick access to recently modified files

### Environment Variables

See [.example.env](.example.env) for a complete reference.

#### Core

| Variable      | Description                                  | Default                 |
| ------------- | -------------------------------------------- | ----------------------- |
| `APP_NAME`    | Application name (used in UI and emails)     | `Penombre`              |
| `APP_VERSION` | Application version (used in metadata)       | /                       |
| `APP_ENV`     | Environment (`dev`/`production`)             | `production`            |
| `ORIGIN`      | Public origin URL (used for OAuth callbacks) | `http://localhost:3000` |
| `LOG_LEVEL`   | `debug`, `info`, `warn`, `error`             | `info`                  |
| `LOG_FORMAT`  | `console` or `json`                          | `console`               |

#### Database

| Variable       | Description                  | Default  |
| -------------- | ---------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string | Required |

#### Authentication

| Variable              | Description                        | Default  |
| --------------------- | ---------------------------------- | -------- |
| `AUTH_SECRET`         | Secret key for signing auth tokens | Required |
| `ENABLE_EMAIL_SIGNIN` | Enable email/password sign-in      | `true`   |
| `ENABLE_OAUTH_SIGNIN` | Enable OAuth sign-in               | `false`  |
| `MIN_PASSWORD_LENGTH` | Minimum password length            | `8`      |

#### OAuth Providers (Optional)

Configure OAuth providers using the pattern `OAUTH_<PROVIDER>_<SETTING>`:

| Variable                         | Description            | Default                |
| -------------------------------- | ---------------------- | ---------------------- |
| `OAUTH_<PROVIDER>_ENABLED`       | Enable this provider   | `true`                 |
| `OAUTH_<PROVIDER>_CLIENT_ID`     | OAuth client ID        | Required               |
| `OAUTH_<PROVIDER>_CLIENT_SECRET` | OAuth client secret    | Required               |
| `OAUTH_<PROVIDER>_DISCOVERY_URL` | OIDC discovery URL     | Required               |
| `OAUTH_<PROVIDER>_PRETTY_NAME`   | Display name           | Provider name          |
| `OAUTH_<PROVIDER>_PKCE`          | Use PKCE               | `true`                 |
| `OAUTH_<PROVIDER>_SCOPES`        | Comma-separated scopes | `openid,profile,email` |

#### SMTP (Optional)

| Variable        | Description              | Default             |
| --------------- | ------------------------ | ------------------- |
| `SMTP_ENABLED`  | Enable SMTP              | `false`             |
| `SMTP_HOST`     | SMTP server hostname     | Required if enabled |
| `SMTP_PORT`     | SMTP server port         | `587`               |
| `SMTP_USER`     | SMTP username            | Required if enabled |
| `SMTP_PASSWORD` | SMTP password            | Required if enabled |
| `SMTP_FROM`     | Sender email address     | Required if enabled |
| `SMTP_SECURE`   | Use TLS (`true`/`false`) | `false`             |

## Architecture

Penombre is a **monorepo** with the following packages:

```
packages/
├── web/     # SvelteKit app (frontend + Hono API backend)
└── mobile/  # Expo/React Native mobile app
```

### Database

![DB Diagram](./resources/db.svg)

### Web Package (`packages/web`)

The web package is a full-stack SvelteKit application:

- **Frontend**: SvelteKit with Svelte 5, TailwindCSS, and shadcn-svelte components
- **Backend API**: Hono routers integrated into SvelteKit server routes
- **Database**: PostgreSQL with Drizzle ORM (user accounts, activity logging)
- **Storage**: Local filesystem storage under `STORAGE_PATH` (default `/data`)
- **Auth**: Better Auth for authentication

### Mobile Package (`packages/mobile`)

- **Framework**: Expo with React Native
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Routing**: Expo Router (file-based routing)

## Development

### Prerequisites

- **Bun 1.3+** (primary runtime)
- **Docker and Docker Compose** (for PostgreSQL)
- **Node.js** (for Expo/mobile development)

### Setup

1.  **Clone the repository**

    ```bash
    git clone https://github.com/orochibraru/penombre.git
    cd penombre
    ```

2.  **Install dependencies**

    ```bash
    bun install
    ```

3.  **Start development services**

    ```bash
    bun run dev
    ```

    This starts PostgreSQL via Docker Compose and the Vite dev server for the web app.

4.  **Access the application**
    - Web UI: http://localhost:5173 (Vite default)

### Mobile Development

```bash
cd packages/mobile
bun install
bunx expo start
```

> **Note**: When connecting to the web API from a device/emulator, don't use `localhost`:
>
> - **iOS Simulator**: Use your host machine IP (e.g., `http://192.168.x.x:3000`)
> - **Android Emulator**: Use `http://10.0.2.2:3000` or set up `adb reverse`

## Docker Deployment

Build and run the production container:

```bash
docker compose up --build
```

The app will be available at http://localhost:3000.

## Backup & Restore

Penombre includes backup and restore scripts to protect your data. Backups include both the PostgreSQL database and all file storage.

### Creating a Backup

```bash
# With the stack running:
bun run backup

# Or specify a custom backup directory:
./scripts/backup.sh /path/to/backups
```

This creates a timestamped archive containing:

- **database.dump** - PostgreSQL custom format dump
- **storage.tar.gz** - All uploaded files and metadata
- **backup.json** - Backup metadata

### Restoring from Backup

```bash
# With the stack running:
bun run restore ./backups/penombre_backup_20240115_120000.tar.gz

# Or directly:
./scripts/restore.sh ./backups/penombre_backup_20240115_120000.tar.gz
```

> **Warning**: Restore will **replace all existing data**. Make sure you have a backup of current data before restoring.

### Automated Backups

For automated backups, add a cron job:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/penombre && ./scripts/backup.sh /path/to/backups >> /var/log/penombre-backup.log 2>&1
```

### Backup Storage Recommendations

- Store backups on a different drive or remote storage
- Keep multiple backup generations (e.g., last 7 days)
- Test restores periodically to verify backup integrity

## Development

### Tech Stack

- **Runtime**: Bun
- **Web Framework**: SvelteKit + Hono
- **Frontend**: Svelte 5, TailwindCSS 4, shadcn-svelte
- **Mobile**: Expo, React Native, NativeWind
- **Database**: PostgreSQL, Drizzle ORM
- **Auth**: Better Auth
- **Linting**: Biome

### Available Commands

```bash
# Root commands
bun run dev          # Start dev servers (DB + web)
bun run test         # Run tests
bun run build        # Build all packages
bun run lint         # Lint with Biome
bun run lint:fix     # Lint and fix issues
bun run check        # Type-check all packages

# Web package (packages/web)
bun run dev          # Start Vite dev server
bun run build        # Build for production
bun run check        # Type-check with svelte-check
bun run db:generate  # Generate Drizzle migrations

# Mobile package (packages/mobile)
bunx expo start       # Start Expo dev server
bunx expo run:android # Run on Android
bunx expo run:ios     # Run on iOS
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with these open-source technologies:

- [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- [shadcn-svelte](https://shadcn-svelte.com/) - UI components
- [Bun](https://bun.sh/) - JavaScript runtime and toolkit
- [Expo](https://expo.dev/) - React Native framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Better Auth](https://www.better-auth.com/) - Authentication library
- [PostgreSQL](https://postgresql.org/) - Database
- [Biome](https://biomejs.dev/) - Linter and formatter
