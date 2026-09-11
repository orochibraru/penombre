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

# The running app reports `package.json`'s version, and a release image is
# built before semantic-release bumps it — without this the image tagged
# 1.8.28 reports 1.8.27. The version is computed by the `version` job in
# publish.yaml and passed in as a build arg before any build step runs.
#
# The read-back is not ceremony: the app inlines this value at build time, so a
# patch that silently failed would ship an image that lies about itself, and
# nothing downstream would notice until someone read the About screen.
ARG APP_VERSION=""
RUN if [ -n "$APP_VERSION" ]; then \
      bun -e 'const fs = require("fs"); const p = JSON.parse(fs.readFileSync("package.json", "utf8")); p.version = process.env.APP_VERSION; fs.writeFileSync("package.json", JSON.stringify(p, null, "\t") + "\n");' \
      && baked="$(bun -e 'console.log(require("./package.json").version)')" \
      && [ "$baked" = "$APP_VERSION" ] \
      || { echo "APP_VERSION=$APP_VERSION was not applied to package.json (got $baked)" >&2; exit 1; } \
      && echo "Building version $APP_VERSION"; \
    fi

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
