import {
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	mock,
	spyOn,
	test,
} from "bun:test";

import { getConfig } from "#lib/server/config.js";
import { keyId } from "#lib/server/crypto/envelope.js";
import type { AppSettingsData } from "#lib/server/db/schema.js";

import {
	assertEncryptionKey,
	startEncryptionSweep,
	sweepOnce,
} from "./encryption";

const key = (byte: number) => Buffer.alloc(32, byte);
const id = (byte: number) => keyId(key(byte)).toString("hex");

function store(initial: AppSettingsData = {}) {
	let settings = initial;
	return {
		get: async () => settings,
		update: mock(async (updates: Partial<AppSettingsData>) => {
			settings = { ...settings, ...updates };
		}),
		read: () => settings,
	};
}

describe("assertEncryptionKey", () => {
	test("does nothing on a plaintext instance", async () => {
		const settings = store();
		await assertEncryptionKey({ previous: [] }, settings);
		expect(settings.update).not.toHaveBeenCalled();
	});

	test("records the key on first boot with one", async () => {
		const settings = store();
		await assertEncryptionKey({ current: key(1), previous: [] }, settings);
		expect(settings.read().encryptionKeyId).toBe(id(1));
	});

	test("refuses to boot without the key once files are sealed", async () => {
		await expect(
			assertEncryptionKey({ previous: [] }, store({ encryptionKeyId: id(1) })),
		).rejects.toThrow("ENCRYPTION_KEY is not set");
	});

	test("refuses a different key unless the old one is kept as previous", async () => {
		await expect(
			assertEncryptionKey(
				{ current: key(2), previous: [] },
				store({ encryptionKeyId: id(1) }),
			),
		).rejects.toThrow("ENCRYPTION_KEY_PREVIOUS");

		const settings = store({ encryptionKeyId: id(1) });
		await assertEncryptionKey(
			{ current: key(2), previous: [key(1)] },
			settings,
		);
		expect(settings.read().encryptionKeyId).toBe(id(2));
	});
});

describe("sweepOnce", () => {
	const result = (outcome: object) => ({
		enqueueJob: mock(async (_input: unknown) => "job-1"),
		awaitJob: mock(async () => ({
			status: "succeeded" as const,
			error: null,
			result: JSON.stringify(outcome),
		})),
	});

	test("enqueues a deduped background pass over the storage root", async () => {
		const jobs = result({
			sealed: 3,
			rewrapped: 0,
			more: true,
			next: "/tmp/penombre-test-storage/b",
			failed: [],
		});
		expect(await sweepOnce(jobs)).toBe(false);
		expect(jobs.enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			type: "encrypt",
			dedupeKey: "encrypt:/tmp/penombre-test-storage",
			priority: "background",
			spec: { root: "/tmp/penombre-test-storage", budget: 2000 },
		});
	});

	test("the next pass resumes where the last one stopped", async () => {
		const jobs = result({
			sealed: 0,
			rewrapped: 0,
			more: false,
			next: "",
			failed: [],
		});
		expect(await sweepOnce(jobs)).toBe(true);
		expect(jobs.enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			spec: { after: "/tmp/penombre-test-storage/b" },
		});
		await sweepOnce(jobs);
		expect(jobs.enqueueJob.mock.calls[1]?.[0]).toMatchObject({
			spec: { after: "" },
		});
	});

	test("a failed job is not done", async () => {
		const jobs = {
			enqueueJob: mock(async () => "job-1"),
			awaitJob: mock(async () => ({
				status: "failed" as const,
				error: "no key",
				result: null,
			})),
		};
		expect(await sweepOnce(jobs)).toBe(false);
	});
});

const restorers: (() => void)[] = [];

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

afterEach(() => {
	for (const restore of restorers.splice(0).toReversed()) {
		restore();
	}
});

describe("with mounted volumes and a retired key", () => {
	function configured(previousKeys: Buffer[]) {
		override(
			getConfig,
			() =>
				({
					encryption: { key: key(2), previous: previousKeys },
					volumes: [
						{ name: "inside", path: "/tmp/penombre-test-storage/inside" },
						{ name: "media", path: "/mnt/media" },
						{ name: "archive", path: "/mnt/archive", readOnly: true },
					],
				}) as never,
		);
	}

	const outcome = (failed: object[] = []) => ({
		enqueueJob: mock(async (_input: unknown) => "job-1"),
		awaitJob: mock(async () => ({
			status: "succeeded" as const,
			error: null,
			result: JSON.stringify({
				sealed: 0,
				rewrapped: 1,
				more: false,
				next: "",
				failed,
			}),
		})),
	});

	test("the storage root skips volumes inside it; writable volumes are rewrapped", async () => {
		configured([key(1)]);
		const jobs = outcome();
		expect(await sweepOnce(jobs)).toBe(true);
		const specs = jobs.enqueueJob.mock.calls.map(
			(call) => (call[0] as { spec: object }).spec,
		);
		expect(specs).toEqual([
			expect.objectContaining({
				root: "/tmp/penombre-test-storage",
				excludes: ["/tmp/penombre-test-storage/inside"],
				rewrapOnly: false,
			}),
			expect.objectContaining({
				root: "/tmp/penombre-test-storage/inside",
				rewrapOnly: true,
			}),
			expect.objectContaining({ root: "/mnt/media", rewrapOnly: true }),
		]);
	});

	test("without a retired key, volumes are left alone", async () => {
		configured([]);
		const jobs = outcome([
			{ path: "/tmp/penombre-test-storage/x", error: "EIO" },
		]);
		expect(await sweepOnce(jobs)).toBe(true);
		expect(jobs.enqueueJob).toHaveBeenCalledTimes(1);
	});
});

describe("startEncryptionSweep", () => {
	const timers = globalThis as unknown as {
		__encryption_timer?: unknown;
		__encryption_running?: boolean;
	};
	let ticks: (() => void)[];
	let setIntervalSpy: ReturnType<typeof spyOn>;
	let reads: number;

	beforeEach(() => {
		ticks = [];
		reads = 0;
		setIntervalSpy = spyOn(globalThis, "setInterval").mockImplementation(((
			callback: () => void,
		) => {
			ticks.push(callback);
			return { unref: () => undefined };
		}) as never);
	});

	afterEach(() => {
		setIntervalSpy.mockRestore();
		delete timers.__encryption_timer;
		delete timers.__encryption_running;
	});

	/** A key to start with; every later read (the sweep's own) fails. */
	function keyThenBroken() {
		override(getConfig, () => {
			reads += 1;
			if (reads > 1) {
				throw new Error("config is gone");
			}
			return { encryption: { key: key(1), previous: [] } } as never;
		});
	}

	test("does nothing on a plaintext instance", () => {
		startEncryptionSweep();
		expect(setIntervalSpy).not.toHaveBeenCalled();
	});

	test("sweeps at once and every minute, and survives a failed pass", async () => {
		keyThenBroken();
		startEncryptionSweep();
		expect(setIntervalSpy).toHaveBeenCalledTimes(1);
		expect(setIntervalSpy.mock.calls[0]?.[1]).toBe(60_000);
		await Bun.sleep(0);
		expect(reads).toBe(2);
		expect(timers.__encryption_running).toBe(false);

		ticks[0]?.();
		await Bun.sleep(0);
		expect(reads).toBe(3);
	});

	test("one timer per process, and a tick never overlaps a pass", async () => {
		keyThenBroken();
		startEncryptionSweep();
		await Bun.sleep(0);
		timers.__encryption_running = true;
		ticks[0]?.();
		expect(reads).toBe(2);
		timers.__encryption_running = false;
		reads = 0;
		startEncryptionSweep();
		expect(setIntervalSpy).toHaveBeenCalledTimes(1);
	});
});
