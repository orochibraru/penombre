import { join } from "node:path";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { building } from "$app/environment";
import { Logger } from "$lib/logger";
import { auth } from "$lib/server/auth";
import { seedAuth } from "$lib/server/auth/seed";
import { getDb, resetDb } from "$lib/server/db";
import { StorageService } from "$lib/server/services/storage";

const logger = new Logger("Hooks");

const migrationsFolder = join(process.cwd(), "drizzle");

export function handleError({ event, error, status }) {
	if (status !== 404) {
		logger.error(
			`Error on ${event.request.method} ${event.url.pathname}`,
			error,
		);
		if (error instanceof Error) {
			return new Error(error.message);
		}

		return new Error("An unknown error occured.");
	}
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase() {
	const maxRetries = 60;
	const retryDelay = 2000;

	for (let i = 0; i < maxRetries; i++) {
		try {
			// Reset connection before each attempt to avoid stale connections
			if (i > 0) {
				await resetDb();
			}
			const db = getDb();
			// Try a simple query to check if DB is ready
			await db.execute("SELECT 1");
			logger.info("Database connection established.");
			return;
		} catch (error) {
			if (i === maxRetries - 1) {
				logger.error("Database not ready after maximum retries.");
				logger.error(`Last error: ${error}`);
				throw error;
			}
			const isFirstAttempt = i === 0;
			if (isFirstAttempt || i % 10 === 0) {
				logger.info(`Waiting for database... (attempt ${i + 1}/${maxRetries})`);
			}
			await sleep(retryDelay);
		}
	}
}

async function runMigrations() {
	logger.info("Migrating database...");
	let retries = 10;
	while (retries > 0) {
		try {
			logger.info(`Running migrations (retries left: ${retries})`);
			const db = getDb();
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
			// Reset the database connection before retrying
			await resetDb();
			retries -= 1;
			await sleep(3000);
		}
	}
}

export const init = async () => {
	await waitForDatabase();
	await runMigrations();
	await seedAuth();
};

const authHandler: Handle = async ({ event, resolve }) => {
	const isUpload =
		event.request.method === "POST" &&
		event.url.pathname.includes("/storage/objects/item/");

	if (isUpload) {
		logger.debug("HOOKS_AUTH", "authHandler START for upload", {
			method: event.request.method,
			pathname: event.url.pathname,
			contentType: event.request.headers.get("content-type"),
			contentLength: event.request.headers.get("content-length"),
			bodyUsed: event.request.bodyUsed,
		});
	}

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (isUpload) {
		logger.debug("HOOKS_AUTH", "getSession complete for upload", {
			hasSession: !!session,
			bodyUsed: event.request.bodyUsed,
		});
	}

	if (session) {
		// Make session and user available on server
		event.locals.session = session.session;
		event.locals.user = session.user;

		// Lazy-init StorageService — created on first access only
		let _storageService: StorageService | undefined;
		Object.defineProperty(event.locals, "storageService", {
			get() {
				if (!_storageService) {
					_storageService = new StorageService(session.user);
				}
				return _storageService;
			},
			configurable: true,
			enumerable: true,
		});
	}

	if (isUpload) {
		logger.debug("HOOKS_AUTH", "About to call svelteKitHandler for upload", {
			bodyUsed: event.request.bodyUsed,
		});
	}

	const result = svelteKitHandler({ event, resolve, auth, building });

	if (isUpload) {
		logger.debug("HOOKS_AUTH", "svelteKitHandler returned for upload");
	}

	return result;
};

const generalHandler: Handle = async ({ event, resolve }) => {
	const isUpload =
		event.request.method === "POST" &&
		event.url.pathname.includes("/storage/objects/item/");

	if (event.url.pathname.startsWith("/.well-known/")) {
		return await resolve(event);
	}
	// Ignore errors for favicon.ico
	if (event.url.pathname === "/favicon.ico") {
		return await resolve(event);
	}

	if (isUpload) {
		logger.debug("HOOKS_GENERAL", "About to resolve for upload", {
			bodyUsed: event.request.bodyUsed,
		});
	}

	const res = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === "content-length" || name === "content-type";
		},
	});

	if (isUpload) {
		logger.debug("HOOKS_GENERAL", "resolve complete for upload", {
			status: res.status,
			bodyUsed: event.request.bodyUsed,
		});
	}

	const isAsset =
		!event.url.pathname.endsWith("/") && event.url.pathname.includes(".");
	if (res.status >= 400 && !isAsset) {
		logger.error(
			`Error on ${event.request.method} ${event.url.pathname} - ${res.status}`,
		);
	} else {
		logger.info(
			`${event.request.method} ${event.url.pathname} - ${res.status}`,
		);
	}
	return res;
};

export const handle = sequence(generalHandler, authHandler);
