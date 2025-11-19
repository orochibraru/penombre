# Build UI
FROM oven/bun:1-alpine AS builder

WORKDIR /app

RUN mkdir -p /app/packages/ui /app/packages/api

COPY package.json bun.lock /app/
COPY packages/ui/package.json /app/packages/ui/
COPY packages/api/package.json /app/packages/api/

RUN bun ci --frozen-lockfile --ignore-scripts

COPY packages/ui /app/packages/ui

# Build UI
RUN cd packages/ui && bun --bun vite build

COPY . .

RUN bun ci --production --frozen-lockfile --ignore-scripts

# Final stage with Bun runtime
FROM oven/bun:1-alpine AS final

WORKDIR /app

# Copy API source and UI build
COPY --from=builder /app/packages/api /app/packages/api
COPY --from=builder /app/packages/drizzle /app/packages/api/drizzle
COPY --from=builder /app/packages/drizzle /app/drizzle
COPY --from=builder /app/packages/ui/build /app/packages/ui/dist
COPY --from=builder /app/node_modules /app/node_modules

RUN mkdir -p /app/data

ENV STORAGE_PATH=/app/data

ENV ENV=prod

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["bun", "run", "/app/packages/api/index.ts"]
