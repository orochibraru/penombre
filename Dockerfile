FROM oven/bun:1-alpine AS base

ENV BUN_FEATURE_FLAG_EXPERIMENTAL_HTTP2_CLIENT=1

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock /app/

RUN bun i --frozen-lockfile --ignore-scripts

FROM deps AS app-builder

COPY --from=deps /app/node_modules /app/node_modules

COPY . /app/

RUN bun run build && bun i --production --frozen-lockfile --ignore-scripts

FROM deps AS docs-builder

COPY . /app/

COPY --from=deps /app/node_modules /app/node_modules

RUN bun run docs:build

FROM nginx:alpine AS docs

COPY --from=docs-builder /app/packages/docs/build /usr/share/nginx/html

COPY packages/docs/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1"]


FROM base AS app

# ffmpeg is required for video thumbnail generation
# poppler-utils provides pdftoppm for PDF thumbnail generation
RUN apk add --no-cache ffmpeg poppler-utils

WORKDIR /app

# Create data dir before copying files
RUN mkdir -p /app/data

# Copy with --chown to avoid a separate chown layer that duplicates all files
COPY --from=app-builder --chown=bun:bun /prod/node_modules /app/node_modules
COPY --from=app-builder --chown=bun:bun /app/build/ /app/build
COPY --from=app-builder --chown=bun:bun /app/drizzle/ /app/drizzle
COPY --from=app-builder --chown=bun:bun /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=app-builder --chown=bun:bun /app/drizzle.sqlite.config.ts /app/drizzle.sqlite.config.ts

RUN chown bun:bun /app /app/data

ENV STORAGE_PATH=/data
ENV APP_ENV=production
ENV BODY_SIZE_LIMIT=Infinity
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:3000/api/health || exit 1

USER bun

CMD ["bun", "run", "/app/build/index.js"]
