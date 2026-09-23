/**
 * Encryption at rest, instance side: the boot guard that refuses a missing or
 * wrong key once files are sealed, and the sweep that seals files written
 * before the key was set (and rewraps those on a retired key).
 */

import { sep } from "node:path";
import { Logger } from "#lib/logger.js";
import {
	type AppConfig,
	getConfig,
	getStoragePath,
} from "#lib/server/config.js";
import { type Keyring, keyId } from "#lib/server/crypto/envelope.js";
import { keyring } from "#lib/server/crypto/keyring.js";
import type { AppSettingsData } from "#lib/server/db/schema.js";
import { getAppSettings, updateAppSettings } from "./app-settings";
import { awaitJob, enqueueJob } from "./jobs";

const logger = new Logger("Encryption");

const hex = (key: Buffer) => keyId(key).toString("hex");

interface SettingsStore {
	get: () => Promise<AppSettingsData>;
	update: (updates: Partial<AppSettingsData>) => Promise<unknown>;
}

/**
 * Throws when files are sealed and this process could not read them. The
 * first boot with a key records its id; a rotation moves the record once the
 * old key is in `ENCRYPTION_KEY_PREVIOUS`.
 */
export async function assertEncryptionKey(
	keys: Keyring = keyring(),
	settings: SettingsStore = { get: getAppSettings, update: updateAppSettings },
): Promise<void> {
	const recorded = (await settings.get()).encryptionKeyId;
	const current = keys.current ? hex(keys.current) : undefined;
	if (recorded === current) {
		return;
	}
	if (recorded && !current) {
		throw new Error(
			`Files are sealed with key ${recorded}, but ENCRYPTION_KEY is not set. Set it (or ENCRYPTION_KEY_FILE) to that key: without it every sealed file is unreadable.`,
		);
	}
	if (recorded && !keys.previous.some((key) => hex(key) === recorded)) {
		throw new Error(
			`ENCRYPTION_KEY (id ${current}) is not the key files are sealed with (id ${recorded}). To rotate keys, keep the old one in ENCRYPTION_KEY_PREVIOUS.`,
		);
	}
	await settings.update({ encryptionKeyId: current });
	logger.info(
		recorded
			? `Encryption key rotated from ${recorded} to ${current}; files are rewrapped in the background`
			: `Encryption at rest enabled with key ${current}`,
	);
}

const SWEEP_INTERVAL_MS = 60_000;
const SWEEP_BUDGET = 2000;
const SWEEP_BUDGET_BYTES = 4 * 1024 ** 3;
const SWEEP_TIMEOUT_MS = 6 * 60 * 60_000;

interface SweepResult {
	sealed: number;
	rewrapped: number;
	more: boolean;
	next: string;
	failed: { path: string; error: string }[];
}

/** Where each root's next pass resumes; lost on restart, which rewalks once. */
const cursors = new Map<string, string>();

interface SweepRoot {
	root: string;
	excludes: string[];
	rewrapOnly: boolean;
}

/**
 * The storage root is sealed; a writable volume is only rewrapped, and only
 * while a retired key is loaded: its plaintext files are never rewritten, but
 * what Penombre sealed there must leave the old key before it is dropped.
 */
function sweepRoots(): SweepRoot[] {
	const root = getStoragePath();
	// Absent from the unit tests' config mock.
	const volumes =
		(getConfig().volumes as AppConfig["volumes"] | undefined) ?? [];
	const nested = volumes
		.map((volume) => volume.path)
		.filter((path) => path === root || path.startsWith(root + sep));
	const rewrapped =
		keyring().previous.length > 0
			? volumes.filter((volume) => !volume.readOnly)
			: [];
	return [
		{ root, excludes: nested, rewrapOnly: false },
		...rewrapped.map((volume) => ({
			root: volume.path,
			excludes: [],
			rewrapOnly: true,
		})),
	];
}

async function sweepRoot(
	{ root, excludes, rewrapOnly }: SweepRoot,
	jobs: { enqueueJob: typeof enqueueJob; awaitJob: typeof awaitJob },
): Promise<SweepResult | undefined> {
	const id = await jobs.enqueueJob({
		type: "encrypt",
		spec: {
			root,
			excludes,
			rewrapOnly,
			budget: SWEEP_BUDGET,
			budgetBytes: SWEEP_BUDGET_BYTES,
			after: cursors.get(root) ?? "",
		},
		dedupeKey: `encrypt:${root}`,
		priority: "background",
	});
	const job = await jobs.awaitJob(id, {
		timeoutMs: SWEEP_TIMEOUT_MS,
		consume: true,
		cancelOnTimeout: false,
	});
	if (job?.status !== "succeeded" || !job.result) {
		logger.warn(
			`Encryption sweep of ${root} did not finish: ${job?.error ?? "timed out"}`,
		);
		return undefined;
	}
	const result = JSON.parse(job.result) as SweepResult;
	cursors.set(root, result.next ?? "");
	for (const failure of result.failed) {
		logger.warn(`Encryption sweep skipped ${failure.path}: ${failure.error}`);
	}
	if (result.sealed + result.rewrapped > 0 || result.more) {
		logger.info(
			`Encryption sweep of ${root}: sealed ${result.sealed}, rewrapped ${result.rewrapped}${result.more ? ", more to do" : ", done"}`,
		);
	}
	return result;
}

/** One budgeted pass per root. True once nothing is left to do anywhere. */
export async function sweepOnce(
	jobs = { enqueueJob, awaitJob },
): Promise<boolean> {
	let done = true;
	let clean = true;
	for (const root of sweepRoots()) {
		const result = await sweepRoot(root, jobs);
		done &&= result?.more === false;
		clean &&= result?.failed.length === 0;
	}
	if (done && clean && keyring().previous.length > 0) {
		logger.info(
			"Every sealed file is on the current key: ENCRYPTION_KEY_PREVIOUS can be removed",
		);
	}
	return done;
}

/** Survives Vite HMR, so a hot reload doesn't stack up duplicate timers. */
const globalForSweep = globalThis as unknown as {
	__encryption_timer?: ReturnType<typeof setInterval>;
	__encryption_running?: boolean;
};

/** Runs until a pass finds nothing left; a restart checks again once. */
export function startEncryptionSweep(): void {
	if (!keyring().current || globalForSweep.__encryption_timer) {
		return;
	}
	const tick = async () => {
		if (globalForSweep.__encryption_running) {
			return;
		}
		globalForSweep.__encryption_running = true;
		try {
			if (await sweepOnce()) {
				clearInterval(globalForSweep.__encryption_timer);
			}
		} catch (error) {
			logger.warn("Encryption sweep failed", error);
		} finally {
			globalForSweep.__encryption_running = false;
		}
	};
	globalForSweep.__encryption_timer = setInterval(
		() => void tick(),
		SWEEP_INTERVAL_MS,
	);
	globalForSweep.__encryption_timer.unref?.();
	void tick();
}
