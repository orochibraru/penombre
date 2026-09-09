import { join } from "node:path";
import process from "node:process";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import type { User } from "better-auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { asc, sql } from "drizzle-orm";
import { migrate as migratePg } from "drizzle-orm/bun-sql/migrator";
import { migrate as migrateSqlite } from "drizzle-orm/bun-sqlite/migrator";
import { building } from "$app/environment";
import { Logger } from "$lib/logger";
import { auth } from "$lib/server/auth";
import { seedAuth } from "$lib/server/auth/seed";
import { isSimpleMode } from "$lib/server/config";
import { getDb, resetDb } from "$lib/server/db";
import { isSqliteDialect } from "$lib/server/db/dialect";
import { user as userTable } from "$lib/server/db/schema";
import {
	migrateStorageMeta,
	StorageService,
} from "$lib/server/services/storage";

const logger = new Logger("Hooks");

const migrationsFolder = join(
	process.cwd(),
	"drizzle",
	isSqliteDialect() ? "sqlite" : "pg",
);

export function handleError({ event, error, status }) {
	if (status !== 404) {
		logger.error(
			`Error on ${event.request.method} ${event.url.pathname}`,
			error,
		);
		if (error instanceof Error) {
			return new Error(error.message);
		}

		return new Error("An unknown error occurred.");
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase() {
	// SQLite is a local file opened synchronously — there's no server coming
	// up to wait for, and its driver has no `.execute()`. Opening it (which
	// creates the file and sets PRAGMAs) either works or throws right here.
	if (isSqliteDialect()) {
		getDb();
		logger.info("Database connection established.");
		return;
	}

	const maxRetries = 10;
	const retryDelay = 2000;

	for (let i = 0; i < maxRetries; i++) {
		try {
			// Reset connection before each attempt to avoid stale connections
			if (i > 0) {
				await resetDb();
			}
			const db = getDb();
			// Try a simple query to check if DB is ready
			await db.execute(sql`SELECT 1`);
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
			await await sleep(retryDelay);
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
			if (isSqliteDialect()) {
				// biome-ignore lint/suspicious/noExplicitAny: db is typed as the pg dialect; the runtime instance is a real SQLite one in this branch
				migrateSqlite(db as any, { migrationsFolder });
			} else {
				await migratePg(db, { migrationsFolder });
			}
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
			await await sleep(3000);
		}
	}
}

/** How often simple mode re-scans the mounted volume for outside changes. */
const SCAN_INTERVAL_MS = 60_000;

/** Survives Vite HMR, so a hot reload doesn't stack up duplicate timers. */
const globalForScan = globalThis as unknown as {
	__scan_timer?: ReturnType<typeof setInterval>;
	__scan_running?: boolean;
};

/**
 * Simple mode browses a volume that's written to from outside the app, so the
 * DB only matches reality if we look. Skipped entirely in drive mode, where
 * every file arrives through an upload that already wrote its row.
 */
async function scanLibrary(): Promise<void> {
	// A scan of a big library can outlast the interval — let it finish.
	if (globalForScan.__scan_running) {
		return;
	}
	globalForScan.__scan_running = true;
	try {
		const owner = await loadSharedOwner();
		if (!owner) {
			return;
		}
		await new StorageService(owner).scanStorage();
	} catch (error) {
		logger.error("Library scan failed", error);
	} finally {
		globalForScan.__scan_running = false;
	}
}

function startLibraryScanner(): void {
	if (!isSimpleMode() || globalForScan.__scan_timer) {
		return;
	}
	void scanLibrary();
	globalForScan.__scan_timer = setInterval(() => {
		void scanLibrary();
	}, SCAN_INTERVAL_MS);
}

export const init = async () => {
	await waitForDatabase();
	await runMigrations();
	await seedAuth();
	await migrateStorageMeta();
	startLibraryScanner();
};

/** Paths under the auth basePath that are handled by SvelteKit, not better-auth */
const customAuthPaths = new Set(["/api/v1/auth/providers"]);

let sharedOwnerPromise: Promise<User | undefined> | undefined;

/**
 * Simple mode: every account's storage routes through one shared owner (the
 * first account ever created), so everyone reads/writes the same file tree
 * instead of each login getting its own siloed drive.
 *
 * ponytail: cached forever for process lifetime and untested (hooks.server.ts
 * has no unit-test seam yet, would need mocking svelte-kit/drizzle-migrator
 * imports). Covered indirectly by e2e for now — add a focused test here if
 * this logic grows past "cache the first user".
 */
function loadSharedOwner(): Promise<User | undefined> {
	sharedOwnerPromise ??= getDb()
		.select()
		.from(userTable)
		.orderBy(asc(userTable.createdAt))
		.limit(1)
		.then((rows) => rows[0] as User | undefined);
	return sharedOwnerPromise;
}

async function resolveStorageOwner(sessionUser: User): Promise<User> {
	if (!isSimpleMode()) {
		return sessionUser;
	}
	return (await loadSharedOwner()) ?? sessionUser;
}

const authHandler: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (session) {
		// Make session and user available on server
		event.locals.session = session.session;
		event.locals.user = session.user;

		// Lazy-init StorageService — created on first access only
		const storageOwner = await resolveStorageOwner(session.user);
		let _storageService: StorageService | undefined;
		Object.defineProperty(event.locals, "storageService", {
			get() {
				if (!_storageService) {
					_storageService = new StorageService(storageOwner);
				}
				return _storageService;
			},
			configurable: true,
			enumerable: true,
		});
	} else {
		// Fallback: try API key authentication
		// Accepts either `x-api-key: <key>` or `Authorization: Bearer <key>`
		const authHeader = event.request.headers.get("authorization");
		const rawKey =
			event.request.headers.get("x-api-key") ??
			(authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

		if (rawKey) {
			const result = await auth.api
				.verifyApiKey({ body: { key: rawKey } })
				.catch(() => null);

			if (!result?.valid) {
				logger.warn("Invalid API key authentication attempt", {
					key: rawKey,
				});

				return new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
				});
			}

			const session = await auth.api.getSession({
				headers: new Headers({
					"x-api-key": rawKey,
				}),
			});

			if (session?.session && session.user) {
				event.locals.user = session.user;
				event.locals.storageService = new StorageService(
					await resolveStorageOwner(session.user),
				);
			}
		}
	}

	// Skip better-auth handler for custom SvelteKit-managed auth routes
	if (customAuthPaths.has(event.url.pathname)) {
		return resolve(event);
	}

	return svelteKitHandler({ event, resolve, auth, building });
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
	if (res.status >= 400 && !isAsset && res.status !== 404) {
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
