/**
 * The background library scan.
 *
 * Simple mode and mounted volumes both browse bytes that arrive from outside
 * the app, so the database only matches reality if something goes and looks.
 * That is this: one pass on boot, then every minute.
 *
 * Lives in its own module rather than in `hooks.server.ts` because the setup
 * screen needs to kick it too — see `awaitOwner` below.
 */

import { asc } from "drizzle-orm";
import { Logger } from "$lib/logger";
import type { AuthType } from "$lib/server/auth";
import { getVolumes, isSimpleMode } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { user as userTable } from "$lib/server/db/schema";
import { StorageService } from "$lib/server/services/storage";

const logger = new Logger("LibraryScan");

type User = NonNullable<AuthType["user"]>;

/** How often the volume is re-scanned for changes made outside the app. */
const SCAN_INTERVAL_MS = 60_000;

/**
 * How often to look for the first account while none exists.
 *
 * A fresh instance has no owner until someone completes the setup screen, so
 * the boot scan finds nothing to scan for. Waiting a full minute after that
 * meant a brand-new simple-mode install showed an empty drive for up to a
 * minute with every file already sitting on the volume — which reads as "the
 * scan is broken", because from the outside it is.
 */
const AWAIT_OWNER_INTERVAL_MS = 2000;

/** Survives Vite HMR, so a hot reload doesn't stack up duplicate timers. */
const globalForScan = globalThis as unknown as {
	__scan_timer?: ReturnType<typeof setInterval>;
	__scan_owner_timer?: ReturnType<typeof setInterval>;
	__scan_running?: boolean;
	__shared_owner?: Promise<User | undefined>;
};

/**
 * Simple mode: every account's storage routes through one shared owner (the
 * first account ever created), so everyone reads/writes the same file tree
 * instead of each login getting its own siloed drive.
 */
export function loadSharedOwner(): Promise<User | undefined> {
	globalForScan.__shared_owner ??= getDb()
		.select()
		.from(userTable)
		.orderBy(asc(userTable.createdAt))
		.limit(1)
		.then((rows) => {
			const owner = rows[0] as User | undefined;
			// A miss must not be cached: a fresh instance has no account until
			// setup runs, and the boot scan would otherwise pin `undefined`
			// for the process's life and never scan again.
			if (!owner) {
				globalForScan.__shared_owner = undefined;
			}
			return owner;
		});
	return globalForScan.__shared_owner;
}

/**
 * Every account, for the per-user volume sweep.
 *
 * Re-read each pass rather than cached: a user created since boot has a
 * subdirectory on every volume that nothing else would reconcile.
 *
 * ponytail: a full table read per scan interval. Fine for a homelab; if an
 * instance ever grows enough accounts for this to show up, page it or move
 * the sweep to a queue keyed by volume.
 */
function loadAllOwners(): Promise<User[]> {
	return getDb()
		.select()
		.from(userTable)
		.orderBy(asc(userTable.createdAt))
		.then((rows) => rows as User[]);
}

/** Does this instance have anything worth scanning at all? */
export function scanningEnabled(): boolean {
	return isSimpleMode() || getVolumes().length > 0;
}

export async function scanLibrary(): Promise<void> {
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
		// Simple mode's shared drive.
		if (isSimpleMode()) {
			await new StorageService(owner).scanStorage();
		}

		const volumes = getVolumes();
		if (volumes.length === 0) {
			return;
		}

		// Mounted volumes are written from outside the app in both modes, so
		// they need the same reconciliation the shared drive gets.
		//
		// Simple mode shares each volume whole, so the shared owner covers it.
		// Full mode splits a volume per user, so every account has its own
		// subdirectory to reconcile — sweeping only the shared owner left
		// everyone else's stale until they happened to open the volume.
		const owners = isSimpleMode() ? [owner] : await loadAllOwners();
		for (const volume of volumes) {
			for (const volumeOwner of owners) {
				await new StorageService(volumeOwner, volume).scanStorage();
			}
		}
	} catch (error) {
		logger.error("Library scan failed", error);
	} finally {
		globalForScan.__scan_running = false;
	}
}

/**
 * Poll for the first account, then scan.
 *
 * Only runs while the instance is empty; it stops itself as soon as setup has
 * created someone. `requestLibraryScan()` covers the normal path — this is the
 * fallback for an account created by any route that does not call it.
 */
function awaitOwner(): void {
	if (globalForScan.__scan_owner_timer) {
		return;
	}
	globalForScan.__scan_owner_timer = setInterval(() => {
		void loadSharedOwner().then((owner) => {
			if (!owner) {
				return;
			}
			clearInterval(globalForScan.__scan_owner_timer);
			globalForScan.__scan_owner_timer = undefined;
			logger.info("First account created — scanning the library.");
			void scanLibrary();
		});
	}, AWAIT_OWNER_INTERVAL_MS);
	// Node keeps the process alive for a pending timer; this one must not.
	globalForScan.__scan_owner_timer.unref?.();
}

/** Scan now, out of band. Called once the first administrator exists. */
export function requestLibraryScan(): void {
	if (!scanningEnabled()) {
		return;
	}
	void scanLibrary();
}

export function startLibraryScanner(): void {
	if (!scanningEnabled() || globalForScan.__scan_timer) {
		return;
	}

	void loadSharedOwner().then((owner) => {
		if (owner) {
			void scanLibrary();
			return;
		}
		logger.info("No account yet — the first scan waits for setup.");
		awaitOwner();
	});

	globalForScan.__scan_timer = setInterval(() => {
		void scanLibrary();
	}, SCAN_INTERVAL_MS);
}
