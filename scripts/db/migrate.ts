import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config } from 'dotenv'
config()

async function main() {
    const dbUrl =
        process.env["DATABASE_URL"] ??
        "postgres://postgres:postgres@localhost:5432/postgres";
    console.log("Initializing drizzle on", dbUrl);
    const db = drizzle(dbUrl);

    console.log("Migrating database...");
    try {
        await migrate(db, {
            migrationsFolder: "drizzle/",
        });
    } catch (e) {
        const err = e as Error;
        console.error("Failed to migrate database", err.message);
        throw e;
    }
}

void main().then(() => {
    console.log("Database migrated.");
    process.exit(0);
});
