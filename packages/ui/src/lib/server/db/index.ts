import { type BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";

export type Database = BunSQLDatabase<Record<string, never>>;

export function getDbUrl() {
	return (
		Bun.env.DATABASE_URL ??
		"postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable"
	);
}

let db: Database | null = null;

export function getDb(): Database {
	if (!db) {
		db = drizzle(getDbUrl());
	}
	return db;
}
