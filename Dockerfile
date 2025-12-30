FROM oven/bun:1-alpine AS base

RUN apk add --no-cache curl bash ca-certificates wget nano micro nodejs

WORKDIR /app

ARG FRONTEND_DIR=/app/packages/ui

FROM base AS builder

RUN mkdir -p ${FRONTEND_DIR}

COPY package.json bun.lock /app/
COPY packages/ui/package.json ${FRONTEND_DIR}/

RUN bun ci --frozen-lockfile --ignore-scripts

FROM builder AS frontend-builder

COPY ./packages/ui ${FRONTEND_DIR}

RUN rm -rf ${FRONTEND_DIR}/build ${FRONTEND_DIR}/.svelte-kit

RUN cd ${FRONTEND_DIR} && bun x svelte-kit sync && bun run build

# Final stage with Bun runtime
FROM base AS final

# Copy only production node_modules from builder
# We'll copy the entire node_modules but only the API's production deps were installed
COPY --from=builder /app/node_modules /app/node_modules

COPY --from=frontend-builder ${FRONTEND_DIR}/build/ /app

RUN mkdir -p /app/data

ENV STORAGE_PATH=/data

ENV ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:8080/api/health || exit 1

RUN chown -R bun:bun /app

USER bun

CMD ["bun", "run", "/app/index.js"]
