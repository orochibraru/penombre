---
applyTo: "packages/web/src/lib/server/services/**"
description: "Use when creating or modifying service layer classes. Enforces business logic patterns, DB access, and error handling conventions."
---

# Service Layer Guidelines

Services own all business logic and database access. Route handlers delegate to services.

## Pattern

```ts
import { Logger } from "$lib/logger";
import { getDb } from "$lib/server/db";
import { tableName } from "$lib/server/db/schema";

export class MyService {
    private db: ReturnType<typeof getDb>;
    private logger: Logger;

    constructor() {
        this.db = getDb();
        this.logger = new Logger("MyService");
    }
}
```

For user-scoped services (used via `defineRoute`'s `service` property):

```ts
import type { User } from "better-auth";

export class StorageService {
    private user: User;
    constructor(user: User) {
        this.user = user;
    }
}
```

## Rules

- All DB queries go through services — never in route handlers or components
- Use `Logger` from `$lib/logger` for structured logging (`debug`, `error`)
- Throw custom errors from `$lib/server/errors.ts` (`FileOrFolderNotFoundError`, `UnauthorizedError`)
- Use Drizzle query builders (`select`, `insert`, `update`, `delete`) — no raw SQL
- Keep services testable: no direct request/response handling, no SvelteKit imports
- Use `db.transaction()` for multi-step mutations
- Type inputs/outputs with schemas from `$lib/server/schema`
