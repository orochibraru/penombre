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

import * as dbModule from "#lib/server/db/index.js";
import { files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as storageFor from "#lib/server/services/storage-for.js";

import {
	type Root,
	startDurationSweeper,
	sweepMissingDurations,
} from "./duration-sweep";

describe("sweepMissingDurations", () => {
	// Full-mode drives and shared drives are never library-scanned; this is
	// the only thing that retries a duration their upload failed to record.
	test("visits every root holding a media row with no duration, once each", async () => {
		const database = migratedSqlite();
		for (const id of ["alice", "bob"]) {
			await database.insert(user).values({ id, name: id, email: `${id}@x` });
		}
		const add = (
			id: string,
			ownerId: string,
			volumeId: string | null,
			extra = {},
		) =>
			database.insert(files).values({
				id,
				name: id,
				path: id,
				category: "MUSIC",
				ownerId,
				volumeId,
				...extra,
			});
		await add("a1", "alice", null);
		await add("a2", "alice", null);
		await add("a3", "alice", "drive:d1");
		await add("b1", "bob", null, { musicDuration: 3 });
		await add("b2", "bob", "media", { category: "DOCUMENTS" });

		const visited: Root[] = [];
		await sweepMissingDurations(database, async (_db, root) => {
			visited.push(root);
			return { probeMissingDurations: async () => {} };
		});

		expect(visited).toHaveLength(2);
		expect(visited).toContainEqual({ ownerId: "alice", volumeId: null });
		expect(visited).toContainEqual({ ownerId: "alice", volumeId: "drive:d1" });
	});

	test("never throws", async () => {
		const database = migratedSqlite();
		await database.insert(user).values({ id: "a", name: "a", email: "a@x" });
		await database.insert(files).values({
			id: "f",
			name: "f",
			path: "f",
			category: "MUSIC",
			ownerId: "a",
		});
		await expect(
			sweepMissingDurations(database, async () => {
				throw new Error("boom");
			}),
		).resolves.toBeUndefined();
	});
});

describe("the default resolver", () => {
	test("opens each root through its storage service and probes it", async () => {
		const database = migratedSqlite();
		await database.insert(user).values({ id: "a", name: "a", email: "a@x" });
		await database.insert(files).values({
			id: "f",
			name: "f",
			path: "f",
			category: "MUSIC",
			ownerId: "a",
		});
		const probe = mock(async () => {});
		const serviceForRoot = spyOn(
			storageFor,
			"serviceForRoot",
		).mockResolvedValue({ probeMissingDurations: probe } as never);
		try {
			await sweepMissingDurations(database);
			expect(serviceForRoot).toHaveBeenCalledWith({
				ownerId: "a",
				volumeId: null,
			});
			expect(probe).toHaveBeenCalledTimes(1);
		} finally {
			serviceForRoot.mockRestore();
		}
	});
});

describe("startDurationSweeper", () => {
	const timers = globalThis as unknown as {
		__duration_timer?: unknown;
		__duration_running?: boolean;
	};
	let ticks: (() => void)[];
	let setIntervalSpy: ReturnType<typeof spyOn>;
	let getDbSpy: ReturnType<typeof spyOn>;
	let selectDistinct: Mock<() => never>;

	beforeEach(() => {
		ticks = [];
		const unref = mock(() => {});
		setIntervalSpy = spyOn(globalThis, "setInterval").mockImplementation(((
			callback: () => void,
		) => {
			ticks.push(callback);
			return { unref };
		}) as never);
		selectDistinct = mock(() => {
			throw new Error("no database in this test");
		});
		getDbSpy = spyOn(dbModule, "getDb").mockReturnValue({
			selectDistinct,
		} as never);
	});

	afterEach(() => {
		setIntervalSpy.mockRestore();
		getDbSpy.mockRestore();
		delete timers.__duration_timer;
		delete timers.__duration_running;
	});

	test("schedules one sweep a minute, once per process", () => {
		startDurationSweeper();
		startDurationSweeper();
		expect(setIntervalSpy).toHaveBeenCalledTimes(1);
		expect(setIntervalSpy.mock.calls[0]?.[1]).toBe(60_000);
	});

	test("each tick sweeps, and a failed sweep does not wedge the next", async () => {
		startDurationSweeper();
		ticks[0]?.();
		await Bun.sleep(0);
		expect(selectDistinct).toHaveBeenCalledTimes(1);
		expect(timers.__duration_running).toBe(false);
		ticks[0]?.();
		await Bun.sleep(0);
		expect(selectDistinct).toHaveBeenCalledTimes(2);
	});

	test("a tick while a sweep is still running does nothing", async () => {
		startDurationSweeper();
		timers.__duration_running = true;
		ticks[0]?.();
		await Bun.sleep(0);
		expect(selectDistinct).not.toHaveBeenCalled();
	});
});
