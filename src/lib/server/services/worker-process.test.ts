import { describe, expect, mock, test } from "bun:test";
import { nextDelay, superviseWorker, workerCommand } from "./worker-process";

describe("workerCommand", () => {
	// `go run` keeps its child alive past SIGTERM; exec makes the pid ours.
	test("dev builds the Go source and execs the binary", () => {
		const [shell, flag, script] = workerCommand(true);
		expect([shell, flag]).toEqual(["sh", "-c"]);
		expect(script).toMatch(/^go build -o '(.+)' \.\/cmd\/worker && exec '\1'$/);
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
});
