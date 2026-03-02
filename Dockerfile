FROM oven/bun:1.3.10-alpine AS base

WORKDIR /app

ARG FRONTEND_DIR=/app/packages/web
ARG MOBILE_DIR=/app/packages/mobile

FROM base AS builder

RUN mkdir -p ${FRONTEND_DIR} ${MOBILE_DIR}

COPY package.json bun.lock /app/
COPY packages/web/package.json ${FRONTEND_DIR}/
COPY packages/mobile/package.json ${MOBILE_DIR}/

RUN bun i --frozen-lockfile --ignore-scripts

FROM builder AS frontend-builder

COPY ./packages/web ${FRONTEND_DIR}

RUN cd ${FRONTEND_DIR} && bun i --frozen-lockfile --ignore-scripts

RUN rm -rf ${FRONTEND_DIR}/build ${FRONTEND_DIR}/.svelte-kit

# ORIGIN is required at build time for better-auth import validation
RUN cd ${FRONTEND_DIR} && bun x svelte-kit sync && ORIGIN=http://localhost bunx --bun vite build

# Create a standalone production install outside workspace context
# This avoids Bun's symlink hell from workspace hoisting
RUN mkdir -p /prod && \
    cp ${FRONTEND_DIR}/package.json /prod/ && \
    cd /prod && \
    bun i --production --frozen-lockfile --ignore-scripts

# Final stage - minimal runtime
FROM base AS final

# ffmpeg is required for video thumbnail generation
# poppler-utils provides pdftoppm for PDF thumbnail generation
RUN apk add --no-cache ffmpeg poppler-utils

WORKDIR /app

# Create data dir before copying files
RUN mkdir -p /app/data

# Copy with --chown to avoid a separate chown layer that duplicates all files
COPY --from=frontend-builder --chown=bun:bun /prod/node_modules /app/node_modules
COPY --from=frontend-builder --chown=bun:bun /app/packages/web/build/ /app/build
COPY --from=frontend-builder --chown=bun:bun /app/packages/web/drizzle/ /app/drizzle
COPY --from=frontend-builder --chown=bun:bun /app/packages/web/drizzle.config.ts /app/drizzle.config.ts

RUN chown bun:bun /app /app/data

ENV STORAGE_PATH=/data
ENV APP_ENV=production
ENV BODY_SIZE_LIMIT=Infinity
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:3000/api/health || exit 1

USER bun

CMD ["bun", "run", "/app/build/index.js"]
