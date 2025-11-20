FROM oven/bun:1-alpine AS base

WORKDIR /app

ARG FRONTEND_DIR=/app/packages/ui
ARG API_DIR=/app/packages/api

FROM base AS builder

RUN mkdir -p ${FRONTEND_DIR} ${API_DIR}

COPY package.json bun.lock /app/
COPY packages/ui/package.json ${FRONTEND_DIR}/
COPY packages/api/package.json ${API_DIR}/

RUN bun ci --frozen-lockfile --ignore-scripts

COPY . .

# Build UI
RUN cd ${FRONTEND_DIR} && bun run build

RUN mv ${FRONTEND_DIR}/build ${API_DIR}/frontend

RUN bun install --production --ignore-scripts

# Final stage with Bun runtime
FROM base AS final

# Copy API source and UI build
COPY --from=builder ${API_DIR}/ /app/
COPY --from=builder /app/node_modules /app/node_modules

RUN mkdir -p /app/data

ENV STORAGE_PATH=/app/data

ENV ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["bun", "run", "/app/index.ts"]
