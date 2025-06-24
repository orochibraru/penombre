# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache curl bash ca-certificates wget

RUN npm i -g pnpm tsx

# Build Stage
FROM base AS builder

COPY package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts

COPY . .

RUN --mount=type=cache,id=vitebuild,target=/node_modules/.vite pnpm exec svelte-kit sync && pnpm run build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm prune --production --ignore-scripts

# Run Stage
FROM base AS runner

COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/drizzle /app/drizzle
COPY --from=builder /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=builder /app/entrypoint.sh /app/entrypoint.sh
COPY --from=builder /app/build /app/build
COPY --from=builder /app/node_modules /app/node_module
COPY --from=builder /app/package.json /app/package.json

ENV NODE_ENV=production

RUN chmod +x /app/entrypoint.sh

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:3000/api/v1/ping" ]

EXPOSE 3000/tcp

USER node

ENTRYPOINT [ "/app/entrypoint.sh" ]

CMD ["node", "/app/build/index.js"]
