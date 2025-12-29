import { join } from "node:path";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { building } from "$app/environment";
import { Logger } from "$lib/logger";
import { auth } from "$lib/server/auth";
import { getDb } from "$lib/server/db";

const logger = new Logger("Hooks");

const migrationsFolder = join(process.cwd(), "drizzle");

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMigrations() {
	const db = getDb();
	logger.info("Migrating database...");
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

export const init = async () => {
	await runMigrations();
};

export const handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});
	if (session) {
		// Make session and user available on server
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
