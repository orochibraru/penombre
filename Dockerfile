# UI
FROM node:current-alpine3.22 AS svelte-builder

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

RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -a -installsuffix cgo -o main .

# Server
FROM scratch

COPY --from=curlimages/curl:latest /usr/bin/curl /usr/bin/curl

COPY --from=go-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

LABEL org.opencontainers.image.authors="boyer63nicolas@gmail.com"

ENV ENV=prod

# Copy the Go binary
COPY --from=go-builder /app/main .

# Copy the SvelteKit static build output
COPY --from=svelte-builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "/usr/bin/curl", "--fail", "--silent", "--max-time", "3", "http://0.0.0.0:8080/api/v1/healthz" ]

EXPOSE 8080

CMD ["./main"]
