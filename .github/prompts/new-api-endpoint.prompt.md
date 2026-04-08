---
description: "Scaffold a new API endpoint with OpenAPI definition, route handler, and service method following Penombre conventions."
agent: "agent"
argument-hint: "Describe the endpoint (e.g., 'GET /api/v1/users/me — returns current user profile')"
---

Create a new API endpoint for the Penombre web package. Follow the OpenAPI-first thin-handler pattern.

## Steps

1. **OpenAPI definition**: Add a `defineRoute()` call in the appropriate file under `packages/web/src/lib/server/openapi/v1/`. Define Zod schemas for params, query, body, and response. Wire the service via the `service` property.

2. **Route handler**: Create or update `+server.ts` in `packages/web/src/routes/api/v1/` at the matching path. The handler must be a thin wrapper that delegates to the service and returns via `Http.*` helpers.

3. **Service method**: Add the business logic method to the appropriate service class in `packages/web/src/lib/server/services/`.

4. **Schemas**: Define any new Zod schemas in `packages/web/src/lib/server/schema.ts`. Reuse existing schemas when possible.

5. **Regenerate types**: Remind to run `bun run gen:api` to update OpenAPI types for web and mobile clients.

Follow the conventions in [api-routes.instructions.md](../instructions/api-routes.instructions.md) and [services.instructions.md](../instructions/services.instructions.md).
