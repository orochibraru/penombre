---
applyTo: "packages/web/src/routes/api/**"
description: "Use when creating or modifying API route handlers. Enforces the OpenAPI-first thin-handler pattern with service delegation."
---

# API Route Handler Guidelines

Route handlers must be thin wrappers — no business logic in route files.

## Pattern

1. **Define the route** in `src/lib/server/openapi/v1/` using `defineRoute()` with Zod schemas
2. **Export the handler** in `src/routes/api/v1/` — destructure `{ query, body, params, service, user, event }` as needed
3. **Delegate to a service** from `src/lib/server/services/` for all business logic
4. **Return via `Http.*`** helpers from `$lib/server/http`

## Route handler example

```ts
import { Http } from "$lib/server/http";
import { createFile } from "$lib/server/openapi/v1/storage";

export const POST = createFile.handler(async ({ query, body, service }) => {
    try {
        const res = await service.createFile(body, query.folder);
        return Http.Ok(res);
    } catch (error) {
        return Http.ServerError("Failed to create file", error);
    }
});
```

## OpenAPI definition example

```ts
import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";
import { StorageService } from "$lib/server/services/storage";

export const createFile = defineRoute({
    method: "post",
    path: "/api/v1/storage/file",
    summary: "Create a file",
    description: "Creates a new file entry",
    tags: ["Storage - Files"],
    query: z.object({ folder: z.string().optional() }),
    body: newFileSchema,
    response: uploadResultSchema,
    errors: [400, 500],
    service: (user) => new StorageService(user),
});
```

## Rules

- **No direct DB access** in route files — always go through a service
- **No validation logic** in route files — Zod schemas in `defineRoute()` handle it
- **Wrap service calls** in try/catch, return `Http.ServerError()` on failure
- **Http response helpers**: `Http.Ok()`, `Http.Created()`, `Http.Accepted()`, `Http.Deleted()`, `Http.BadRequest()`, `Http.NotFound()`, `Http.Conflict()`, `Http.ServerError()`
- **Schemas** live in `$lib/server/schema.ts` — reuse existing schemas before creating new ones
- When a route needs a `service`, define it in `defineRoute()` via the `service` property — the handler receives it pre-instantiated
