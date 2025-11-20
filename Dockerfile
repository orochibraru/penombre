# Build UI
FROM oven/bun:1-alpine AS builder

WORKDIR /app

RUN mkdir -p /app/packages/ui /app/packages/api

COPY package.json bun.lock /app/
COPY packages/ui/package.json /app/packages/ui/
COPY packages/api/package.json /app/packages/api/

RUN bun ci --frozen-lockfile --ignore-scripts

COPY . .

# Build UI
RUN bun run --filter @opendrive/ui build && ls -la /app/packages/ui

RUN mv /app/packages/ui/build /app/packages/api/frontend

# Build the binary
RUN cd /app/packages/api && bun ./build.ts

# Final stage with Bun runtime
FROM oven/bun:1-alpine AS final

WORKDIR /app

RUN bun i -g koritsu drizzle-kit drizzle-orm

# Copy API source and UI build
COPY --from=builder /app/packages/api/build/opendrive /app/opendrive

RUN mkdir -p /app/data

ENV STORAGE_PATH=/app/data

ENV ENV=prod

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["/app/opendrive"]
