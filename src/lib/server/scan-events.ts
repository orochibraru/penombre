import {
	type ScanStatus,
	scanStatus,
	subscribeScan,
} from "#lib/server/services/library-scan.js";

/** Proxies drop an idle stream; a comment line every so often keeps it open. */
const KEEPALIVE_MS = 15_000;

/**
 * A `text/event-stream` of one scan's status: the state now, then every change
 * until the client goes.
 */
export function scanEventStream(key: string, request: Request): Response {
	const encoder = new TextEncoder();
	let close: () => void = () => undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const send = (chunk: string) => {
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					close();
				}
			};
			const push = (status: ScanStatus) =>
				send(`data: ${JSON.stringify(status)}\n\n`);

			const unsubscribe = subscribeScan(key, push);
			const keepalive = setInterval(
				() => send(": keepalive\n\n"),
				KEEPALIVE_MS,
			);
			close = () => {
				unsubscribe();
				clearInterval(keepalive);
			};
			request.signal.addEventListener("abort", () => {
				close();
				try {
					controller.close();
				} catch {
					// already closed
				}
			});
			push(scanStatus(key));
		},
		cancel() {
			close();
		},
	});

	return new Response(stream, {
		headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-cache, no-transform",
			// nginx buffers responses by default, which would hold every event.
			"x-accel-buffering": "no",
		},
	});
}
