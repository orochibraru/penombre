import { join } from "node:path";
import process from "node:process";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { sql } from "drizzle-orm";
import { migrate as migratePg } from "drizzle-orm/bun-sql/migrator";
import { migrate as migrateSqlite } from "drizzle-orm/bun-sqlite/migrator";
import { building } from "$app/environment";
import { Logger } from "$lib/logger";
import { baseLocale, getLocale } from "$lib/paraglide/runtime";
import type { AuthType } from "$lib/server/auth";
import { auth } from "$lib/server/auth";
import { needsSetup, seedAuth } from "$lib/server/auth/seed";
import { getConfig, isAuthBypassed, isSimpleMode } from "$lib/server/config";
import { getDb, resetDb } from "$lib/server/db";
import { isSqliteDialect } from "$lib/server/db/dialect";
import {
	loadSharedOwner,
	startLibraryScanner,
} from "$lib/server/services/library-scan";
import { getUserPreferences } from "$lib/server/services/preferences";
import {
	migrateStorageMeta,
	StorageService,
} from "$lib/server/services/storage";

const logger = new Logger("Hooks");

/** The session user, with the admin plugin's extra fields. */
type User = NonNullable<AuthType["user"]>;

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
			await sleep(3000);
		}
	}
}

export const init = async () => {
	// First line in the log on every boot: which build this is and which of the
	// two storage models it is running, so a bug report says so without asking.
	const config = getConfig();
	logger.info(
		`Penombre ${config.appVersion} — ${isSimpleMode() ? "simple mode (one shared drive)" : "drive mode (per-user drives)"}${
			isAuthBypassed() ? ", authentication bypassed" : ""
		}`,
	);

	await waitForDatabase();
	await runMigrations();
	await seedAuth();
	await migrateStorageMeta();
	startLibraryScanner();
};

/** Paths under the auth basePath that are handled by SvelteKit, not better-auth */
const customAuthPaths = new Set(["/api/v1/auth/providers"]);

/**
 * Auth bypass never signs anyone in, so there's no row in the session table —
 * but the app (layout guards, account pages) expects a session on `locals`.
 * Hand it a synthetic one that lives only for this request.
 */
function bypassSession(owner: User): NonNullable<App.Locals["session"]> {
	const now = new Date();
	return {
		id: `bypass-${owner.id}`,
		token: `bypass-${owner.id}`,
		userId: owner.id,
		createdAt: now,
		updatedAt: now,
		expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
	};
}

/**
 * Whose drive this request reads and writes.
 *
 * Full mode: the signed-in user. Simple mode: the shared owner, so every
 * account lands on the one drive. Published on `locals.storageOwner` because
 * every storage route builds its own `StorageService` — handing them the
 * session user is what left the shared drive unshared.
 */
async function resolveStorageOwner(sessionUser: User): Promise<User> {
	if (!isSimpleMode()) {
		return sessionUser;
	}
	const sharedOwner = await loadSharedOwner();
	return sharedOwner ?? sessionUser;
}

/**
 * Fallback auth for programmatic clients: `x-api-key: <key>` or
 * `Authorization: Bearer <key>`. Returns a 401 response when a key is present
 * but invalid, otherwise undefined (no key = anonymous, not an error).
 */
async function apiKeyAuth(
	event: Parameters<Handle>[0]["event"],
): Promise<Response | undefined> {
	const authHeader = event.request.headers.get("authorization");
	const rawKey =
		event.request.headers.get("x-api-key") ??
		(authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

	if (!rawKey) {
		return;
	}

	const result = await auth.api
		.verifyApiKey({ body: { key: rawKey } })
		.catch(() => null);

	if (!result?.valid) {
		logger.warn("Invalid API key authentication attempt", { key: rawKey });
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}

	const session = await auth.api.getSession({
		headers: new Headers({ "x-api-key": rawKey }),
	});

	if (session?.session && session.user) {
		event.locals.user = session.user;
		event.locals.storageOwner = await resolveStorageOwner(session.user);
		event.locals.storageService = new StorageService(event.locals.storageOwner);
	}
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
		event.locals.storageOwner = storageOwner;
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
	} else if (isAuthBypassed()) {
		// No auth at all: everyone is the shared owner.
		const owner = await loadSharedOwner();
		if (owner) {
			event.locals.user = owner;
			event.locals.storageOwner = owner;
			event.locals.session = bypassSession(owner);
			event.locals.storageService = new StorageService(owner);
		}
	} else {
		const unauthorized = await apiKeyAuth(event);
		if (unauthorized) {
			return unauthorized;
		}
	}

	// Skip better-auth handler for custom SvelteKit-managed auth routes
	if (customAuthPaths.has(event.url.pathname)) {
		return resolve(event);
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

/**
 * Server-renders the appearance preferences onto `<html>`.
 *
 * `applyTheme()` on the client can only run after hydration, so the first
 * paint used the shipped defaults and then visibly swapped a second later.
 * Stamping the attributes into the HTML means the correct theme is there in
 * the very first byte; the client effect still runs, to pick up live changes.
 *
 * Also fills in `%lang%`, which nothing was substituting — pages were shipping
 * a literal `lang="%lang%"`.
 */
const themeHandler: Handle = async ({ event, resolve }) => {
	// Only page renders carry the placeholders; skip the DB read for API
	// calls, assets and anything else.
	const wantsHtml = event.request.headers.get("accept")?.includes("text/html");

	let theme = { font: "sans", corners: "rounded", accent: "purple" };
	if (wantsHtml && event.locals.user) {
		try {
			const prefs = await getUserPreferences(event.locals.user.id);
			theme = {
				font: prefs.fontFamily ?? theme.font,
				corners: prefs.corners ?? theme.corners,
				accent: prefs.accent ?? theme.accent,
			};
		} catch (error) {
			// A themed page is not worth failing the request over.
			logger.warn("Could not read appearance preferences", error);
		}
	}

	const attributes =
		` data-font="${theme.font}" data-corners="${theme.corners}"` +
		` data-accent="${theme.accent}"`;

	// Resolved once per request rather than per chunk.
	let locale = baseLocale as string;
	try {
		locale = getLocale();
	} catch {
		// No request-scoped locale (prerender, error page) — the base one is
		// still a valid tag, which is the point of filling this in at all.
	}

	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replaceAll("%theme%", attributes).replaceAll("%lang%", locale),
	});
};

/**
 * Paths that must keep working while the instance has no administrator: the
 * setup screen itself, and the auth endpoints it posts through.
 */
function allowedDuringSetup(pathname: string): boolean {
	return (
		pathname.startsWith("/auth/setup") ||
		pathname.startsWith("/api/v1/auth") ||
		pathname.startsWith("/_app/") ||
		pathname.startsWith("/.well-known/") ||
		pathname === "/favicon.ico"
	);
}

const generalHandler: Handle = async ({ event, resolve }) => {
	const isUpload =
		event.request.method === "POST" &&
		event.url.pathname.includes("/storage/objects/item/");

	if (event.url.pathname.startsWith("/.well-known/")) {
		return await resolve(event);
	}

	// An empty instance has nothing to show and nobody who could sign in, so
	// everything funnels to setup until the first administrator exists.
	if (!allowedDuringSetup(event.url.pathname) && (await needsSetup())) {
		return new Response(null, {
			status: 302,
			headers: { location: "/auth/setup" },
		});
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

export const handle = sequence(generalHandler, authHandler, themeHandler);
