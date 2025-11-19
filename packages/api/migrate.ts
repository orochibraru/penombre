import { join } from "node:path";
import { db } from "@lib/db";
import { logger } from "@lib/logger";
import { $, sleep } from "bun";
import { migrate } from "drizzle-orm/bun-sql/migrator";

const migrationsFolder = join(process.cwd(), "drizzle");

export async function runMigrations() {
	logger.info("Migrating database...");
	const metaFile = `${migrationsFolder}/meta/_journal.json"`;
	if (!Bun.file(metaFile).exists()) {
		logger.error(`Can't find meta file at ${metaFile}`);
		// Debug, run ls in the migrations folder
		logger.error(
			"Migrations folder contents:",
			await $`ls -la ${migrationsFolder}`,
		);

		// Also log what's in the meta folder in the migrations folder
		logger.error(
			"Migrations meta folder contents:",
			await $`ls -la ${join(migrationsFolder, "meta")}`,
		);
		throw new Error("Meta file not found");
	}
	let retries = 10;
	while (retries > 0) {
		try {
			logger.info(`Running migrations (retries left: ${retries})`);
			await migrate(db, {
				migrationsFolder,
			});
			logger.info("Database migrated successfully.");
			return;
		} catch (error) {
			logger.error(
				`Migration error, Retrying... (${retries} attempts left)`,
				error,
			);
			// This is the last retry, exit the process
			if (retries === 1) {
				logger.error("Could not migrate the database. Exiting.");
				logger.error(error);
				process.exit(1);
			}
			retries -= 1;
			await sleep(3000);
		}
	}
}

if (import.meta.main) {
	runMigrations();
}
