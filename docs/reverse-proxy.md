# Reverse Proxy

Expose Penombre behind a reverse proxy with HTTPS.

Penombre listens on port **3000** by default. In production you should place it
behind a reverse proxy to handle HTTPS termination and forward traffic to the
container.

> **Warning** — set the `ORIGIN` environment variable to your public URL (e.g.
> `https://cloud.example.com`). This is required for OAuth callbacks, email
> links, and passkey registration to work correctly.

## Requirements

Your reverse proxy must:

- Forward the `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`
  headers so Penombre can resolve client addresses and detect HTTPS.
- Allow large request bodies — Penombre sets `BODY_SIZE_LIMIT=Infinity` for file
  uploads, so limit enforcement should happen at the proxy level if needed.
- Not buffer responses — streaming is used for file downloads.

## Client address {#client-address}

Forwarding the `X-Forwarded-For` header is not enough on its own: Penombre only
trusts a header you explicitly name, or it falls back to the TCP connection's
own address, which behind a proxy is the proxy's address for every request. Set
`ADDRESS_HEADER=x-forwarded-for` (and `XFF_DEPTH`, the number of trusted proxy
hops to count back from the end of that header, `1` by default) so Penombre
reads the real client address instead.

This is not cosmetic. The client address is what per-IP rate limiting keys on,
sign-in lookups, share-link unlock attempts, so without it every request behind
the proxy shares one bucket, and thirty attempts from anywhere lock out every
visitor at once.

Only set `ADDRESS_HEADER` when every request actually goes through a proxy you
control: a client can set `X-Forwarded-For` itself, and a value trusted with no
proxy in front to overwrite it lets that client claim any address it likes.

## Caddy

[Caddy](https://caddyserver.com/) handles HTTPS automatically via Let's Encrypt.

```txt
# Caddyfile
cloud.example.com {
    reverse_proxy localhost:3000
}
```

That's it — Caddy provisions and renews TLS certificates automatically.

## Nginx

```nginx
# /etc/nginx/sites-available/penombre
server {
    listen 80;
    server_name cloud.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cloud.example.com;

    ssl_certificate     /etc/letsencrypt/live/cloud.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloud.example.com/privkey.pem;

    client_max_body_size 0; # No upload size limit

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_buffering off;

        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }
}
```

Use [Certbot](https://certbot.eff.org/) to provision certificates:

```bash
sudo certbot --nginx -d cloud.example.com
```

## Traefik

Add labels to the `app` service in your `compose.yaml`:

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.penombre.rule=Host(`cloud.example.com`)"
      - "traefik.http.routers.penombre.entrypoints=websecure"
      - "traefik.http.routers.penombre.tls.certresolver=letsencrypt"
      - "traefik.http.services.penombre.loadbalancer.server.port=3000"
    # Remove the ports mapping — Traefik handles routing
    # ports:
    #   - 3000:3000
```

Make sure Traefik is configured with an ACME certificate resolver named
`letsencrypt` and an entrypoint named `websecure` on port 443.

## Docker Compose with a proxy network

When running both your reverse proxy and Penombre in Docker, place them on a
shared network so the proxy can reach the app container by service name:

```yaml
services:
  app:
    image: orochibraru/penombre:latest
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - storage_data:/data
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/penombre
    networks:
      - default
      - proxy

  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD-postgres}
      - POSTGRES_DB=${POSTGRES_DB-penombre}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test:
        [
          CMD-SHELL,
          "sh -c 'pg_isready -U ${POSTGRES_USER-postgres} -d
          ${POSTGRES_DB-penombre}'",
        ]
      interval: 1s
      timeout: 2s
      retries: 10
      start_period: 3s

volumes:
  postgres_data:
  storage_data:

networks:
  proxy:
    external: true
```

With this setup, remove the `ports` mapping from the `app` service — the reverse
proxy accesses it via `http://app:3000` on the shared `proxy` network. The
database port is also no longer exposed to the host.
