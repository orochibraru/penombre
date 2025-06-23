# Opendrive v2

## Getting started

```bash
bun i
docker compose up
bun run db:migrate
bun run dev
```

Built with [Shadcn Svelte](https://shadcn-svelte.com/)

## DB

![DB Diagram](./docs/db-diagram.svg 'DB Diagram')

## Build docker

```bash
TAG=test docker buildx bake
```
