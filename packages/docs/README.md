# Docs site

A static docs site scaffolded with
[`@orochibraru/docs`](https://github.com/orochibraru/docs).

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # -> build/, plain files, host them anywhere
bun run check    # svelte-check
bun test         # the markdown/search logic
```

## Editing it

- **Content** — `docs/*.md`. One file per page, at `/docs/<filename>`; the first
  `#` heading is the title. `docs/README.md` is the index for people reading the
  repo and gets no page of its own.
- **Everything else** — `src/lib/config.ts`: name, description, logo letter,
  repo URL, sidebar order, the landing page, the footer. Nothing else in `src/`
  hardcodes a project-specific string.
- **Icon** — `static/favicon.svg`.

## Generated assets

`static/api.v1.json` and `static/db.svg` are written by root scripts
(`bun run gen:openapi`, `bun run db:diagram`) — regenerate them there rather
than editing them here.

## Deploying it

CI builds this on every push to `main` that touches `packages/docs/` and
publishes `build/` to GitHub Pages (`static/CNAME` holds the domain). See
`.github/workflows/docs.yaml`.

### Anywhere else

`bun run build` writes `build/`, which is the whole site. Serve it with
anything; `nginx.conf` (used by the `Dockerfile` here) has the one non-obvious
bit — a `try_files $uri $uri.html` fallback, since the static adapter writes
`docs/getting-started.html` rather than `docs/getting-started/index.html`.

```bash
docker build -t my-docs . && docker run -p 8080:80 my-docs
```

## API reference page

Set `openapi` in `src/lib/config.ts` to the path of a spec you've dropped in
`static/` (say `/openapi.json`) and `/docs/api` renders it with Swagger UI, with
a sidebar link to match. Leave it unset and neither exists — you can then delete
`src/routes/docs/api/`, `src/swagger-ui-dist.d.ts` and the `swagger-ui-dist`
dependency.
