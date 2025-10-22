# syntax=docker/dockerfile:1
FROM node:24-alpine3.22 AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts --prefer-offline

COPY --exclude=nginx.conf . .

RUN --mount=type=cache,id=vitebuild-opendrive,target=/node_modules/.vite pnpm run build

FROM nginxinc/nginx-unprivileged:alpine AS release

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080/tcp

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:8080" ]

CMD ["nginx", "-g", "daemon off;"]
