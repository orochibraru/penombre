# Documentation

The guides in this folder, in reading order:

1. [Getting started](getting-started.md) — spin up an instance with Docker
   Compose.
2. [Environment variables](env.md) — every setting, its default, and whether
   it's required.
3. [Deployment](deployment.md) — running it in production.
4. [Storage](storage.md) — where your files live on disk.
5. [Simple mode](simple-mode.md) — run it as a bare shared file browser instead
   of a multi-user drive.
6. [Reverse proxy](reverse-proxy.md) — HTTPS with Caddy, Nginx, or Traefik.
7. [Troubleshooting](troubleshooting.md) — fixes for the errors you're likely to
   hit.
8. [Authentication](authentication.md) — passwords, OAuth, passkeys, API keys.
9. [Project architecture](architecture.md) — how the monorepo fits together.

This file is the index when someone reads the repo on GitHub; the docs site uses
it for reading order only and gives it no page of its own. Keep
`src/lib/config.ts`'s `order` array in sync with the list above.
