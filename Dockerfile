FROM oven/bun:1-alpine AS base

RUN apk add --no-cache curl bash ca-certificates wget nano micro nodejs

WORKDIR /app

FROM base AS builder

RUN mkdir -p ${FRONTEND_DIR}

COPY package.json bun.lock /app/

RUN bun ci --frozen-lockfile --ignore-scripts

FROM builder AS builder

COPY ./packages/ui ${FRONTEND_DIR}

RUN rm -rf ${FRONTEND_DIR}/build ${FRONTEND_DIR}/.svelte-kit

RUN cd ${FRONTEND_DIR} && bun run build && ls -la build || exit 1

# Final stage with Bun runtime
FROM base AS final

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder ${FRONTEND_DIR}/build/ /app/frontend/

RUN mkdir -p /app/data

ENV STORAGE_PATH=/data

ENV ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:8080/api/health || exit 1

RUN chown -R bun:bun /app

USER bun

CMD ["bun", "run", "/app/index.ts"]
