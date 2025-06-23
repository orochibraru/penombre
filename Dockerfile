# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS base

WORKDIR /app

RUN apk add --no-cache curl bash ca-certificates wget

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

RUN bun i -g drizzle-kit drizzle-orm dotenv 

COPY --from=builder /app/build /app
COPY --from=builder /app/entrypoint.sh /app/entrypoint.sh
COPY --from=prod-dependencies /app/node_modules /app/node_modules
COPY --from=prod-dependencies /app/package.json /app/package.json
COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/drizzle /app/drizzle

RUN chmod +x /app/entrypoint.sh

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:3000" ]

EXPOSE 3000/tcp

USER bun

ENTRYPOINT [ "/app/entrypoint.sh" ]

CMD ["bun", "."]
