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

# Clean any existing build artifacts to prevent cache contamination
RUN rm -rf ${FRONTEND_DIR}/build ${FRONTEND_DIR}/.svelte-kit

# Build UI (static build) and move to API frontend directory
RUN cd ${FRONTEND_DIR} && bun run build && ls -la build || exit 1
RUN rm -rf ${FRONTEND_DIR}/node_modules
RUN rm -rf ${API_DIR}/frontend
RUN mkdir -p ${API_DIR}/frontend
RUN mv ${FRONTEND_DIR}/build/* ${API_DIR}/frontend/

# Remove dev dependencies and install only production dependencies
RUN rm -rf /app/node_modules
RUN bun install --production --frozen-lockfile --ignore-scripts

# Final stage with Bun runtime
FROM base AS final

# Copy only production node_modules from builder
# We'll copy the entire node_modules but only the API's production deps were installed
COPY --from=builder /app/node_modules /app/node_modules

# Copy API source and UI build
COPY --from=builder ${API_DIR} /app/

RUN mkdir -p /app/data

ENV STORAGE_PATH=/data

ENV ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:8080/api/health || exit 1

CMD ["bun", "run", "/app/index.ts"]
