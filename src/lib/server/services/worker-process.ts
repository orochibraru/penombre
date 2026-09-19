import { tmpdir } from "node:os";
import { join } from "node:path";
import { Logger } from "#lib/logger.js";
import { getConfig } from "#lib/server/config.js";
import { getDbUrl } from "#lib/server/db/index.js";
import { dev } from "$app/env";

const logger = new Logger("Worker");

/**
 * Dev builds then `exec`s, so the pid we signal is the worker itself: `go run`
 * does not forward SIGTERM to the binary it built, which kept polling the DB.
 */
export function workerCommand(isDev: boolean): string[] {
	if (!isDev) {
		return ["/usr/local/bin/penombre-worker"];
	}
	const bin = join(tmpdir(), "penombre-worker-dev");
	return ["sh", "-c", `go build -o '${bin}' ./cmd/worker && exec '${bin}'`];
}

export function nextDelay(previous: number, uptimeMs: number): number {
	return uptimeMs > 60_000 ? 1000 : Math.min(previous * 2, 30_000);
}

type Spawn = (
	command: string[],
	options: {
		env: Record<string, string | undefined>;
		stdout: "inherit";
		stderr: "inherit";
		onExit: (proc: unknown, code: number | null) => void;
	},
) => { kill: (signal?: NodeJS.Signals) => void };

/**
 * Keeps one worker process alive, restarting it with backoff. A missing
 * binary throws synchronously from spawn; that is retried the same way, not
 * allowed to take the app down. Returns a stop function.
 */
export function superviseWorker(
	command: string[],
	env: Record<string, string | undefined>,
	spawn: Spawn = Bun.spawn as unknown as Spawn,
): () => void {
	let child: ReturnType<Spawn> | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let stopping = false;
	let delay = 500;

	const retry = (startedAt: number) => {
		delay = nextDelay(delay, Date.now() - startedAt);
		timer = setTimeout(start, delay);
		return delay;
	};
	function start() {
		const startedAt = Date.now();
		try {
			child = spawn(command, {
				env,
				stdout: "inherit",
				stderr: "inherit",
				onExit: (_proc, code) => {
					if (!stopping) {
						logger.warn(
							`Worker exited (code ${code}), restarting in ${retry(startedAt)}ms`,
						);
					}
				},
			});
		} catch (error) {
			logger.error(
				`Could not start the worker (${command[0]}), retrying in ${retry(startedAt)}ms. ` +
					"Set WORKER_MODE=external to run it as its own container.",
				error,
			);
		}
	}
	start();

	return () => {
		stopping = true;
		clearTimeout(timer);
		child?.kill("SIGTERM");
	};
}

const globalForWorker = globalThis as unknown as {
	__embedded_worker_started?: boolean;
};

/**
 * Spawns the Go worker in-process. No-op in external mode, where a separate
 * `penombre-worker` container is expected to point at the same database.
 */
export function startEmbeddedWorker(): void {
	const { worker } = getConfig();
	if (worker.mode === "external") {
		logger.info("WORKER_MODE=external: expecting a separate worker container");
		return;
	}
	// `init()` can re-run under HMR in dev; only ever one child process.
	if (globalForWorker.__embedded_worker_started) {
		return;
	}
	globalForWorker.__embedded_worker_started = true;

	const stop = superviseWorker(workerCommand(dev), {
		...process.env,
		DATABASE_URL: getDbUrl(),
		WORKER_CONCURRENCY: String(worker.concurrency),
		// Lets the worker exit when a killed app never tells it to.
		WORKER_PARENT_PID: String(process.pid),
	});
	process.once("SIGTERM", stop);
	process.once("SIGINT", stop);
	process.once("exit", stop);
}
