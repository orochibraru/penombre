# Penombre

A modern, self-hosted cloud storage solution.

Penombre is a file storage and synchronization platform that gives you complete
control over your data. Built for both individual users and organizations who
want the convenience of cloud storage without sacrificing privacy and control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Latest Release](https://img.shields.io/github/v/release/orochibraru/penombre)
![Docker Pulls](https://img.shields.io/docker/pulls/orochibraru/penombre)

## Getting Started

Follow the [installation guide](https://penombre.orochibraru.com/docs) to set up
your Penombre instance in minutes. For configuration options, see the
[environment variables documentation](https://penombre.orochibraru.com/docs/env).

## Features

- **Web Interface**: Modern, responsive web application built with SvelteKit
- **Authentication**: Secure authentication via Better Auth with OAuth providers
- **File Management**: Upload, download, organize files and folders
- **Smart Categories**: Automatic categorization of files (images, documents,
  music, etc.)
- **Soft Trash**: Recoverable file deletion with trash support
- **Self-Hosted**: Complete control over your data and infrastructure
- **Docker Support**: Easy deployment with Docker Compose
- **Recent Files**: Quick access to recently modified files
- **REST API**: OpenAPI-documented `/api/v1` endpoints with API-key auth
- **Simple Mode**: Run it as a bare shared file browser — mount a volume, share
  the login, browse together. See
  [the docs](https://penombre.orochibraru.com/docs/simple-mode)
- **No database server**: Runs on SQLite out of the box — one container, one
  volume. PostgreSQL stays supported if you want it

## Deployment

Build and run the production container:

```bash
docker compose up --build
```

The app will be available at <http://localhost:3000>.

See [the docs](https://penombre.orochibraru.com/docs/env) for the full
environment variable reference.

## Architecture

- **Frontend**: SvelteKit with Svelte 5, TailwindCSS 4, and shadcn-svelte
- **Backend API**: SvelteKit `+server.ts` routes with Zod-validated contracts
  that also generate the OpenAPI spec
- **Database**: SQLite with Drizzle ORM by default, PostgreSQL optional — picked
  from the `DATABASE_URL` scheme
- **Storage**: Local filesystem, at `STORAGE_PATH` (default `/data/storage`)
- **Auth**: Better Auth (session cookies, OAuth providers, API keys)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, commands, and the test
and lint workflow.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Acknowledgments

Built with these open-source technologies:

- [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- [shadcn-svelte](https://shadcn-svelte.com/) - UI components
- [Bun](https://bun.sh/) - JavaScript runtime and toolkit
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Better Auth](https://www.better-auth.com/) - Authentication library
- [SQLite](https://sqlite.org/) - Database
- [Biome](https://biomejs.dev/) - Linter and formatter
