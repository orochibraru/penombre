import { join } from "node:path";
import process from "node:process";
import {
	type Handle,
	type HandleServerError,
	sequence,
} from "@sveltejs/kit/hooks";
import { isAPIError } from "better-auth/api";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { sql } from "drizzle-orm";
import { migrate as migratePg } from "drizzle-orm/bun-sql/migrator";
import { migrate as migrateSqlite } from "drizzle-orm/bun-sqlite/migrator";
import { Logger } from "#lib/logger.js";
import { baseLocale, getLocale } from "#lib/paraglide/runtime.js";
import type { AuthType } from "#lib/server/auth/index.js";
import { auth, refreshAuth } from "#lib/server/auth/index.js";
import { needsSetup, seedAuth } from "#lib/server/auth/seed.js";
import { getConfig, isAuthBypassed, isSimpleMode } from "#lib/server/config.js";
import { csrfHandler } from "#lib/server/csrf.js";
import {
	basicPassword,
	cachedKeyUser,
	DAV_CHALLENGE,
	keyHint,
} from "#lib/server/dav/auth.js";
import { DAV_PREFIX, parseDavPath } from "#lib/server/dav/location.js";
import { isSqliteDialect } from "#lib/server/db/dialect.js";
import { getDb, resetDb } from "#lib/server/db/index.js";
import { isLockedOut, recordFailure } from "#lib/server/rate-limit.js";
import { startDurationSweeper } from "#lib/server/services/duration-sweep.js";
import {
	assertEncryptionKey,
	startEncryptionSweep,
} from "#lib/server/services/encryption.js";
import { startJobReconciler } from "#lib/server/services/job-reconcile.js";
import {
	failOrphanedJobs,
	startInstanceBeat,
} from "#lib/server/services/jobs.js";
import {
	loadSharedOwner,
	startLibraryScanner,
} from "#lib/server/services/library-scan.js";
import { getUserPreferences } from "#lib/server/services/preferences.js";
import { startRetentionSweeper } from "#lib/server/services/retention-sweep.js";
import { ShareService } from "#lib/server/services/shares.js";
import {
	migrateStorageMeta,
	StorageService,
} from "#lib/server/services/storage/index.js";
import { sweepStaleZips } from "#lib/server/services/storage/zip.js";
import { startEmbeddedWorker } from "#lib/server/services/worker-process.js";
import { building } from "$app/env";

const logger = new Logger("Hooks");

const ZIP_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const globalForZipSweep = globalThis as unknown as {
	__zip_sweep_timer?: ReturnType<typeof setInterval>;
};

function startZipSweeper(): void {
	if (globalForZipSweep.__zip_sweep_timer) {
		return;
	}
	void sweepStaleZips();
	globalForZipSweep.__zip_sweep_timer = setInterval(() => {
		void sweepStaleZips();
	}, ZIP_SWEEP_INTERVAL_MS);
}

const USER_STORAGE_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const globalForUserStorageSweep = globalThis as unknown as {
	__user_storage_sweep_timer?: ReturnType<typeof setInterval>;
};

function runUserStorageSweep(): void {
	void StorageService.cleanupDeletedUserStorage().catch((error) => {
		logger.error("User storage sweep failed", error);
	});
}

/** Removes on-disk storage `removeUser` cascades away in the database but never touches. */
function startUserStorageSweeper(): void {
	if (globalForUserStorageSweep.__user_storage_sweep_timer) {
		return;
	}
	runUserStorageSweep();
	globalForUserStorageSweep.__user_storage_sweep_timer = setInterval(
		runUserStorageSweep,
		USER_STORAGE_SWEEP_INTERVAL_MS,
	);
}

const SHARE_PURGE_INTERVAL_MS = 60 * 60 * 1000;
const globalForSharePurge = globalThis as unknown as {
	__share_purge_timer?: ReturnType<typeof setInterval>;
};
const shares = new ShareService();

function runSharePurge(): void {
	void shares.purgeExpired().catch((error) => {
		logger.error("Share purge failed", error);
	});
}

/** `ShareService.purgeExpired` had no caller; an expired link's row, and its frozen name, sat forever. */
function startSharePurger(): void {
	if (globalForSharePurge.__share_purge_timer) {
		return;
	}
	runSharePurge();
	globalForSharePurge.__share_purge_timer = setInterval(
		runSharePurge,
		SHARE_PURGE_INTERVAL_MS,
	);
}

/** The session user, with the admin plugin's extra fields. */
type User = NonNullable<AuthType["user"]>;

const migrationsFolder = join(
	process.cwd(),
	"drizzle",
	isSqliteDialect() ? "sqlite" : "pg",
);

/**
 * What an unexpected error becomes for the page that renders it.
 *
 * The return value **must be a plain object**: SvelteKit serialises it into
 * the SSR payload with devalue, which refuses anything else — returning an
 * `Error` instance threw "Cannot stringify arbitrary non-POJOs" while
 * rendering the error page, so the visitor got the framework's bare fallback
 * instead of the app's own, and the real failure was nowhere on screen.
 *
 * The id is logged beside the cause so "quote this to your admin" leads
 * somewhere; the error page already shows it.
 *
 * Kit 3 sends `error()` calls and 404s through here too; only `unknown` is a
 * real failure, the rest keep their own status and message.
 */
export const handleError: HandleServerError = ({ event, error, kind }) => {
	if (kind !== "unknown") {
		return;
	}

	const errorId = crypto.randomUUID();
	logger.error(
		`Error on ${event.request.method} ${event.url.pathname} [${errorId}]`,
		error,
	);

	return {
		// Never `error.message`: a Drizzle error carries the failed SQL and its
		// bound params, a driver error an absolute path; and this reaches
		// public pages too (`/s/[token]`). The real message is in the log line
		// above, keyed by the same id.
		message: "An unknown error occurred.",
		errorId,
	};
};

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
	// Before the worker starts: sealed files with no key to open them must stop
	// the boot, not surface as a failure on every read.
	await assertEncryptionKey().catch((error: unknown) => {
		logger.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
	// Before enqueueing anything: a worker tells a dead requester by it.
	await startInstanceBeat();
	// Before any worker can claim them: their callers died with the last run.
	await failOrphanedJobs();
	startEmbeddedWorker();
	startJobReconciler();
	await seedAuth();
	await migrateStorageMeta();
	startLibraryScanner();
	startDurationSweeper();
	startEncryptionSweep();
	startZipSweeper();
	startUserStorageSweeper();
	startSharePurger();
	startRetentionSweeper();
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

/** Invalid keys one address may try before it is refused outright. */
const KEY_FAILURES = { max: 20, windowSeconds: 15 * 60 };

/** A valid key over better-auth's per-key limit: not a bad guess. */
class KeyRateLimited extends Error {}

/** The key's user, or null for an invalid key. */
async function keyUser(rawKey: string): Promise<User | null> {
	const result = await auth.api
		.verifyApiKey({ body: { key: rawKey } })
		.catch(() => null);
	if (result?.error?.code === "RATE_LIMITED") {
		throw new KeyRateLimited();
	}
	if (!result?.valid) {
		return null;
	}
	const session = await auth.api
		.getSession({ headers: new Headers({ "x-api-key": rawKey }) })
		.catch((error: unknown) => {
			if (isAPIError(error) && error.status === "TOO_MANY_REQUESTS") {
				throw new KeyRateLimited();
			}
			throw error;
		});
	return session?.user ?? null;
}

/**
 * Fallback auth for programmatic clients: `x-api-key: <key>`,
 * `Authorization: Bearer <key>`, or on `/dav/` Basic with the key as the
 * password. Returns a 401 response when a key is present but invalid,
 * otherwise undefined (no key = anonymous, not an error).
 */
async function apiKeyAuth(
	event: Parameters<Handle>[0]["event"],
): Promise<Response | undefined> {
	const authHeader = event.request.headers.get("authorization");
	const dav = event.url.pathname.startsWith(DAV_PREFIX);
	const headerKey =
		event.request.headers.get("x-api-key") ??
		(authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
	const rawKey = headerKey ?? (dav ? basicPassword(authHeader) : null);

	if (!rawKey) {
		return;
	}

	// Refused before the lookup: a locked-out address costs no query. Keyed on
	// the client address, so behind a proxy this needs ADDRESS_HEADER or one
	// bad client locks out every key holder.
	const address = event.getClientAddress();
	const failures = `api-key-fail:${address}`;
	if (await isLockedOut(failures, KEY_FAILURES.max)) {
		return new Response(JSON.stringify({ error: "Too many failed attempts" }), {
			status: 429,
			headers: { "retry-after": String(KEY_FAILURES.windowSeconds) },
		});
	}

	let sessionUser: User | null;
	try {
		sessionUser = dav
			? await cachedKeyUser(rawKey, keyUser)
			: await keyUser(rawKey);
	} catch (error) {
		if (!(error instanceof KeyRateLimited)) {
			throw error;
		}
		return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
			status: 429,
			headers: { "retry-after": "60" },
		});
	}

	if (!sessionUser) {
		// Never the raw key: a typo or a revoked key is still a live credential
		// for as long as the log file exists.
		const count = await recordFailure(failures, KEY_FAILURES.windowSeconds);
		logger.warn("Invalid API key authentication attempt", {
			address,
			keyPrefix: keyHint(rawKey, !headerKey),
		});
		if (count === KEY_FAILURES.max) {
			logger.warn(
				`Locked out ${address} after ${count} invalid API keys, for ${KEY_FAILURES.windowSeconds / 60} minutes`,
			);
		}
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: dav ? DAV_CHALLENGE : undefined,
		});
	}

	event.locals.user = sessionUser;
	event.locals.storageOwner = await resolveStorageOwner(sessionUser);
	event.locals.storageService = new StorageService(event.locals.storageOwner);
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

	if (OAUTH_PATH.test(event.url.pathname)) {
		await refreshAuth();
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

	let theme = { font: "sans", corners: "rounded", accent: "bordeaux" };
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

/** Requests that reach a provider, so they need the current provider list. */
const OAUTH_PATH =
	/^\/api\/v1\/auth\/(sign-in\/(oauth2|social)|oauth2\/|callback\/)/;

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
	const dav = event.url.pathname.startsWith(DAV_PREFIX);
	// A DAV path is file names. A sync is several requests per file, and its
	// 4xx are routine: the 401 challenge, and a 405 for every MKCOL rclone
	// sends to make sure an existing parent folder is there.
	if (dav) {
		const base = `${parseDavPath(event.url.pathname)?.base ?? "/dav"}/…`;
		const line = `${event.request.method} ${base} - ${res.status}`;
		if (res.status >= 500) {
			logger.error(`Error on ${line}`);
		} else {
			logger.debug(line);
		}
	} else if (res.status >= 400 && !isAsset && res.status !== 404) {
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

export const handle = sequence(
	csrfHandler,
	generalHandler,
	authHandler,
	themeHandler,
);
