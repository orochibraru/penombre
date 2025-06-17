# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM node:23-alpine AS base

RUN apk add --no-cache curl bash ca-certificates wget

RUN npm i -g pnpm tsx drizzle-kit

WORKDIR /app

# Build Stage
FROM base AS builder

COPY package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts

COPY . .

RUN --mount=type=cache,id=vitebuild,target=/node_modules/.vite pnpm exec svelte-kit sync && pnpm run build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm prune --production --ignore-scripts

# Run Stage
FROM base AS runner

COPY --from=builder /app/drizzle /app/drizzle
COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/build /app/build
COPY --from=builder /app/node_modules /app/node_modules

ENV NODE_ENV=production

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:3000" ]

EXPOSE 3000

ENV DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres

CMD ["node", "/app/build/index.js"]