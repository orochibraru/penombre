# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS base

WORKDIR /app

# Build Stage
FROM base AS builder

COPY package.json ./

RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

RUN bunx svelte-kit sync && bun run build

# Prod deps
FROM base AS prod-dependencies

COPY package.json ./
COPY bun.lock ./

RUN bun install --frozen-lockfile --production

# Run Stage
FROM base AS runner

COPY --from=builder /app/build /app
COPY --from=prod-dependencies /app/node_modules /app/node_modules
COPY --from=prod-dependencies /app/package.json /app/package.json
COPY --from=builder /app/drizzle /app/drizzle

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:3000" ]

EXPOSE 3000/tcp

USER bun

CMD ["bun", "."]

FROM base AS db-migrate

RUN bun i -g drizzle-kit drizzle-orm dotenv 

COPY --from=prod-dependencies /app/node_modules /app/node_modules
COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/drizzle /app/drizzle

CMD [ "bun", "/app/scripts/db/migrate.ts" ]
