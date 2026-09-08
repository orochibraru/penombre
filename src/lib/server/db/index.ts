import { SQL } from "bun";
import { type BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";

export type Database = BunSQLDatabase<Record<string, never>>;

export function getDbUrl() {
	return (
		Bun.env.DATABASE_URL ??
		"postgres://postgres:postgres@localhost:5432/penombre?sslmode=disable"
	);
}

/**
 * Database singleton that survives Vite HMR.
 * Without this, every hot reload creates a new connection pool,
 * eventually hitting "too many clients" in PostgreSQL.
 */
const globalForDb = globalThis as unknown as {
	__db_client?: SQL;
	__db_instance?: BunSQLDatabase<Record<string, never>>;
};

function createClient(): SQL {
	if (globalForDb.__db_client) {
		return globalForDb.__db_client;
	}

	const client = new SQL({
		url: getDbUrl(),
		max: 20, // Keep pool small - PostgreSQL default max_connections is 100
		idleTimeout: 30, // Close idle connections after 30s
		maxLifetime: 1800, // Recycle connections every 30 min to prevent stale connections
		connectionTimeout: 10, // Fail fast if DB is down
		tls: false,
	});

	globalForDb.__db_client = client;
	return client;
}

function createDb(): BunSQLDatabase<Record<string, never>> {
	if (globalForDb.__db_instance) {
		return globalForDb.__db_instance;
	}

	const instance = drizzle({ client: createClient() });
	globalForDb.__db_instance = instance;
	return instance;
}

export const db = createDb();

// For backward compatibility and proper singleton access
export function getDb() {
	// If instance was reset, recreate it
	if (!globalForDb.__db_instance) {
		return createDb();
	}
	return globalForDb.__db_instance;
}

/**
 * Close the database connection pool.
 * Call this during graceful shutdown.
 */
export async function closeDb(): Promise<void> {
	if (globalForDb.__db_client) {
		await globalForDb.__db_client.close();
		globalForDb.__db_client = undefined;
		globalForDb.__db_instance = undefined;
	}
}

/**
 * Reset the database connection.
 * Useful when the connection is in a bad state and needs to be recreated.
 */
export async function resetDb(): Promise<void> {
	await closeDb();
	// Force recreation on next getDb() call by clearing the singleton
	globalForDb.__db_instance = undefined;
	globalForDb.__db_client = undefined;
}
