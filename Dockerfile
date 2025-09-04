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
FROM golang:1.24.5-alpine AS go-builder

WORKDIR /app

COPY ./packages/api/go.mod ./packages/api/go.sum ./

RUN go mod download

COPY ./packages/api .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Server
FROM alpine:3.22

LABEL org.opencontainers.image.authors="boyer63nicolas@gmail.com"

ENV ENV=prod

RUN adduser -D opendrive

# Switch to the newly created non-root user
USER opendrive

# Set the working directory to the user's home
WORKDIR /home/opendrive

# Copy the Go binary
COPY --from=go-builder /app/main .

# Copy the SvelteKit static build output
COPY --from=svelte-builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "CMD", "wget", "--quiet", "--timeout=3", "--tries=1", "--spider", "http://0.0.0.0:8080/api/v1/healthz" ]

EXPOSE 8080

CMD ["./main"]
