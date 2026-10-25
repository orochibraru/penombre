import {
	afterEach,
	describe,
	expect,
	jest,
	type Mock,
	mock,
	spyOn,
	test,
} from "bun:test";

import { Logger } from "#lib/logger.js";
import { getConfig } from "#lib/server/config.js";

import {
	nextDelay,
	startEmbeddedWorker,
	superviseWorker,
	workerCommand,
} from "./worker-process";

const mockGetConfig = getConfig as Mock<typeof getConfig>;

afterEach(() => {
	jest.useRealTimers();
});

describe("workerCommand", () => {
	// `go run` keeps its child alive past SIGTERM; exec makes the pid ours.
	test("dev builds the Go source and execs the binary", () => {
		const [shell, flag, script] = workerCommand(true);
		expect([shell, flag]).toEqual(["sh", "-c"]);
		expect(script).toMatch(
			/^go -C apps\/worker build -o '(.+)' \.\/cmd\/worker && exec '\1'$/,
		);
	});
	test("production runs the installed binary", () => {
		expect(workerCommand(false)).toEqual(["/usr/local/bin/penombre-worker"]);
	});
});

describe("nextDelay", () => {
	test("doubles up to 30s", () => {
		expect(nextDelay(1000, 5_000)).toBe(2000);
		expect(nextDelay(20_000, 5_000)).toBe(30_000);
	});
	test("resets after a minute of uptime", () => {
		expect(nextDelay(16_000, 61_000)).toBe(1000);
	});
});

describe("superviseWorker", () => {
	// Bun.spawn throws synchronously on a missing binary; that took init down.
	test("a spawn that throws is retried, not propagated", () => {
		const spawn = mock(() => {
			throw new Error("ENOENT posix_spawn");
		});
		let stop = () => {};
		expect(() => {
			stop = superviseWorker(["/nope"], {}, spawn);
		}).not.toThrow();
		expect(spawn).toHaveBeenCalledTimes(1);
		stop();
	});

	test("stop kills the child and does not restart it", () => {
		const kill = mock(() => {});
		let onExit: (proc: unknown, code: number | null) => void = () => {};
		const spawn = mock((_cmd: string[], options: { onExit: typeof onExit }) => {
			onExit = options.onExit;
			return { kill };
		});
		const stop = superviseWorker(["w"], {}, spawn);
		stop();
		onExit(undefined, 143);
		expect(kill).toHaveBeenCalledWith("SIGTERM");
		expect(spawn).toHaveBeenCalledTimes(1);
	});

	test("a worker that exits is restarted after the backoff", () => {
		jest.useFakeTimers();
		const warn = spyOn(Logger.prototype, "warn");
		let onExit: (proc: unknown, code: number | null) => void = () => {};
		const spawn = mock((_cmd: string[], options: { onExit: typeof onExit }) => {
			onExit = options.onExit;
			return { kill: () => {} };
		});
		const stop = superviseWorker(["w"], { A: "1" }, spawn);
		onExit(undefined, 127);
		expect(warn.mock.calls[0]?.[0]).toContain("restarting in 1000ms");
		expect(warn.mock.calls[0]?.[0]).toContain("`go` is missing");
		jest.advanceTimersByTime(999);
		expect(spawn).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(1);
		expect(spawn).toHaveBeenCalledTimes(2);
		expect(spawn.mock.calls[1]?.[0]).toEqual(["w"]);
		onExit(undefined, 1);
		expect(warn.mock.calls[1]?.[0]).toContain("restarting in 2000ms");
		expect(warn.mock.calls[1]?.[0]).not.toContain("`go` is missing");
		stop();
		jest.advanceTimersByTime(60_000);
		expect(spawn).toHaveBeenCalledTimes(2);
		warn.mockRestore();
	});

	test("a spawn that throws is tried again once the delay passes", () => {
		jest.useFakeTimers();
		const spawn = mock(() => {
			throw new Error("ENOENT posix_spawn");
		});
		const stop = superviseWorker(["/nope"], {}, spawn);
		jest.advanceTimersByTime(1000);
		expect(spawn).toHaveBeenCalledTimes(2);
		jest.advanceTimersByTime(2000);
		expect(spawn).toHaveBeenCalledTimes(3);
		stop();
		jest.advanceTimersByTime(60_000);
		expect(spawn).toHaveBeenCalledTimes(3);
	});
});

describe("startEmbeddedWorker", () => {
	const started = globalThis as { __embedded_worker_started?: boolean };

	afterEach(() => {
		delete started.__embedded_worker_started;
	});

	function capture() {
		const kill = mock(() => {});
		const spawn = spyOn(Bun, "spawn").mockImplementation((() => ({
			kill,
		})) as never);
		const handlers = new Map<string, () => void>();
		const once = spyOn(process, "once").mockImplementation(((
			event: string,
			listener: () => void,
		) => {
			handlers.set(event, listener);
			return process;
		}) as never);
		return {
			kill,
			spawn,
			handlers,
			restore() {
				spawn.mockRestore();
				once.mockRestore();
			},
		};
	}

	/** Queued per call: another suite may leave a config with no `worker`. */
	function workerMode(mode: "embedded" | "external") {
		mockGetConfig.mockImplementationOnce(
			() => ({ ...getConfig(), worker: { mode, concurrency: 4 } }) as never,
		);
	}

	test("external mode spawns nothing", () => {
		workerMode("external");
		const worker = capture();
		try {
			startEmbeddedWorker();
			expect(worker.spawn).not.toHaveBeenCalled();
			expect(started.__embedded_worker_started).toBeUndefined();
		} finally {
			worker.restore();
		}
	});

	test("spawns the installed worker once, pointed at this app", () => {
		const worker = capture();
		try {
			workerMode("embedded");
			startEmbeddedWorker();
			workerMode("embedded");
			startEmbeddedWorker();
			expect(worker.spawn).toHaveBeenCalledTimes(1);
			const [command, options] = worker.spawn.mock.calls[0] as unknown as [
				string[],
				{ env: Record<string, string> },
			];
			expect(command).toEqual(["/usr/local/bin/penombre-worker"]);
			expect(options.env).toMatchObject({
				DATABASE_URL: "file:./data/db/penombre.sqlite",
				WORKER_CONCURRENCY: "4",
				WORKER_PARENT_PID: String(process.pid),
			});
			expect([...worker.handlers.keys()].toSorted()).toEqual([
				"SIGINT",
				"SIGTERM",
				"exit",
			]);
			worker.handlers.get("SIGTERM")?.();
			expect(worker.kill).toHaveBeenCalledWith("SIGTERM");
		} finally {
			worker.restore();
		}
	});
});
