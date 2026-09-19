import { Database as Sqlite } from "bun:sqlite";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import type { Database } from "./index";

/** An in-memory SQLite database with the app's real migrations applied. */
export function migratedSqlite(): Database {
	const client = drizzle(new Sqlite(":memory:"));
	migrate(client, {
		migrationsFolder: join(import.meta.dir, "../../../../drizzle/sqlite"),
	});
	return client as unknown as Database;
}
