# Opendrive API

## Oapi Codegen

[Docs](https://github.com/oapi-codegen/oapi-codegen)

### Install

```bash
go get -tool github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest
```

### Run

```bash
go tool oapi-codegen -config ./config/codegen.yaml ./config/openapi.yaml
go mod tidy
```

## Air

[Docs](https://github.com/air-verse/air)

### Install

```bash
go get -tool github.com/air-verse/air@latest
```

### Run

```bash
go tool air
```
