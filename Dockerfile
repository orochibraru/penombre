# UI
FROM node:current-alpine3.22 AS svelte-builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

ENV BUILD_OUTPUT_PATH="./build"
ENV PUBLIC_API_URL=http://0.0.0.0:8080

COPY ui/package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts --prefer-offline

COPY ./ui .

RUN --mount=type=cache,id=vitebuild-opendrive,target=/node_modules/.vite pnpm run build

# API
FROM golang:1.24.5-alpine AS go-builder

WORKDIR /app

COPY ./api/go.mod ./api/go.sum ./

RUN go mod download

COPY ./api .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Server
FROM alpine:3.22

ENV ENV=prod

WORKDIR /app/

# Copy the Go binary
COPY --from=go-builder /app/main .

# Copy the SvelteKit static build output
COPY --from=svelte-builder /app/build ./frontend

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "CMD", "wget", "--quiet", "--timeout=3", "--tries=1", "--spider", "http://0.0.0.0:8080/api/v1/healthz" ]

EXPOSE 8080

CMD ["./main"]
