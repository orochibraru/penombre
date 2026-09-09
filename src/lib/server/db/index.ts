import { Database as SqliteConnection } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SQL } from "bun";
import { type BunSQLDatabase, drizzle as drizzlePg } from "drizzle-orm/bun-sql";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { getDbUrl, getSqliteFilePath, isSqliteDialect } from "./dialect";

export type Database = BunSQLDatabase<Record<string, never>>;

export { getDbUrl };

type Client = SQL | SqliteConnection;

/**
 * Database singleton that survives Vite HMR.
 * Without this, every hot reload creates a new connection pool,
 * eventually hitting "too many clients" in PostgreSQL.
 */
const globalForDb = globalThis as unknown as {
	__db_client?: Client;
	__db_instance?: Database;
};

function createPgClient(): SQL {
	return new SQL({
		url: getDbUrl(),
		max: 20, // Keep pool small - PostgreSQL default max_connections is 100
		idleTimeout: 30, // Close idle connections after 30s
		maxLifetime: 1800, // Recycle connections every 30 min to prevent stale connections
		connectionTimeout: 10, // Fail fast if DB is down
		tls: false,
	});
}

function createSqliteClient(): SqliteConnection {
	const path = getSqliteFilePath(getDbUrl());
	const dir = dirname(path);
	if (dir && !existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	const client = new SqliteConnection(path, { create: true });
	// Off by default in SQLite — required for the schema's cascade-delete FKs.
	client.exec("PRAGMA foreign_keys = ON;");
	return client;
}

function createClient(): Client {
	if (globalForDb.__db_client) {
		return globalForDb.__db_client;
	}

	const client = isSqliteDialect() ? createSqliteClient() : createPgClient();
	globalForDb.__db_client = client;
	return client;
}

function createDb(): Database {
	if (globalForDb.__db_instance) {
		return globalForDb.__db_instance;
	}

	const client = createClient();
	const instance = (client instanceof SqliteConnection
		? drizzleSqlite({ client })
		: drizzlePg({ client })) as unknown as Database;
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
		if (globalForDb.__db_client instanceof SqliteConnection) {
			globalForDb.__db_client.close();
		} else {
			await globalForDb.__db_client.close();
		}
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
