import { env } from "node:process";
import { type BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";

export type Database = BunSQLDatabase<Record<string, never>>;
declare global {
	var db: Database;
}

export function getDbUrl() {
	return (
		Bun.env.DATABASE_URL ??
		"postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable"
	);
}

// biome-ignore lint/suspicious/noRedeclare: Prevent too many clients error
let db: Database;

if (env.NODE_ENV === "production") {
	db = drizzle(getDbUrl());
} else {
	if (!global.db) global.db = drizzle(getDbUrl());

	db = global.db;
}
export { db };
