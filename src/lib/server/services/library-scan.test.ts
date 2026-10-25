import {
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	setSystemTime,
	spyOn,
	test,
} from "bun:test";

import * as config from "#lib/server/config.js";
import type { Database } from "#lib/server/db/index.js";
import * as dbModule from "#lib/server/db/index.js";
import { user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as storageIndex from "#lib/server/services/storage/index.js";
import type {
	ScanReporter,
	ScanStep,
} from "#lib/server/services/storage/scan.js";

import {
	isScanning,
	LIBRARY_SCAN_KEY,
	loadSharedOwner,
	requestLibraryScan,
	scanLibrary,
	scanningEnabled,
	scanNow,
	scanOnVisit,
	type ScanStatus,
	scanStatus,
	startLibraryScanner,
	subscribeScan,
	volumeScanKey,
} from "./library-scan";

const scanGlobals = globalThis as unknown as {
	__scan_timer?: unknown;
	__scan_owner_timer?: unknown;
	__scan_running?: boolean;
	__shared_owner?: unknown;
};

/** Long ago, so a pass recorded here never puts a real visit in cooldown. */
const START = 1_000_000_000_000;

const restorers: (() => void)[] = [];

function watch<T extends { mockRestore(): void }>(spy: T): T {
	restorers.push(() => spy.mockRestore());
	return spy;
}

/**
 * test.setup's mocks are shared by every suite, and `mockRestore` on one
 * wipes it: swap its behaviour for this test, then put back what it had.
 */
function override<T extends (...args: never[]) => unknown>(
	fn: T,
	implementation: (...args: Parameters<T>) => unknown,
): Mock<T> {
	const mocked = fn as unknown as Mock<T>;
	const previous = mocked.getMockImplementation();
	// A `mockReturnValue` leaves no implementation behind, only its value.
	const value = previous ? undefined : mocked(...([] as Parameters<T>));
	mocked.mockClear();
	mocked.mockImplementation(implementation as unknown as T);
	restorers.push(() => {
		if (previous) {
			mocked.mockImplementation(previous);
		} else {
			mocked.mockReturnValue(value as ReturnType<T>);
		}
	});
	return mocked;
}

function configure(simpleMode: boolean, volumes: object[] = []) {
	override(config.isSimpleMode, () => simpleMode);
	override(config.getVolumes, () => volumes);
}

beforeEach(() => {
	setSystemTime(new Date(START));
});

afterEach(() => {
	for (const restore of restorers.splice(0).toReversed()) {
		restore();
	}
	setSystemTime();
	delete scanGlobals.__scan_timer;
	delete scanGlobals.__scan_owner_timer;
	delete scanGlobals.__scan_running;
	delete scanGlobals.__shared_owner;
});

function freshKey(): string {
	return volumeScanKey(crypto.randomUUID());
}

function deferred() {
	let resolve: () => void = () => undefined;
	let reject: (error: Error) => void = () => undefined;
	const promise = new Promise<void>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
}

/** A pass that reports through `report` and ends when told to. */
function controlledPass() {
	const end = deferred();
	const pass = { report: (_step: ScanStep) => {}, ...end };
	const run = (report: ScanReporter) => {
		pass.report = report;
		return end.promise;
	};
	return { pass, run };
}

/** Every status sent for `key`, and a promise for the end of the pass. */
function listen(key: string) {
	const statuses: ScanStatus[] = [];
	let idle: () => void = () => undefined;
	const ended = new Promise<void>((done) => {
		idle = done;
	});
	const unsubscribe = subscribeScan(key, (status) => {
		statuses.push(status);
		if (!status.scanning) {
			idle();
		}
	});
	return { statuses, ended, unsubscribe };
}

async function until(condition: () => boolean) {
	for (let attempt = 0; attempt < 500 && !condition(); attempt++) {
		await Bun.sleep(1);
	}
	expect(condition()).toBe(true);
}

describe("scan keys", () => {
	test("a volume's passes are tracked apart from the shared drive's", () => {
		expect(volumeScanKey("media")).toBe("volume:media");
		expect(LIBRARY_SCAN_KEY).toBe("library");
	});
});

describe("scanNow", () => {
	test("runs one pass at a time and tells subscribers how it goes", async () => {
		const key = freshKey();
		const { statuses, ended, unsubscribe } = listen(key);
		const { pass, run } = controlledPass();
		let second = 0;

		expect(scanNow(key, run)).toBe(true);
		expect(isScanning(key)).toBe(true);
		expect(
			scanNow(key, async () => {
				second += 1;
			}),
		).toBe(false);
		expect(statuses).toEqual([{ scanning: true }]);

		pass.report({ phase: "listing", done: 0, total: 0 });
		// Same phase within a quarter second: not worth a message.
		pass.report({ phase: "listing", done: 1, total: 0 });
		expect(statuses).toHaveLength(2);
		expect(scanStatus(key).step).toEqual({
			phase: "listing",
			done: 1,
			total: 0,
		});

		setSystemTime(new Date(START + 250));
		pass.report({ phase: "listing", done: 2, total: 0 });
		expect(statuses).toHaveLength(3);

		pass.report({ phase: "files", done: 0, total: 10 });
		setSystemTime(new Date(START + 2250));
		pass.report({ phase: "files", done: 4, total: 10 });
		expect(statuses.at(-1)).toEqual({
			scanning: true,
			step: { phase: "files", done: 4, total: 10 },
			etaSeconds: 3,
		});

		pass.resolve();
		await ended;
		expect(statuses.at(-1)).toEqual({ scanning: false });
		expect(isScanning(key)).toBe(false);
		expect(scanStatus(key)).toEqual({ scanning: false });
		expect(second).toBe(0);

		unsubscribe();
		expect(scanNow(key, async () => {})).toBe(true);
		await Promise.resolve();
		expect(statuses.at(-1)).toEqual({ scanning: false });
	});

	test("a pass that fails still ends, and the next one can start", async () => {
		const key = freshKey();
		const { ended } = listen(key);
		const { pass, run } = controlledPass();

		scanNow(key, run);
		pass.reject(new Error("mount went away"));
		await ended;

		expect(isScanning(key)).toBe(false);
		expect(scanNow(key, async () => {})).toBe(true);
	});

	test("a step outside the files phase carries no estimate", () => {
		const key = freshKey();
		const { pass, run } = controlledPass();
		scanNow(key, run);
		pass.report({ phase: "cleanup", done: 5, total: 10 });
		expect(scanStatus(key)).toEqual({
			scanning: true,
			step: { phase: "cleanup", done: 5, total: 10 },
			etaSeconds: undefined,
		});
		pass.resolve();
	});
});

describe("scanOnVisit", () => {
	test("reports a pass in flight without starting another", async () => {
		const key = freshKey();
		const { ended } = listen(key);
		const { pass, run } = controlledPass();
		let extra = 0;

		expect(scanOnVisit(key, run)).toBe(true);
		expect(
			scanOnVisit(key, async () => {
				extra += 1;
			}),
		).toBe(true);
		pass.resolve();
		await ended;
		expect(extra).toBe(0);
	});

	// Without the cooldown, the page's own poll would start a pass the moment
	// the last one ended and the banner would never go away.
	test("waits thirty seconds after a pass before starting another", async () => {
		const key = freshKey();
		const { ended } = listen(key);
		let runs = 0;
		const run = async () => {
			runs += 1;
		};

		expect(scanOnVisit(key, run)).toBe(true);
		await ended;
		setSystemTime(new Date(START + 29_999));
		expect(scanOnVisit(key, run)).toBe(false);
		setSystemTime(new Date(START + 30_000));
		expect(scanOnVisit(key, run)).toBe(true);
		expect(runs).toBe(2);
	});

	test("the Rescan button ignores the cooldown", async () => {
		const key = freshKey();
		const { ended } = listen(key);
		scanOnVisit(key, async () => {});
		await ended;
		expect(scanOnVisit(key, async () => {})).toBe(false);
		expect(scanNow(key, async () => {})).toBe(true);
	});
});

describe("scanningEnabled", () => {
	test("only simple mode or a mounted volume has anything to scan", () => {
		configure(false);
		expect(scanningEnabled()).toBe(false);
		configure(true);
		expect(scanningEnabled()).toBe(true);
		configure(false, [{ name: "media", path: "/mnt/media" }]);
		expect(scanningEnabled()).toBe(true);
	});
});

describe("with a database", () => {
	let database: Database;
	let built: { args: unknown[]; scanned: boolean }[];
	const media = { name: "media", path: "/mnt/media" };

	async function addAccount(id: string, createdAt: number) {
		await database.insert(user).values({
			id,
			name: id,
			email: `${id}@x.test`,
			createdAt: new Date(createdAt),
		});
	}

	beforeEach(() => {
		database = migratedSqlite();
		built = [];
		watch(spyOn(dbModule, "getDb")).mockReturnValue(database);
		watch(spyOn(storageIndex, "StorageService")).mockImplementation(function (
			...args: unknown[]
		) {
			const entry = { args, scanned: false };
			built.push(entry);
			return {
				scanStorage: async (report: ScanReporter) => {
					expect(report).toBeFunction();
					entry.scanned = true;
				},
			};
		} as never);
	});

	describe("loadSharedOwner", () => {
		test("is the first account ever created", async () => {
			await addAccount("second", 2000);
			await addAccount("first", 1000);
			expect(await loadSharedOwner()).toMatchObject({ id: "first" });
		});

		// A fresh instance has nobody until setup runs: caching that miss
		// pinned simple mode to never scanning again.
		test("a miss is not remembered, a hit is", async () => {
			expect(await loadSharedOwner()).toBeUndefined();
			await addAccount("admin", 2000);
			expect(await loadSharedOwner()).toMatchObject({ id: "admin" });
			await addAccount("older", 1000);
			expect(await loadSharedOwner()).toMatchObject({ id: "admin" });
		});
	});

	describe("scanLibrary", () => {
		test("scans the shared drive, then every volume, as the shared owner", async () => {
			await addAccount("admin", 1000);
			configure(true, [media]);

			await scanLibrary();

			expect(built.map((entry) => entry.args)).toEqual([
				[expect.objectContaining({ id: "admin" })],
				[expect.objectContaining({ id: "admin" }), media],
			]);
			expect(built.every((entry) => entry.scanned)).toBe(true);
			expect(scanGlobals.__scan_running).toBe(false);
		});

		test("full mode scans only the volumes", async () => {
			await addAccount("admin", 1000);
			configure(false, [media]);
			await scanLibrary();
			expect(built.map((entry) => entry.args[1])).toEqual([media]);
		});

		test("simple mode with no volume scans only the shared drive", async () => {
			await addAccount("admin", 1000);
			configure(true);
			await scanLibrary();
			expect(built).toHaveLength(1);
		});

		test("scans nothing until there is an owner", async () => {
			configure(true, [media]);
			await scanLibrary();
			expect(built).toEqual([]);
			expect(scanGlobals.__scan_running).toBe(false);
		});

		test("leaves a pass that is still running alone", async () => {
			await addAccount("admin", 1000);
			configure(true, [media]);
			scanGlobals.__scan_running = true;
			await scanLibrary();
			expect(built).toEqual([]);
		});

		test("an unreadable database fails the pass, never the caller", async () => {
			configure(true);
			watch(spyOn(dbModule, "getDb")).mockImplementation(() => {
				throw new Error("database is gone");
			});
			await expect(scanLibrary()).resolves.toBeUndefined();
			expect(scanGlobals.__scan_running).toBe(false);
		});
	});

	describe("requestLibraryScan", () => {
		test("does nothing on an instance with nothing to scan", async () => {
			await addAccount("admin", 1000);
			configure(false);
			requestLibraryScan();
			expect(scanGlobals.__scan_running).toBeUndefined();
			expect(built).toEqual([]);
		});

		test("scans at once once there is something to scan", async () => {
			await addAccount("admin", 1000);
			configure(true);
			requestLibraryScan();
			await until(() => scanGlobals.__scan_running === false);
			expect(built).toHaveLength(1);
		});
	});

	describe("startLibraryScanner", () => {
		let timers: { callback: () => void; ms: number; handle: object }[];
		let cleared: unknown[];

		beforeEach(() => {
			timers = [];
			cleared = [];
			watch(spyOn(globalThis, "setInterval")).mockImplementation(((
				callback: () => void,
				ms: number,
			) => {
				const handle = { unref: () => undefined };
				timers.push({ callback, ms, handle });
				return handle;
			}) as never);
			watch(spyOn(globalThis, "clearInterval")).mockImplementation(((
				handle: unknown,
			) => {
				cleared.push(handle);
			}) as never);
		});

		test("does nothing on an instance with nothing to scan", () => {
			configure(false);
			startLibraryScanner();
			expect(timers).toEqual([]);
		});

		test("scans at once, then every minute, from one timer", async () => {
			await addAccount("admin", 1000);
			configure(true);

			startLibraryScanner();
			startLibraryScanner();
			await until(() => built.length === 1 && !scanGlobals.__scan_running);
			expect(timers.map((timer) => timer.ms)).toEqual([60_000]);

			timers[0]?.callback();
			await until(() => built.length === 2 && !scanGlobals.__scan_running);
		});

		test("with no account yet, polls for one and then scans", async () => {
			configure(true);

			startLibraryScanner();
			await until(() => timers.length === 2);
			expect(timers.map((timer) => timer.ms)).toEqual([60_000, 2000]);
			const poll = timers[1];

			poll?.callback();
			await Bun.sleep(1);
			expect(cleared).toEqual([]);
			expect(built).toEqual([]);

			await addAccount("admin", 1000);
			poll?.callback();
			await until(() => built.length === 1 && !scanGlobals.__scan_running);
			expect(cleared).toEqual([poll?.handle]);
			expect(scanGlobals.__scan_owner_timer).toBeUndefined();
		});
	});
});
