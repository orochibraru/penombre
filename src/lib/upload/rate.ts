/**
 * Transfer speed as an exponentially weighted moving average.
 *
 * The average since the batch started reacts to nothing: ten minutes in, a
 * stalled connection still reads as full speed. Weighting recent samples by
 * a half-life follows the link within seconds without jumping on each burst.
 */

/** Progress events come in bursts; closer samples are merged into one. */
const MIN_INTERVAL_MS = 500;
const HALF_LIFE_MS = 3000;
/** Before this, one lucky burst is the whole average. */
const WARMUP_MS = 2000;

export class TransferRate {
	#start: number | undefined;
	#last: { at: number; bytes: number } | undefined;
	#speed = 0;

	/** Record the cumulative bytes sent so far. */
	sample(bytes: number, now = Date.now()): void {
		if (!this.#last) {
			this.#start = now;
			this.#last = { at: now, bytes };
			return;
		}
		const elapsed = now - this.#last.at;
		if (elapsed < MIN_INTERVAL_MS) {
			return;
		}
		// A retried file restarts from zero; that is not negative throughput.
		const instant = (Math.max(0, bytes - this.#last.bytes) * 1000) / elapsed;
		const weight = 1 - 2 ** (-elapsed / HALF_LIFE_MS);
		this.#speed =
			this.#speed === 0
				? instant
				: this.#speed + weight * (instant - this.#speed);
		this.#last = { at: now, bytes };
	}

	/** Bytes per second, 0 until known. */
	speed(now = Date.now()): number {
		return this.#warm(now) ? this.#speed : 0;
	}

	/** Whole seconds left for `remaining` bytes, 0 when unknown. */
	eta(remaining: number, now = Date.now()): number {
		const speed = this.speed(now);
		return speed > 0 && remaining > 0 ? Math.ceil(remaining / speed) : 0;
	}

	#warm(now: number): boolean {
		return this.#start !== undefined && now - this.#start >= WARMUP_MS;
	}
}
