---
applyTo: "packages/web/src/lib/server/db/**"
description: "Use when modifying the database schema, adding tables or columns, or working with Drizzle ORM models. Covers schema conventions and migration workflow."
---

# Drizzle Schema Guidelines

## Schema location

All tables defined in `src/lib/server/db/schema.ts` using `pgTable()`.

## Conventions

- **IDs**: `text("id").primaryKey()` — string IDs, not auto-increment
- **Timestamps**: `timestamp("created_at").defaultNow().notNull()` for creation, `timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull()` for updates
- **Foreign keys**: `.references(() => parentTable.id, { onDelete: "cascade" })`
- **Indexes**: Define in the third argument of `pgTable()` using `index()`
- **Relations**: Use `relations()` from `drizzle-orm` for type-safe joins

## Migration workflow

1. Edit `schema.ts`
2. Run `bun run db:generate` in `packages/web/` to create a migration in `drizzle/`
3. Migrations apply automatically on next dev server start via `hooks.server.ts`

## Rules

- NEVER hand-edit SQL files in `drizzle/` — always generate via `drizzle-kit`
- NEVER drop columns in the same release as the code removal
- Access the database via `getDb()` from `$lib/server/db` or the `db` singleton
- Export types from `$lib/server/schema` (Zod) — not raw Drizzle inferred types for API boundaries
