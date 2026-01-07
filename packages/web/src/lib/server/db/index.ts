import { SQL } from "bun";
import { type BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";

export type Database = BunSQLDatabase<Record<string, never>>;

export function getDbUrl() {
	return (
		Bun.env.DATABASE_URL ??
		"postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable"
	);
}

const client = new SQL({
	url: getDbUrl(),
	max: 50, // Maximum connections in pool
	idleTimeout: 30, // Close idle connections after 30s
	maxLifetime: 0, // Connection lifetime in seconds (0 = forever)
	connectionTimeout: 30, // Timeout when establishing new connections
	tls: false,
});

export const db = drizzle({ client });

// For backward compatibility
export function getDb() {
	return db;
}
