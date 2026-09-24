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
import { Logger } from "#lib/logger.js";
import type { AuthType } from "#lib/server/auth/index.js";
import { getVolumes, isSimpleMode } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { user as userTable } from "#lib/server/db/schema.js";
import { StorageService } from "#lib/server/services/storage/index.js";
import {
	estimateRemaining,
	type ScanReporter,
	type ScanStep,
} from "#lib/server/services/storage/scan.js";

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
 * Every pass in flight, by volume, whoever started it — the minute timer or
 * someone opening the page.
 *
 * One registry for both, because they walk the same tree: two overlapping
 * passes are duplicated work, and a page that only knew about its own could
 * say "not scanning" while the sweep was still crawling the mount. The
 * flickering badge that reported was the honest symptom of two schedules.
 */
const inFlight = new Set<string>();
const lastScanAt = new Map<string, number>();

/**
 * Long enough that the poll refreshing the page does not start a new pass the
 * instant the last one ended — which would leave the banner up forever.
 */
const RESCAN_COOLDOWN_MS = 30_000;

/** What a page is told about a pass: a step, plus how long is left. */
export interface ScanStatus {
	scanning: boolean;
	step?: ScanStep;
	/** Seconds, once enough files are done to say. */
	etaSeconds?: number;
}

type Listener = (status: ScanStatus) => void;

const progress = new Map<string, { step: ScanStep; filesStartedAt?: number }>();
const listeners = new Map<string, Set<Listener>>();

/** Emitting per file would flood a stream on a fast pass; a few a second reads live. */
const EMIT_INTERVAL_MS = 250;
const lastEmit = new Map<string, number>();

export function scanStatus(key: string): ScanStatus {
	const entry = progress.get(key);
	if (!(inFlight.has(key) && entry)) {
		return { scanning: inFlight.has(key) };
	}
	const { step, filesStartedAt } = entry;
	return {
		scanning: true,
		step,
		etaSeconds:
			step.phase === "files" && filesStartedAt
				? estimateRemaining(step.done, step.total, Date.now() - filesStartedAt)
				: undefined,
	};
}

/** Be told about every step of this volume's passes. Returns the unsubscribe. */
export function subscribeScan(key: string, listener: Listener): () => void {
	const set = listeners.get(key) ?? new Set<Listener>();
	set.add(listener);
	listeners.set(key, set);
	return () => {
		set.delete(listener);
	};
}

function emit(key: string, force = false): void {
	const now = Date.now();
	if (!force && now - (lastEmit.get(key) ?? 0) < EMIT_INTERVAL_MS) {
		return;
	}
	lastEmit.set(key, now);
	const status = scanStatus(key);
	for (const listener of listeners.get(key) ?? []) {
		listener(status);
	}
}

function reporterFor(key: string): ScanReporter {
	return (step) => {
		const previous = progress.get(key);
		const phaseChanged = previous?.step.phase !== step.phase;
		progress.set(key, {
			step,
			filesStartedAt:
				step.phase === "files"
					? (previous?.filesStartedAt ?? Date.now())
					: previous?.filesStartedAt,
		});
		emit(key, phaseChanged);
	};
}

/** Simple mode's shared drive, tracked like a volume. */
export const LIBRARY_SCAN_KEY = "library";

/** What a volume's passes are tracked under. */
export function volumeScanKey(volumeName: string): string {
	return `volume:${volumeName}`;
}

/** Is a pass running for this volume right now? */
export function isScanning(key: string): boolean {
	return inFlight.has(key);
}

type ScanRun = (report: ScanReporter) => Promise<unknown>;

/** Run a pass unless one is already going, and await it. */
async function runScan(key: string, run: ScanRun): Promise<void> {
	if (inFlight.has(key)) {
		return;
	}
	inFlight.add(key);
	emit(key, true);
	try {
		await run(reporterFor(key));
	} catch (error) {
		logger.error(`Scan of ${key} failed`, error);
	} finally {
		inFlight.delete(key);
		progress.delete(key);
		lastScanAt.set(key, Date.now());
		emit(key, true);
	}
}

/**
 * Start a pass now, ignoring the cooldown — the Rescan button. Returns false
 * when one was already running, which the caller reports as-is.
 */
export function scanNow(key: string, run: ScanRun): boolean {
	if (inFlight.has(key)) {
		return false;
	}
	void runScan(key, run);
	return true;
}

/**
 * Reconcile a volume in the background, unless one just finished. Returns
 * whether a pass is in flight now, which is what the page reports.
 *
 * Kept off the request: walking a NAS mount takes minutes, and awaiting it
 * held the page open with nothing on screen for all of them. The listing
 * renders from the rows that exist and the page says a pass is running.
 */
export function scanOnVisit(key: string, run: ScanRun): boolean {
	if (inFlight.has(key)) {
		return true;
	}
	if (Date.now() - (lastScanAt.get(key) ?? 0) < RESCAN_COOLDOWN_MS) {
		return false;
	}
	void runScan(key, run);
	return true;
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
		// Simple mode's shared drive, through the registry the Rescan button
		// and its progress stream use, so the two never crawl it at once.
		if (isSimpleMode()) {
			await runScan(LIBRARY_SCAN_KEY, (report) =>
				new StorageService(owner).scanStorage(report),
			);
		}

		const volumes = getVolumes();
		if (volumes.length === 0) {
			return;
		}

		// A mount is written to from outside the app, so it needs the same
		// reconciliation the shared drive gets — once, as the owner every
		// request reads it as, and through the same registry a page visit
		// uses so the two never crawl it at the same time.
		for (const volume of volumes) {
			await runScan(volumeScanKey(volume.name), (report) =>
				new StorageService(owner, volume).scanStorage(report),
			);
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
