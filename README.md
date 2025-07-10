# Opendrive v2

## Getting started

```bash
pnpm i
docker compose up
pnpm run db:migrate
pnpm run dev
```

Built with [Shadcn Svelte](https://shadcn-svelte.com/)

## DB

![DB Diagram](./diagrams/db-diagram.svg 'DB Diagram')

## Build docker

```bash
TAG=test docker buildx bake
```
