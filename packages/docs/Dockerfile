# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS base

WORKDIR /app

RUN apk add --no-cache curl bash ca-certificates wget nano micro

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Builder
FROM base AS builder

COPY --from=install /temp/dev/node_modules node_modules

COPY package.json ./

COPY . .

RUN bun --bun run build

# Runner
FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json /app/package.json

EXPOSE 3000/tcp

ENV ORIGIN=http://localhost:3000

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:3000" ]

USER bun

CMD ["bun", "/app/build/index.js"]
