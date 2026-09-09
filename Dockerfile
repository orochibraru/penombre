FROM oven/bun:1-alpine AS base

ENV BUN_FEATURE_FLAG_EXPERIMENTAL_HTTP2_CLIENT=1

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock ./

RUN bun i --frozen-lockfile --ignore-scripts

# Shared source layer: both builders start from the same sources + node_modules.
FROM deps AS builder

COPY . .

FROM builder AS app-builder

# `bun i --production` over the existing tree adds rather than prunes, so the
# runtime deps are resolved fresh in /prod from the same lockfile.
# hadolint ignore=DL3003
RUN bun run build \
    && mkdir /prod && cp package.json bun.lock /prod/ \
    && cd /prod && bun i --production --frozen-lockfile --ignore-scripts

FROM builder AS docs-builder

RUN bun run docs:build


FROM nginx:alpine AS docs

COPY --from=docs-builder /app/packages/docs/build /usr/share/nginx/html

COPY packages/docs/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1


FROM base AS app

# ffmpeg is required for video thumbnail generation
# poppler-utils provides pdftoppm for PDF thumbnail generation
RUN apk add --no-cache ffmpeg poppler-utils

# Copy with --chown to avoid a separate chown layer that duplicates all files
COPY --from=app-builder --chown=bun:bun /prod/node_modules ./node_modules
COPY --from=app-builder --chown=bun:bun /app/build ./build
# hooks.server.ts resolves migrations from `process.cwd()/drizzle/<dialect>`.
COPY --from=app-builder --chown=bun:bun /app/drizzle ./drizzle

RUN mkdir -p /data/storage /data/db && chown -R bun:bun /data

ENV DATABASE_URL=file:/data/db/penombre.sqlite
ENV STORAGE_PATH=/data/storage
ENV APP_ENV=production
ENV BODY_SIZE_LIMIT=Infinity
ENV PORT=3000

EXPOSE 3000

# Compiled by the svelte-smol adapter; probes GET /_health over 127.0.0.1.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["/app/build/healthcheck"]

USER bun

CMD ["bun", "run", "/app/build/index.js"]
