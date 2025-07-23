# Opendrive

## Getting started

```bash
pnpm i
pnpm run dev
```

Built with [Shadcn Svelte](https://shadcn-svelte.com/)

## Oapi Codegen

[Docs](https://github.com/oapi-codegen/oapi-codegen)

```bash
go tool oapi-codegen -config ./config/codegen.yaml ./config/openapi.yaml
go mod tidy
```

## Air

[Docs](https://github.com/air-verse/air)

```bash
go tool air
```

## Golang Ci Lint

[Docs](https://golangci-lint.run/)

```bash
go tool golangci-lint
```

## Build docker

```bash
docker buildx bake
```
