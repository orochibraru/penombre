/**
 * E2E seed script - run via Bun to seed the database before Playwright tests
 * This is executed by global.setup.ts as a subprocess with test.setup.ts preloaded
 */
import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { seedAuth } from "$lib/server/auth/seed";
import { getDb } from "$lib/server/db";

const migrationsFolder = join(process.cwd(), "drizzle");

async function main() {
	console.log("Running migrations for E2E tests...");
	const db = getDb();
	await migrate(db, {
		migrationsFolder,
	});
	console.log("Migrations complete.");

	console.log("Seeding database for E2E tests...");
	await seedAuth();
	console.log("E2E database seeding complete.");
}

main().catch((err) => {
	console.error("E2E seed failed:", err);
	process.exit(1);
});
