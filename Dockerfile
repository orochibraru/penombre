# UI
FROM node:24-alpine3.22 AS svelte-builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY packages/ui/package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts --prefer-offline

COPY ./packages/ui .

RUN --mount=type=cache,id=vitebuild-opendrive,target=/node_modules/.vite pnpm run build

# API
FROM golang:1.25.2-alpine AS go-builder

WORKDIR /app

RUN apk --no-cache add ca-certificates

COPY ./packages/api/go.mod ./packages/api/go.sum ./

RUN go mod download

COPY ./packages/api .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -a -installsuffix cgo -o server .

# CLI
FROM golang:1.25.2-alpine AS cli-builder

WORKDIR /app

RUN apk --no-cache add ca-certificates

COPY ./packages/cli/go.mod ./packages/cli/go.sum ./

RUN go mod download

COPY ./packages/cli .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -a -installsuffix cgo -o cli .

# Server
FROM scratch

WORKDIR /app

COPY --from=go-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENV ENV=prod

# Copy the Go binary
COPY --from=go-builder /app/server /app/server

# Copy the CLI binary
COPY --from=cli-builder /app/cli /app/cli

# Copy the SvelteKit static build output
COPY --from=svelte-builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "/app/cli", "health" ]

EXPOSE 8080

CMD ["/app/server"]
